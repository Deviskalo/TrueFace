# Face embedding ONNX model

This folder contains an ONNX face-embedding model used by the backend's
ONNX provider. The repository currently includes a converted model exported
from the `py-feat/mobilefacenet` PyTorch checkpoint. Use this file if you
want a ready-to-run face embedding provider.

Filename expected: `face_embedding.onnx`

Provenance
- Converted from the `py-feat/mobilefacenet` PyTorch checkpoint
  (`mobilefacenet_model_best.pth.tar`) using the helper
  `backend/models/convert_mobilefacenet_to_onnx.py` in this repo.

Preprocessing expected by the adapter
- Input: an RGB image which the adapter resizes to 160x160.
- Scaling: adapter scales pixels as `(arr / 127.5) - 1.0` and transposes to
  channel-first (C,H,W) before passing a single-batch (1,3,160,160) tensor to
  the model. If you use a different ONNX model, update
  `backend/embeddings.py::_onnx_get_embedding` accordingly.

Embedding size and behavior
- The currently committed ONNX returns 512-dimensional float embeddings (the
  same output dimension as the checkpoint). The adapter normalizes the vector
  to unit L2 length before returning it.

Tests and deterministic fallback
- Tests (and some light-weight clients) upload dummy bytes that are not valid
  images. To keep tests deterministic and fast, `backend/embeddings.py` will
  fall back to a deterministic stub embedding when the ONNX adapter cannot
  decode the provided bytes. This allows the test suite to run without GPU
  or heavy ML libraries.

How to re-generate the ONNX model
1. Place a PyTorch checkpoint locally or set `CHECKPOINT_URL` to a downloadable
   checkpoint (for example, the Hugging Face raw checkpoint URL for
   `py-feat/mobilefacenet`).
2. Ensure a CPU PyTorch and onnx are installed in your venv.
3. Run the converter:

```bash
# (from repo root)
# using a local checkpoint:
python3 backend/models/convert_mobilefacenet_to_onnx.py \
  --checkpoint /path/to/mobilefacenet_model_best.pth.tar \
  --output backend/models/face_embedding.onnx

# or using CHECKPOINT_URL (the script will download and extract if needed):
CHECKPOINT_URL="https://huggingface.co/py-feat/mobilefacenet/resolve/main/mobilefacenet_model_best.pth.tar" \
  python3 backend/models/convert_mobilefacenet_to_onnx.py --output backend/models/face_embedding.onnx
```

Notes
- The exported model is committed to this repo for convenience. If you plan
  to add significantly larger models in the future, consider using Git LFS to
  avoid bloating repository history.

