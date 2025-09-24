"""Embedding adapter module.

This provides a single function `get_embedding(image_bytes)` so the embedding
backend can be swapped easily (insightface, face_recognition, TF, etc.).
"""

from . import utils


def get_embedding(image_bytes: bytes):
    return utils.get_embedding_from_image(image_bytes)
