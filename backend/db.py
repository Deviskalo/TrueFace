from typing import Optional, List, Dict
from pymongo import MongoClient
import numpy as np
from bson import ObjectId
import logging

from .ann_index import ANNIndex

logger = logging.getLogger("backend.db")

# optional in-memory ANN index instance; built at connect() if hnswlib is
# available and data exists. This index is ephemeral and meant for fast
# lookups in a single-process prototype.
_ann_index: Optional[ANNIndex] = None

_client: Optional[MongoClient] = None
_db = None


def connect(uri: str):
    global _client, _db
    _client = MongoClient(uri)
    _db = _client.get_default_database()
    # create helpful indexes
    try:
        _db["users"].create_index("email", unique=True)
        # sessions.expires_at TTL (expireAfterSeconds=0 uses the field value)
        _db["sessions"].create_index("expires_at", expireAfterSeconds=0)
        _db["logs"].create_index("timestamp")
        # try to build an in-memory ANN index for faster searches if available
        try:
            global _ann_index
            # collect embeddings
            vecs = []
            ids = []
            for uid, name, emb in _all_embeddings_with_user():
                ids.append(uid)
                vecs.append(emb)
            if vecs:
                _ann_index = ANNIndex(dim=len(vecs[0]))
                _ann_index.build(vecs, ids)
                logger.info("ANN index created with %d vectors", len(vecs))
        except Exception:
            # best-effort; non-fatal if ANN unavailable
            logger.debug("ANN index unavailable or failed to build")
    except Exception:
        # index creation is best-effort in local/dev environments
        pass


def close():
    global _client
    if _client:
        _client.close()
        _client = None


def create_user(name: str, email: str, embedding: List[float]):
    users = _db["users"]
    doc = {
        "name": name,
        "email": email,
        "faces": [{"embedding": embedding}],
    }
    res = users.insert_one(doc)
    return str(res.inserted_id)


def get_user_by_id(user_id: str):
    users = _db["users"]
    u = users.find_one({"_id": ObjectId(user_id)})
    if not u:
        return None
    u["_id"] = str(u["_id"])
    return u


def add_face_to_user(user_id: str, embedding: List[float]) -> bool:
    users = _db["users"]
    res = users.update_one(
        {"_id": ObjectId(user_id)}, {"$push": {"faces": {"embedding": embedding}}}
    )
    return res.matched_count > 0


def _all_embeddings_with_user():
    users = _db["users"]
    for u in users.find({}, {"faces": 1, "name": 1}):
        uid = str(u.get("_id"))
        faces = u.get("faces", [])
        for f in faces:
            emb = f.get("embedding")
            if emb:
                yield uid, u.get("name"), emb


def find_best_match(query_embedding: List[float]) -> Optional[Dict]:
    # If we have an ANN index, use it to get top candidate(s) and compute
    # a precise score against the stored embedding(s).
    global _ann_index
    q = np.array(query_embedding)
    if _ann_index:
        try:
            knn = _ann_index.knn(query_embedding, k=1)
            if not knn:
                return None
            cid, approx_sim = knn[0]
            # find the precise embedding(s) for this user id by scanning
            # user's faces and compute precise cosine similarity
            users = _db["users"]
            u = users.find_one({"_id": ObjectId(cid)})
            if not u:
                return None
            best_score = 0.0
            for f in u.get("faces", []):
                emb = np.array(f.get("embedding"))
                score = float(
                    np.dot(q, emb) / (np.linalg.norm(q) * np.linalg.norm(emb) + 1e-10)
                )
                best_score = max(best_score, score)
            return {
                "user_id": str(u.get("_id")),
                "name": u.get("name"),
                "confidence": float(best_score),
            }
        except Exception:
            logger.exception("ANN search failed, falling back to naive scan")

    # fallback naive scan
    best = None
    best_score = -1.0
    q = np.array(query_embedding)
    for uid, name, emb in _all_embeddings_with_user():
        score = float(
            np.dot(q, np.array(emb)) / (np.linalg.norm(q) * np.linalg.norm(emb) + 1e-10)
        )
        if score > best_score:
            best_score = score
            best = {"user_id": uid, "name": name, "confidence": float(score)}
    return best


def verify_user(user_id: str, query_embedding: List[float]) -> float:
    users = _db["users"]
    u = users.find_one({"_id": ObjectId(user_id)})
    if not u:
        return 0.0
    q = np.array(query_embedding)
    best_score = 0.0
    for f in u.get("faces", []):
        emb = np.array(f.get("embedding"))
        score = float(
            np.dot(q, emb) / (np.linalg.norm(q) * np.linalg.norm(emb) + 1e-10)
        )
        best_score = max(best_score, score)
    return best_score


def search_candidates(query_embedding: List[float], top_k: int = 5) -> List[Dict]:
    # Try ANN first
    global _ann_index
    q = np.array(query_embedding)
    results = []
    if _ann_index:
        try:
            knn = _ann_index.knn(query_embedding, k=top_k)
            for uid, sim in knn:
                # retrieve user details for each uid
                u = _db["users"].find_one({"_id": ObjectId(uid)})
                if not u:
                    continue
                results.append(
                    {
                        "user_id": str(u.get("_id")),
                        "name": u.get("name"),
                        "confidence": float(sim),
                    }
                )
            if results:
                return results
        except Exception:
            logger.exception("ANN knn failed, falling back to naive search")

    # naive heap-based scan
    import heapq

    heap = []
    for uid, name, emb in _all_embeddings_with_user():
        score = float(
            np.dot(q, np.array(emb)) / (np.linalg.norm(q) * np.linalg.norm(emb) + 1e-10)
        )
        if len(heap) < top_k:
            heapq.heappush(
                heap,
                (score, {"user_id": uid, "name": name, "confidence": float(score)}),
            )
        else:
            heapq.heappushpop(
                heap,
                (score, {"user_id": uid, "name": name, "confidence": float(score)}),
            )

    # return sorted descending
    return [item[1] for item in sorted(heap, key=lambda x: -x[0])]


def get_logs(limit: int = 50):
    """
    Fetch recognition history (logs collection).

    Parameters
    ----------
    limit : int, optional
        Number of logs to fetch. Defaults to 50.

    Returns
    -------
    List[Dict]
        List of logs, sorted by timestamp in descending order.
    """
    logs = _db["logs"]
    res = []
    for entry in logs.find().sort("timestamp", -1).limit(limit):
        entry["_id"] = str(entry["_id"])
        res.append(entry)
    return res


def log_action(
    user_id: str, action: str, confidence: float = None, metadata: dict = None
):
    """Insert a log entry into the logs collection."""
    logs = _db["logs"]
    doc = {
        "user_id": user_id,
        "action": action,
        "confidence": float(confidence) if confidence is not None else None,
        # timezone-aware UTC timestamp
        "timestamp": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ),
        "metadata": metadata or {},
    }
    return logs.insert_one(doc)


def create_session(user_id: str):
    return create_session_with_expiry(user_id, None)


def create_session_with_expiry(user_id: str, expires_minutes: int | None):
    sessions = _db["sessions"]
    import uuid

    sid = str(uuid.uuid4())
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    expires_at = None
    if expires_minutes is not None:
        expires_at = now + __import__("datetime").timedelta(minutes=expires_minutes)
    doc = {
        "_id": sid,
        "user_id": user_id,
        "issued_at": now,
        "revoked": False,
        "expires_at": expires_at,
    }
    sessions.insert_one(doc)
    return sid


def revoke_session(session_id: str):
    sessions = _db["sessions"]
    res = sessions.update_one({"_id": session_id}, {"$set": {"revoked": True}})
    return res.matched_count > 0


def is_session_active(session_id: str) -> bool:
    sessions = _db["sessions"]
    doc = sessions.find_one({"_id": session_id})
    if not doc:
        return False
    if bool(doc.get("revoked", False)):
        return False
    expires_at = doc.get("expires_at")
    if expires_at is None:
        return True
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    return expires_at > now
