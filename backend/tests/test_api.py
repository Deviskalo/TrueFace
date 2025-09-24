from fastapi.testclient import TestClient
import io

import backend.main as main_mod


class DummyDB:
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
        # naive match: return first user
        for uid, u in self.users.items():
            return {"user_id": uid, "name": u["name"], "confidence": 0.9}
        return None

    def add_face_to_user(self, user_id, embedding):
        u = self.users.get(user_id)
        if not u:
            return False
        u.setdefault("faces", []).append({"embedding": embedding})
        return True

    def verify_user(self, user_id, embedding):
        return 0.95 if user_id in self.users else 0.0

    def search_candidates(self, embedding, top_k=5):
        return []

    def get_user_by_id(self, user_id):
        return self.users.get(user_id)

    def create_session(self, user_id):
        sid = f"sess_{len(self.sessions) + 1}"
        self.sessions[sid] = {"user_id": user_id, "revoked": False}
        return sid

    def create_session_with_expiry(self, user_id, expires_minutes):
        # ignore expiry for tests, behave same as create_session
        return self.create_session(user_id)

    def revoke_session(self, session_id):
        s = self.sessions.get(session_id)
        if not s:
            return False
        s["revoked"] = True
        return True

    def is_session_active(self, session_id):
        s = self.sessions.get(session_id)
        return bool(s and not s.get("revoked", False))

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


def test_signup_login_enroll_verify(monkeypatch):
    dummy = DummyDB()
    monkeypatch.setattr(main_mod, "db", dummy)

    client = TestClient(main_mod.app)

    # signup
    file_bytes = io.BytesIO(b"a" * 256)
    resp = client.post(
        "/api/auth/signup",
        files={"image": ("face.jpg", file_bytes, "image/jpeg")},
        data={"name": "Alice", "email": "a@b.com"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data and "user_id" in data
    token = data["token"]

    # login
    file_bytes = io.BytesIO(b"a" * 256)
    resp = client.post(
        "/api/auth/login", files={"image": ("face.jpg", file_bytes, "image/jpeg")}
    )
    assert resp.status_code == 200
    match = resp.json().get("match")
    assert match and match.get("user_id")

    # enroll with auth
    file_bytes = io.BytesIO(b"a" * 256)
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post(
        "/api/face/enroll",
        files={"image": ("face.jpg", file_bytes, "image/jpeg")},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json().get("enrolled") is True

    # verify with auth
    file_bytes = io.BytesIO(b"a" * 256)
    resp = client.post(
        "/api/face/verify",
        files={"image": ("face.jpg", file_bytes, "image/jpeg")},
        headers=headers,
    )
    assert resp.status_code == 200
    out = resp.json()
    assert out.get("verified") is True


def test_logout_revokes_session(monkeypatch):
    dummy = DummyDB()
    monkeypatch.setattr(main_mod, "db", dummy)

    client = TestClient(main_mod.app)

    # signup -> get token
    file_bytes = io.BytesIO(b"a" * 256)
    resp = client.post(
        "/api/auth/signup",
        files={"image": ("face.jpg", file_bytes, "image/jpeg")},
        data={"name": "Bob", "email": "b@c.com"},
    )
    assert resp.status_code == 200
    token = resp.json()["token"]

    headers = {"Authorization": f"Bearer {token}"}

    # logout
    resp = client.post("/api/auth/logout", headers=headers)
    assert resp.status_code == 200
    assert resp.json().get("revoked") is True

    # enroll should now fail with 401
    file_bytes = io.BytesIO(b"a" * 256)
    resp = client.post(
        "/api/face/enroll",
        files={"image": ("face.jpg", file_bytes, "image/jpeg")},
        headers=headers,
    )
    assert resp.status_code == 401
