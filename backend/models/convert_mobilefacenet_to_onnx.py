#!/usr/bin/env python3
"""
Convert a MobileFaceNet PyTorch checkpoint to ONNX.

Usage:
  # ensure CPU torch is installed in the venv
  CHECKPOINT_URL=https://huggingface.co/.../mobilefacenet_model_best.pth.tar \
  python3 backend/models/convert_mobilefacenet_to_onnx.py \
    --output backend/models/face_embedding.onnx

Notes:
- This script expects a model class MobileFaceNet to be importable from
  backend.models.mobilefacenet (backend/models/mobilefacenet.py).
  If you don't have that file, create it or install a package that provides it.
- Requires: torch, onnx, requests, pillow, torchvision (for any transforms).
"""

import os
import sys
import io
import tarfile
import argparse
import tempfile
from urllib.request import urlopen
import shutil


def download(url: str, dest: str) -> None:
    print(f"Downloading {url} -> {dest}")
    with urlopen(url) as resp, open(dest, "wb") as out:
        shutil.copyfileobj(resp, out)
    print("Download complete")


def find_checkpoint_in_tar(tar_path: str) -> str:
    with tarfile.open(tar_path, "r:*") as tar:
        members = tar.getmembers()
        for m in members:
            if (
                m.name.endswith(".pth")
                or m.name.endswith(".pt")
                or m.name.endswith(".tar")
            ):
                fn = m.name
                print(f"Found candidate in archive: {fn}")
                tmpdir = tempfile.mkdtemp()
                tar.extract(m, path=tmpdir)
                return os.path.join(tmpdir, fn)
    return ""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--checkpoint", help="Local checkpoint path (optional if CHECKPOINT_URL set)"
    )
    parser.add_argument(
        "--output",
        default=os.path.join(os.path.dirname(__file__), "face_embedding.onnx"),
    )
    args = parser.parse_args()

    ckpt_url = os.environ.get("CHECKPOINT_URL") or os.environ.get("MODEL_URL")
    ckpt_path = args.checkpoint
    if not ckpt_path and not ckpt_url:
        print("Please set CHECKPOINT_URL env var or pass --checkpoint")
        sys.exit(2)

    # download if needed
    if not ckpt_path:
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".tar")
        tmp.close()
        download(ckpt_url, tmp.name)
        # if it's a tar that contains a .pth, extract
        try:
            extracted = find_checkpoint_in_tar(tmp.name)
            if extracted:
                ckpt_path = extracted
            else:
                ckpt_path = tmp.name
        except tarfile.ReadError:
            ckpt_path = tmp.name

    print(f"Using checkpoint: {ckpt_path}")

    # Import torch and ONNX
    try:
        import torch
        import onnx
    except Exception as e:
        print("Missing required libs. Install torch and onnx in your venv:")
        print("  pip install torch onnx")
        raise

    # attempt to import MobileFaceNet model class
    try:
        # expects backend/models/mobilefacenet.py to define MobileFaceNet
        sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
        from mobilefacenet import MobileFaceNet  # type: ignore
    except Exception as e:
        print("Could not import MobileFaceNet from backend/models/mobilefacenet.py")
        print(
            "Please add a MobileFaceNet implementation at backend/models/mobilefacenet.py"
        )
        print(
            "Example: see py-feat/mobilefacenet implementations or convert a similar model."
        )
        raise

    # load checkpoint
    state = torch.load(ckpt_path, map_location="cpu")
    # state can be a dict with 'state_dict' or direct state_dict
    if isinstance(state, dict) and "state_dict" in state:
        state_dict = state["state_dict"]
    else:
        state_dict = state

    # create model and load weights
    model = None
    new_state = {}
    for k, v in state_dict.items():
        nk = k
        if k.startswith("module."):
            nk = k[len("module.") :]
        new_state[nk] = v

    try:
        model = MobileFaceNet(num_classes=512)  # init with default embedding dim
        model.load_state_dict(new_state, strict=False)
        model.eval()
    except RuntimeError as e:
        print(
            "Initial model load failed (shape mismatch); attempting to build a compatible model from the checkpoint..."
        )
        # if MobileFaceNet exposes a from_state_dict factory, use it
        if hasattr(MobileFaceNet, "from_state_dict"):
            try:
                model = MobileFaceNet.from_state_dict(new_state, embedding_size=512)
                print("Built dynamic model from checkpoint metadata.")
            except Exception as e2:
                print("from_state_dict failed:", e2)
                raise
        else:
            print("MobileFaceNet.from_state_dict not available; cannot continue")
            raise
    if model is None:
        print("Failed to construct model")
        sys.exit(1)

    # dummy input shape expected by MobileFaceNet: (1,3,160,160)
    dummy = torch.randn(1, 3, 160, 160, dtype=torch.float32)
    output_path = args.output
    print(f"Exporting ONNX to {output_path} ...")
    torch.onnx.export(
        model,
        dummy,
        output_path,
        input_names=["input"],
        output_names=["embedding"],
        opset_version=11,
        dynamic_axes=None,
        do_constant_folding=True,
    )
    print("Export complete.")
    size = os.path.getsize(output_path)
    print(f"Wrote {output_path} ({size} bytes)")


if __name__ == "__main__":
    main()
