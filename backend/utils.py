import numpy as np
import hashlib
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

# Default threshold for verification
DEFAULT_THRESHOLD = 0.6


def get_embedding_from_image(image_bytes: bytes):
    """
    Placeholder embedding extractor. Right now we produce a deterministic pseudo-random vector
    based on a hash of the image bytes so tests and examples can run without a heavy ML model.

    Replace this with a real model (e.g., face_recognition, insightface, or a TF/PyTorch model)
    that returns a fixed-size float32 vector.
    """
    import os
    DEV_MODE_NO_DB = os.getenv("DEV_MODE_NO_DB", "false").lower() in ["true", "1", "yes"]
    
    if not image_bytes:
        return None
    
    # In dev mode, be more lenient - accept any non-empty image
    # In production mode, require minimum file size
    min_size = 8 if DEV_MODE_NO_DB else 64
    if len(image_bytes) < min_size:
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


def create_access_token(data: dict, secret: str, expires_minutes: int = 60) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    # use POSIX timestamp for exp
    to_encode.update({"exp": int(expire.timestamp())})
    token = jwt.encode(to_encode, secret, algorithm="HS256")
    return token


def decode_access_token(token: str, secret: str):
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except JWTError:
        return None
