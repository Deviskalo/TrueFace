"""Optional ANN index using hnswlib.

This helper provides a lightweight in-memory index for nearest-neighbour
search. It's used when the optional `hnswlib` package is installed. The
module intentionally keeps usage optional; callers should gracefully fall
back to the DB's naive scan when the index is not available.
"""

from typing import Optional, List, Tuple
import logging

logger = logging.getLogger("backend.ann_index")

try:
    import hnswlib  # type: ignore
    import numpy as np  # type: ignore

    class ANNIndex:
        def __init__(self, dim: int = 128, space: str = "cosine"):
            self.dim = dim
            self.space = space
            self._index = hnswlib.Index(space=space, dim=dim)
            # placeholder; we'll initialize on first build
            self._initialized = False
            self._ids = []

        def build(self, vectors: List[List[float]], ids: List[str]):
            if not vectors:
                return
            data = np.array(vectors, dtype=np.float32)
            num_elements = data.shape[0]
            self._index.init_index(
                max_elements=max(1000, num_elements * 2), ef_construction=200, M=16
            )
            self._index.add_items(data, ids)
            self._ids = list(ids)
            self._initialized = True
            logger.info("ANN index built with %d elements", num_elements)

        def knn(self, vector: List[float], k: int = 5) -> List[Tuple[str, float]]:
            if not self._initialized:
                return []
            data = np.array(vector, dtype=np.float32)
            labels, distances = self._index.knn_query(data, k=k)
            # hnswlib returns distances depending on space; for cosine it's angular distance
            # to keep consistent with cosine similarity we convert distances to a similarity score
            results = []
            for lab, dist in zip(labels[0], distances[0]):
                # Convert to similarity in [0,1]
                sim = 1.0 - float(dist)
                results.append((str(lab), sim))
            return results

except Exception:
    # hnswlib not available; provide a no-op wrapper
    class ANNIndex:
        def __init__(self, dim: int = 128, space: str = "cosine"):
            self.dim = dim

        def build(self, vectors: List[List[float]], ids: List[str]):
            pass

        def knn(self, vector: List[float], k: int = 5):
            return []
