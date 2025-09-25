#!/usr/bin/env python3
"""Download an ONNX face embedding model into backend/models/face_embedding.onnx

Usage:
  MODEL_URL=https://.../face_embedding.onnx python3 backend/models/download_model.py

The script will save the model at backend/models/face_embedding.onnx and print its size.
"""

import os
import sys
import shutil
from urllib.request import urlopen

MODEL_URL = os.environ.get("MODEL_URL")
OUT_PATH = os.path.join(os.path.dirname(__file__), "face_embedding.onnx")


def main():
    if not MODEL_URL:
        print("Please set MODEL_URL environment variable pointing to an ONNX model.")
        sys.exit(2)
    print(f"Downloading {MODEL_URL} -> {OUT_PATH}")
    with urlopen(MODEL_URL) as resp, open(OUT_PATH + ".tmp", "wb") as out:
        shutil.copyfileobj(resp, out)
    os.replace(OUT_PATH + ".tmp", OUT_PATH)
    size = os.path.getsize(OUT_PATH)
    print(f"Saved {OUT_PATH} ({size} bytes)")


if __name__ == "__main__":
    main()
