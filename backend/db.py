from typing import Optional, List, Dict
from pymongo import MongoClient
import pymongo.errors as pymongo_errors
import numpy as np
from bson import ObjectId
import logging
import os
import time
from datetime import datetime, timezone, timedelta

from .ann_index import ANNIndex

logger = logging.getLogger("backend.db")

# optional in-memory ANN index instance; built at connect() if hnswlib is
# available and data exists. This index is ephemeral and meant for fast
# lookups in a single-process prototype.
_ann_index: Optional[ANNIndex] = None

_client: Optional[MongoClient] = None
_db = None

# Development mode check
DEV_MODE_NO_DB = os.getenv("DEV_MODE_NO_DB", "false").lower() in ["true", "1", "yes"]

# Mock data for development mode
_mock_users = {}
_mock_sessions = {}
_mock_logs = []


class DBUnavailable(Exception):
    """Raised when the database hasn't been connected or is unreachable."""


def _ensure_db():
    """Helper to check that the module-level _db is available.

    Raises
    ------
    DBUnavailable
        If the database hasn't been initialized via connect().
    """
    if DEV_MODE_NO_DB:
        return  # Skip database check in dev mode
    if _db is None:
        raise DBUnavailable("Database not connected")


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
    if DEV_MODE_NO_DB:
        # Mock implementation for dev mode
        user_id = f"mock_user_{len(_mock_users) + 1}"
        _mock_users[user_id] = {
            "_id": user_id,
            "name": name,
            "email": email,
            "faces": [{"embedding": embedding}],
            "created_at": datetime.now(timezone.utc)
        }
        logger.info(f"[DEV MODE] Created mock user: {user_id} ({name})")
        return user_id
    
    _ensure_db()
    users = _db["users"]
    doc = {
        "name": name, 
        "email": email, 
        "faces": [{"embedding": embedding}],
        "created_at": datetime.now(timezone.utc)
    }
    try:
        res = users.insert_one(doc)
        return str(res.inserted_id)
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during create_user")
        raise DBUnavailable(str(e))


def get_user_by_id(user_id: str):
    if DEV_MODE_NO_DB:
        return _mock_users.get(user_id)
    
    _ensure_db()
    users = _db["users"]
    try:
        u = users.find_one({"_id": ObjectId(user_id)})
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during get_user_by_id")
        raise DBUnavailable(str(e))
    if not u:
        return None
    u["_id"] = str(u["_id"])
    return u


def add_face_to_user(user_id: str, embedding: List[float]) -> bool:
    if DEV_MODE_NO_DB:
        user = _mock_users.get(user_id)
        if user:
            user["faces"].append({"embedding": embedding})
            return True
        return False
    
    _ensure_db()
    users = _db["users"]
    try:
        res = users.update_one(
            {"_id": ObjectId(user_id)}, {"$push": {"faces": {"embedding": embedding}}}
        )
        return res.matched_count > 0
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during add_face_to_user")
        raise DBUnavailable(str(e))


def _all_embeddings_with_user():
    _ensure_db()
    users = _db["users"]
    try:
        cursor = users.find({}, {"faces": 1, "name": 1})
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during _all_embeddings_with_user")
        raise DBUnavailable(str(e))

    for u in cursor:
        uid = str(u.get("_id"))
        faces = u.get("faces", [])
        for f in faces:
            emb = f.get("embedding")
            if emb:
                yield uid, u.get("name"), emb


def find_best_match(query_embedding: List[float]) -> Optional[Dict]:
    if DEV_MODE_NO_DB:
        # Mock implementation: return first user if any exist with high confidence
        if _mock_users:
            first_user = next(iter(_mock_users.values()))
            return {
                "user_id": first_user["_id"],
                "name": first_user["name"],
                "confidence": 0.95  # High confidence for demo
            }
        return None
    
    # If we have an ANN index, use it to get top candidate(s) and compute
    # a precise score against the stored embedding(s).
    _ensure_db()
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
            try:
                u = users.find_one({"_id": ObjectId(cid)})
            except (
                pymongo_errors.ServerSelectionTimeoutError,
                pymongo_errors.AutoReconnect,
                pymongo_errors.PyMongoError,
            ) as e:
                logger.exception("DB unavailable during find_best_match (ann branch)")
                raise DBUnavailable(str(e))
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
    if DEV_MODE_NO_DB:
        # Mock implementation: return high confidence if user exists
        return 0.95 if user_id in _mock_users else 0.0
    
    _ensure_db()
    users = _db["users"]
    try:
        u = users.find_one({"_id": ObjectId(user_id)})
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during verify_user")
        raise DBUnavailable(str(e))
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
    _ensure_db()
    global _ann_index
    q = np.array(query_embedding)
    results = []
    if _ann_index:
        try:
            knn = _ann_index.knn(query_embedding, k=top_k)
            for uid, sim in knn:
                # retrieve user details for each uid
                try:
                    u = _db["users"].find_one({"_id": ObjectId(uid)})
                except (
                    pymongo_errors.ServerSelectionTimeoutError,
                    pymongo_errors.AutoReconnect,
                    pymongo_errors.PyMongoError,
                ) as e:
                    logger.exception(
                        "DB unavailable during search_candidates (ann branch)"
                    )
                    raise DBUnavailable(str(e))
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
    if DEV_MODE_NO_DB:
        # Return recent mock logs
        return _mock_logs[-limit:] if _mock_logs else []
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
    _ensure_db()
    logs = _db["logs"]
    try:
        cursor = logs.find().sort("timestamp", -1).limit(limit)
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during get_logs (cursor acquisition)")
        raise DBUnavailable(str(e))

    res = []
    try:
        for entry in cursor:
            entry["_id"] = str(entry["_id"])
            res.append(entry)
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during get_logs (cursor iteration)")
        raise DBUnavailable(str(e))

    return res


def log_action(
    user_id: str, action: str, confidence: float = None, metadata: dict = None
):
    """Insert a log entry into the logs collection."""
    if DEV_MODE_NO_DB:
        # Mock implementation: add to in-memory logs
        log_entry = {
            "_id": f"log_{len(_mock_logs) + 1}",
            "user_id": user_id,
            "action": action,
            "confidence": float(confidence) if confidence is not None else None,
            "timestamp": datetime.now(timezone.utc),
            "metadata": metadata or {},
        }
        _mock_logs.append(log_entry)
        return log_entry
    
    _ensure_db()
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
    try:
        return logs.insert_one(doc)
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during log_action")
        raise DBUnavailable(str(e))


def create_session(user_id: str):
    return create_session_with_expiry(user_id, None)


def create_session_with_expiry(user_id: str, expires_minutes: int | None):
    if DEV_MODE_NO_DB:
        # Mock implementation: create in-memory session
        import uuid
        sid = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        expires_at = None
        if expires_minutes is not None:
            expires_at = now + timedelta(minutes=expires_minutes)
        _mock_sessions[sid] = {
            "_id": sid,
            "user_id": user_id,
            "issued_at": now,
            "revoked": False,
            "expires_at": expires_at,
        }
        return sid
    
    _ensure_db()
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
    try:
        sessions.insert_one(doc)
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during create_session_with_expiry")
        raise DBUnavailable(str(e))
    return sid


def revoke_session(session_id: str):
    if DEV_MODE_NO_DB:
        session = _mock_sessions.get(session_id)
        if session:
            session["revoked"] = True
            return True
        return False
    
    _ensure_db()
    sessions = _db["sessions"]
    try:
        res = sessions.update_one({"_id": session_id}, {"$set": {"revoked": True}})
        return res.matched_count > 0
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during revoke_session")
        raise DBUnavailable(str(e))


def is_session_active(session_id: str) -> bool:
    if DEV_MODE_NO_DB:
        session = _mock_sessions.get(session_id)
        if not session:
            return False
        if session.get("revoked", False):
            return False
        expires_at = session.get("expires_at")
        if expires_at is None:
            return True
        return expires_at > datetime.now(timezone.utc)
    
    _ensure_db()
    sessions = _db["sessions"]
    try:
        doc = sessions.find_one({"_id": session_id})
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during is_session_active")
        raise DBUnavailable(str(e))
    if not doc:
        return False
    if bool(doc.get("revoked", False)):
        return False
    expires_at = doc.get("expires_at")
    if expires_at is None:
        return True
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    return expires_at > now


def get_user_sessions(user_id: str):
    """Get all active sessions for a specific user."""
    if DEV_MODE_NO_DB:
        user_sessions = []
        for sid, session in _mock_sessions.items():
            if session["user_id"] == user_id and not session.get("revoked", False):
                expires_at = session.get("expires_at")
                if expires_at is None or expires_at > datetime.now(timezone.utc):
                    user_sessions.append({
                        "session_id": sid,
                        "issued_at": session["issued_at"].isoformat(),
                        "expires_at": expires_at.isoformat() if expires_at else None,
                        "is_current": False,  # We could track this better
                    })
        return user_sessions
    
    _ensure_db()
    sessions = _db["sessions"]
    try:
        now = datetime.now(timezone.utc)
        cursor = sessions.find({
            "user_id": user_id,
            "revoked": False,
            "$or": [
                {"expires_at": None},
                {"expires_at": {"$gt": now}}
            ]
        }).sort("issued_at", -1)
        
        result = []
        for doc in cursor:
            result.append({
                "session_id": doc["_id"],
                "issued_at": doc["issued_at"].isoformat(),
                "expires_at": doc["expires_at"].isoformat() if doc["expires_at"] else None,
                "is_current": False,  # We could track this if we had request context
            })
        return result
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during get_user_sessions")
        raise DBUnavailable(str(e))


def revoke_all_user_sessions(user_id: str, exclude_session_id: str = None):
    """Revoke all sessions for a user, optionally excluding one session."""
    if DEV_MODE_NO_DB:
        revoked_count = 0
        for sid, session in _mock_sessions.items():
            if (session["user_id"] == user_id and 
                not session.get("revoked", False) and 
                sid != exclude_session_id):
                session["revoked"] = True
                revoked_count += 1
        return revoked_count
    
    _ensure_db()
    sessions = _db["sessions"]
    try:
        query = {"user_id": user_id, "revoked": False}
        if exclude_session_id:
            query["_id"] = {"$ne": exclude_session_id}
        
        res = sessions.update_many(query, {"$set": {"revoked": True}})
        return res.modified_count
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during revoke_all_user_sessions")
        raise DBUnavailable(str(e))


def get_user_logs(user_id: str, limit: int = 50):
    """Get authentication/recognition history for a specific user."""
    if DEV_MODE_NO_DB:
        user_logs = []
        for log in reversed(_mock_logs):
            if log["user_id"] == user_id:
                # Format the log for frontend
                formatted_log = {
                    "_id": log["_id"],
                    "action": log["action"],
                    "confidence": log["confidence"],
                    "timestamp": log["timestamp"].isoformat(),
                    "metadata": log.get("metadata", {}),
                    "success": log["action"] in ["signup", "login", "verify", "enroll"] and (log.get("confidence") or 0) >= 0.7
                }
                user_logs.append(formatted_log)
                if len(user_logs) >= limit:
                    break
        return user_logs
    
    _ensure_db()
    logs = _db["logs"]
    try:
        cursor = logs.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
        result = []
        for entry in cursor:
            entry["_id"] = str(entry["_id"])
            entry["timestamp"] = entry["timestamp"].isoformat()
            # Add success indicator based on action and confidence
            entry["success"] = (
                entry["action"] in ["signup", "login", "verify", "enroll"] and 
                (entry.get("confidence") or 0) >= 0.7
            )
            result.append(entry)
        return result
    except (
        pymongo_errors.ServerSelectionTimeoutError,
        pymongo_errors.AutoReconnect,
        pymongo_errors.PyMongoError,
    ) as e:
        logger.exception("DB unavailable during get_user_logs")
        raise DBUnavailable(str(e))
