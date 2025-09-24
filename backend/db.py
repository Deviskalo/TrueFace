from typing import Optional, List, Dict
from pymongo import MongoClient
import numpy as np
from bson import ObjectId

_client: Optional[MongoClient] = None
_db = None


def connect(uri: str):
    global _client, _db
    _client = MongoClient(uri)
    _db = _client.get_default_database()


def create_user(name: str, email: str, embedding: List[float]):
    users = _db["users"]
    doc = {
        "name": name,
        "email": email,
        "faces": [{"embedding": embedding}],
    }
    return users.insert_one(doc)


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
    import heapq

    heap = []
    q = np.array(query_embedding)
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
    logs = _db["logs"]
    return list(logs.find().sort("timestamp", -1).limit(limit))
