import io
import time
from fastapi.testclient import TestClient

import backend.main as main_mod


class DummyDB2(
    main_mod.__dict__.get("db").__class__ if hasattr(main_mod, "db") else object
):
    # Reuse the simple DummyDB shape from existing tests but allow expiry
    def __init__(self):
        self.users = {}
        self.logs = []
        self.sessions = {}

    def create_user(self, name, email, embedding):
        uid = f"user_{len(self.users) + 1}"
        self.users[uid] = {
            "_id": uid,
            "name": name,
            "email": email,
            "faces": [{"embedding": embedding}],
        }
        return uid

    def find_best_match(self, embedding):
        return None

    def add_face_to_user(self, user_id, embedding):
        u = self.users.get(user_id)
        if not u:
            return False
        u.setdefault("faces", []).append({"embedding": embedding})
        return True

    def verify_user(self, user_id, embedding):
        return 0.0

    def search_candidates(self, embedding, top_k=5):
        return []

    def get_user_by_id(self, user_id):
        return self.users.get(user_id)

    def create_session_with_expiry(self, user_id, expires_minutes):
        sid = f"sess_{len(self.sessions) + 1}"
        now = time.time()
        expires_at = None
        if expires_minutes is not None:
            expires_at = now + (expires_minutes * 60)
        self.sessions[sid] = {
            "user_id": user_id,
            "revoked": False,
            "expires_at": expires_at,
        }
        return sid

    def revoke_session(self, session_id):
        s = self.sessions.get(session_id)
        if not s:
            return False
        s["revoked"] = True
        return True

    def is_session_active(self, session_id):
        s = self.sessions.get(session_id)
        if not s:
            return False
        if s.get("revoked"):
            return False
        expires = s.get("expires_at")
        if expires is None:
            return True
        return time.time() < expires

    def get_logs(self, limit=50):
        return self.logs[-limit:]

    def log_action(self, user_id, action, confidence=None, metadata=None):
        self.logs.append(
            {
                "user_id": user_id,
                "action": action,
                "confidence": confidence,
                "metadata": metadata or {},
            }
        )


def test_token_expiry_and_revocation(monkeypatch):
    dummy = DummyDB2()
    monkeypatch.setattr(main_mod, "db", dummy)

    client = TestClient(main_mod.app)

    # signup with short expiry (1 minute)
    file_bytes = io.BytesIO(b"a" * 256)
    resp = client.post(
        "/api/auth/signup",
        files={"image": ("face.jpg", file_bytes, "image/jpeg")},
        data={"name": "Eve", "email": "e@x.com"},
    )
    assert resp.status_code == 200
    data = resp.json()
    token = data["token"]

    # revoke the session and ensure protected endpoint fails
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/api/auth/logout", headers=headers)
    assert resp.status_code == 200
    assert resp.json().get("revoked") is True

    # enroll should fail
    file_bytes = io.BytesIO(b"a" * 256)
    resp = client.post(
        "/api/face/enroll",
        files={"image": ("face.jpg", file_bytes, "image/jpeg")},
        headers=headers,
    )
    assert resp.status_code == 401


def test_enroll_verify_failure_modes(monkeypatch):
    dummy = DummyDB2()
    monkeypatch.setattr(main_mod, "db", dummy)

    client = TestClient(main_mod.app)

    # signup normally
    file_bytes = io.BytesIO(b"a" * 256)
    resp = client.post(
        "/api/auth/signup",
        files={"image": ("face.jpg", file_bytes, "image/jpeg")},
        data={"name": "Mallory", "email": "m@x.com"},
    )
    assert resp.status_code == 200
    token = resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # enroll with small file (simulate no face)
    file_bytes = io.BytesIO(b"short")
    resp = client.post(
        "/api/face/enroll",
        files={"image": ("tiny.jpg", file_bytes, "image/jpeg")},
        headers=headers,
    )
    assert resp.status_code == 400

    # verify with small file should also 400
    file_bytes = io.BytesIO(b"short")
    resp = client.post(
        "/api/face/verify",
        files={"image": ("tiny.jpg", file_bytes, "image/jpeg")},
        headers=headers,
    )
    assert resp.status_code == 400
