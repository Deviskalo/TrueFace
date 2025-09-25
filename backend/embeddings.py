"""Embedding adapter module.

Expose a single function `get_embedding(image_bytes)` which returns a
list[float] embedding or None when no face is detected. The module tries
to use a real face-embedding library when available but falls back to the
deterministic test stub in `backend.utils`.

This file intentionally keeps the runtime dependency optional so tests and
lightweight development do not require heavy ML packages.
"""

from typing import Optional, List
import logging

from . import utils

logger = logging.getLogger("backend.embeddings")


def _fallback(image_bytes: bytes) -> Optional[List[float]]:
    """Fallback deterministic embedding used for tests/dev."""
    return utils.get_embedding_from_image(image_bytes)


# Try a sequence of optional providers in order of preference. If a provider
# is available we wrap it and expose it via `get_embedding`.
try:
    import face_recognition  # type: ignore
    from PIL import Image  # type: ignore
    import numpy as np  # type: ignore
    from io import BytesIO

    def _fr_get_embedding(image_bytes: bytes) -> Optional[List[float]]:
        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
            arr = np.array(image)
            encs = face_recognition.face_encodings(arr)
            if not encs:
                return None
            vec = encs[0].astype(float).tolist()
            return vec
        except Exception as exc:  # keep provider errors local
            logger.exception("face_recognition provider failed: %s", exc)
            return None

    get_embedding = _fr_get_embedding
    logger.info("Using face_recognition as embedding provider")

except Exception:
    # try other providers here (e.g., facenet-pytorch, insightface) if desired
    get_embedding = _fallback
    logger.info("Using fallback deterministic embedding provider")
