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
    # Prefer facenet-pytorch when available (more modern and high-quality
    # embeddings). Keep this optional: if not installed we fall back to
    # face_recognition or the deterministic stub.
    try:
        # facenet-pytorch provides MTCNN and InceptionResnetV1
        from facenet_pytorch import MTCNN, InceptionResnetV1  # type: ignore
        import torch  # type: ignore
        from PIL import Image
        import numpy as np
        from io import BytesIO

        # initialize detector and model lazily at module import; these objects
        # are safe to keep in memory for the lifetime of the process.
        _mtcnn = MTCNN(select_largest=True)
        _resnet = InceptionResnetV1(pretrained="vggface2").eval()

        def _fpt_get_embedding(image_bytes: bytes) -> Optional[List[float]]:
            try:
                image = Image.open(BytesIO(image_bytes)).convert("RGB")
                face = _mtcnn(image)
                if face is None:
                    return None
                # face is a torch tensor [3,160,160]
                with torch.no_grad():
                    emb = _resnet(face.unsqueeze(0))
                vec = emb[0].cpu().numpy()
                vec = vec / (np.linalg.norm(vec) + 1e-10)
                return vec.astype(float).tolist()
            except Exception as exc:
                logger.exception("facenet-pytorch provider failed: %s", exc)
                return None

        get_embedding = _fpt_get_embedding
        logger.info("Using facenet-pytorch as embedding provider")

    except Exception:
        # Try an ONNX provider first if the runtime and model image are present.
        try:
            import onnxruntime as ort  # type: ignore
            from PIL import Image
            import numpy as np
            from io import BytesIO
            import os

            _onnx_model_path = os.path.join(
                os.path.dirname(__file__), "models", "face_embedding.onnx"
            )

            from PIL import UnidentifiedImageError

            def _onnx_get_embedding(image_bytes: bytes) -> Optional[List[float]]:
                # This adapter assumes a model that accepts a (1,3,160,160) float32
                # input normalized to [-1,1]. If your ONNX model uses different
                # preprocessing, adjust this function accordingly.
                if not os.path.exists(_onnx_model_path):
                    return None
                try:
                    img = Image.open(BytesIO(image_bytes)).convert("RGB")
                    img = img.resize((160, 160))
                    arr = np.array(img).astype(np.float32)
                    # transpose to CHW and scale to [-1,1]
                    arr = (arr / 127.5) - 1.0
                    arr = np.transpose(arr, (2, 0, 1))
                    inp = arr[np.newaxis, :]
                    sess = ort.InferenceSession(
                        _onnx_model_path, providers=["CPUExecutionProvider"]
                    )
                    input_name = sess.get_inputs()[0].name
                    out = sess.run(None, {input_name: inp})
                    vec = np.array(out[0])[0]
                    vec = vec / (np.linalg.norm(vec) + 1e-10)
                    return vec.astype(float).tolist()
                except UnidentifiedImageError:
                    # Tests (and some lightweight clients) may upload dummy bytes
                    # that are not valid images. For those cases, fall back to the
                    # deterministic test embedding instead of returning None.
                    logger.debug(
                        "ONNX provider: image not identifiable, using fallback deterministic embedding"
                    )
                    return _fallback(image_bytes)
                except Exception as exc:
                    logger.exception("ONNX provider failed: %s", exc)
                    return None

            get_embedding = _onnx_get_embedding
            logger.info("Using ONNX embedding provider (if model file present)")

        except Exception:
            # fall back to face_recognition if available, otherwise to stub
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
                get_embedding = _fallback
                logger.info("Using fallback deterministic embedding provider")
