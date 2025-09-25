# Face embedding ONNX model

This folder is where an optional ONNX face-embedding model should be placed
for the ONNX-based embedding provider in `backend/embeddings.py`.

Filename expected: `face_embedding.onnx`

How to obtain a model

- Preferred: provide your own ONNX model that accepts a single image tensor
  shaped (1,3,160,160) and returns a 1-D embedding vector (float32). Adjust
  the preprocessing in `backend/embeddings.py::_onnx_get_embedding` if your
  model expects a different input shape or normalization.

- Quick download (example): set the MODEL_URL environment variable and run
  the included downloader script.

Example:

```bash
export MODEL_URL="https://example.com/path/to/your/face_embedding.onnx"
python3 backend/models/download_model.py
```

If you need help converting a PyTorch model to ONNX, ask and I can add a
conversion script (note: converting may require PyTorch to be installed).
