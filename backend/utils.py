import numpy as np
import hashlib
import os

# Default threshold for verification
DEFAULT_THRESHOLD = 0.6


def get_embedding_from_image(image_bytes: bytes):
    """
    Placeholder embedding extractor. Right now we produce a deterministic pseudo-random vector
    based on a hash of the image bytes so tests and examples can run without a heavy ML model.

    Replace this with a real model (e.g., face_recognition, insightface, or a TF/PyTorch model)
    that returns a fixed-size float32 vector.
    """
    if not image_bytes:
        return None
    # crude 'no face' simulation: if file is very small, pretend no face
    if len(image_bytes) < 64:
        return None

    h = hashlib.sha256(image_bytes).digest()
    rng = np.frombuffer(h, dtype=np.uint8).astype(np.float32)
    # expand or shrink to 128-d
    vec = np.resize(rng, (128,)).astype(np.float32)
    # normalize
    vec = vec / (np.linalg.norm(vec) + 1e-10)
    return vec.tolist()


def cosine_similarity(a, b):
    a = np.array(a, dtype=np.float32)
    b = np.array(b, dtype=np.float32)
    denom = np.linalg.norm(a) * np.linalg.norm(b) + 1e-10
    return float(np.dot(a, b) / denom)
