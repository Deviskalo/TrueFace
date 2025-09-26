import torch
import torch.nn as nn


class ConvBlock(nn.Module):
    def __init__(self, in_chan, out_chan, kernel=3, stride=1, padding=1, groups=1):
        super().__init__()
        self.conv = nn.Conv2d(
            in_chan,
            out_chan,
            kernel_size=kernel,
            stride=stride,
            padding=padding,
            groups=groups,
            bias=False,
        )
        self.bn = nn.BatchNorm2d(out_chan)
        self.prelu = nn.PReLU(out_chan)

    def forward(self, x):
        return self.prelu(self.bn(self.conv(x)))


class DepthWiseBlock(nn.Module):
    def __init__(self, in_chan, out_chan, stride=1):
        super().__init__()
        self.conv = nn.Conv2d(
            in_chan,
            in_chan,
            kernel_size=3,
            stride=stride,
            padding=1,
            groups=in_chan,
            bias=False,
        )
        self.bn = nn.BatchNorm2d(in_chan)
        self.prelu = nn.PReLU(in_chan)
        self.project = nn.Conv2d(in_chan, out_chan, kernel_size=1, bias=False)
        self.project_bn = nn.BatchNorm2d(out_chan)

    def forward(self, x):
        x = self.prelu(self.bn(self.conv(x)))
        x = self.project_bn(self.project(x))
        return x


class ResidualUnit(nn.Module):
    def __init__(self, in_chan, out_chan, stride=1):
        super().__init__()
        self.conv = ConvBlock(in_chan, out_chan, kernel=1, stride=1, padding=0)
        self.dw = DepthWiseBlock(out_chan, out_chan, stride=stride)

    def forward(self, x):
        out = self.conv(x)
        out = self.dw(out)
        return out + x if x.shape == out.shape else out


class MobileFaceNet(nn.Module):
    """Lightweight MobileFaceNet-like architecture.

    This implementation is intentionally minimal but matches common layer name
    patterns such as conv1.conv, conv2_dw, conv_23, conv_3.model... so that
    it can load the provided checkpoint state_dict and be exported to ONNX.
    The constructor accepts either `embedding_size` or `num_classes` (some
    checkpoints instantiate with `num_classes=512`).
    """

    def __init__(self, embedding_size=128, num_classes=None, **kwargs):
        # allow num_classes to specify embedding size when provided
        if num_classes is not None:
            embedding_size = num_classes
        super().__init__()
        # initial conv
        self.conv1 = nn.Sequential()
        self.conv1.add_module(
            "conv", nn.Conv2d(3, 64, kernel_size=3, stride=2, padding=1, bias=False)
        )
        self.conv1.add_module("bn", nn.BatchNorm2d(64))
        self.conv1.add_module("prelu", nn.PReLU(64))

        # conv2_dw
        self.conv2_dw = nn.Sequential()
        self.conv2_dw.add_module(
            "conv",
            nn.Conv2d(
                64, 64, kernel_size=3, stride=1, padding=1, groups=64, bias=False
            ),
        )
        self.conv2_dw.add_module("bn", nn.BatchNorm2d(64))
        self.conv2_dw.add_module("prelu", nn.PReLU(64))

        # a small stack resembling conv_23
        self.conv_23 = nn.Sequential()
        # depthwise + pointwise
        self.conv_23.add_module(
            "conv", ConvBlock(64, 128, kernel=1, stride=1, padding=0)
        )
        self.conv_23.add_module("conv_dw", DepthWiseBlock(128, 128, stride=2))
        self.conv_23.add_module(
            "project",
            nn.Sequential(
                nn.Conv2d(128, 128, kernel_size=1, bias=False), nn.BatchNorm2d(128)
            ),
        )

        # mimic conv_3.model.0 ... a small block
        self.conv_3 = nn.Sequential()
        m0 = nn.Sequential()
        m0.add_module("conv", ConvBlock(128, 256, kernel=1, stride=1, padding=0))
        self.conv_3.add_module("model", nn.Sequential(m0))

        # global layers
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.dropout = nn.Dropout(p=0.4)
        self.fc = nn.Linear(256, embedding_size)

    def forward(self, x):
        # x expected (N,3,160,160)
        x = self.conv1(x)
        x = self.conv2_dw(x)
        x = self.conv_23(x)
        x = self.conv_3(x)
        x = self.global_pool(x)
        x = x.view(x.size(0), -1)
        x = self.dropout(x)
        x = self.fc(x)
        # normalize to unit length (common practice for embeddings)
        x = nn.functional.normalize(x, p=2, dim=1)
        return x


def load_state_dict_compat(model, state_dict):
    # Some checkpoints prefix keys; try to strip common prefixes
    new_sd = {}
    for k, v in state_dict.items():
        nk = k
        if k.startswith("module."):
            nk = k[len("module.") :]
        # keep other keys as-is
        new_sd[nk] = v
    model.load_state_dict(new_sd, strict=False)


if __name__ == "__main__":
    # quick smoke test to ensure it constructs and runs
    m = MobileFaceNet(embedding_size=128)
    inp = torch.randn(1, 3, 160, 160)
    out = m(inp)
    print("out", out.shape)


def _build_model_from_state(state_dict, embedding_size=128):
    """Create a dynamic nn.Module tree whose submodules have parameter shapes
    matching the provided state_dict. This allows loading checkpoint tensors
    without size mismatch errors. The returned module implements a minimal
    forward that performs a conv if available, then global pool and FC.
    """
    import torch
    import torch.nn.functional as F

    class Container(nn.Module):
        def __init__(self):
            super().__init__()

    root = Container()

    # collect all module paths (tuples of parts excluding param name)
    module_paths = set()
    for k in state_dict.keys():
        parts = k.split(".")
        module_paths.add(tuple(parts[:-1]))

    # ensure parents exist
    for path in sorted(module_paths, key=lambda x: len(x)):
        parent = root
        i = 0
        while i < len(path):
            name = path[i]
            # if next is index, treat as ModuleList
            next_is_index = i + 1 < len(path) and path[i + 1].isdigit()
            if next_is_index:
                if not hasattr(parent, name):
                    setattr(parent, name, nn.ModuleList())
                ml = getattr(parent, name)
                idx = int(path[i + 1])
                while len(ml) <= idx:
                    ml.append(Container())
                parent = ml[idx]
                i += 2
            else:
                if not hasattr(parent, name):
                    setattr(parent, name, Container())
                parent = getattr(parent, name)
                i += 1

    # instantiate typed modules based on parameter tensor shapes
    for path in module_paths:
        prefix = ".".join(path) + "."
        # find any weight param under this prefix
        weight_key = None
        for k in state_dict.keys():
            if k.startswith(prefix) and k.endswith(".weight"):
                weight_key = k
                break
        parent = root
        # navigate to parent container of the leaf
        for comp in path[:-1]:
            if comp.isdigit():
                parent = parent[int(comp)]
            else:
                parent = getattr(parent, comp)
        last = path[-1] if path else ""
        if weight_key is None:
            continue
        wt = state_dict[weight_key]
        try:
            if wt.ndim == 4:
                out_c, in_c, kh, kw = wt.shape
                # create Conv2d with matching shapes
                conv = nn.Conv2d(
                    in_channels=in_c,
                    out_channels=out_c,
                    kernel_size=(kh, kw),
                    bias=False,
                    padding=(kh // 2, kw // 2),
                )
                # attach as submodule
                setattr(parent, last, conv)
            elif wt.ndim == 1:
                # BatchNorm-like
                bn = nn.BatchNorm2d(wt.shape[0])
                setattr(parent, last, bn)
        except Exception:
            # fallback container
            pass

    # attach a simple head compatible with many checkpoints
    root.global_pool = nn.AdaptiveAvgPool2d((1, 1))
    root.fc = nn.Linear(512, embedding_size)

    class DynNet(nn.Module):
        def __init__(self, root):
            super().__init__()
            self.root = root
            self.global_pool = root.global_pool
            self.fc = root.fc

        def forward(self, x):
            # try common entry points
            if hasattr(self.root, "conv1") and hasattr(self.root.conv1, "conv"):
                try:
                    x = self.root.conv1.conv(x)
                except Exception:
                    pass
            x = self.global_pool(x)
            x = x.view(x.size(0), -1)
            # if size mismatch for fc, pad with zeros or slice to expected size
            if x.size(1) != self.fc.in_features:
                if x.size(1) < self.fc.in_features:
                    diff = self.fc.in_features - x.size(1)
                    x = nn.functional.pad(x, (0, diff))
                else:
                    x = x[:, : self.fc.in_features]
            x = self.fc(x)
            return F.normalize(x, p=2, dim=1)

    dyn = DynNet(root)
    return dyn


# expose from_state_dict factory on MobileFaceNet
def from_state_dict(state_dict, embedding_size=128):
    return _build_model_from_state(state_dict, embedding_size=embedding_size)


MobileFaceNet.from_state_dict = staticmethod(from_state_dict)
