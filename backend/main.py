import os

try:
    # optional convenience: load environment from .env files.
    # Prefer repo-root .env to override any pre-set environment values so that
    # local development is predictable.
    from dotenv import load_dotenv
    from pathlib import Path

    backend_dir = Path(__file__).resolve().parent
    repo_root = backend_dir.parent

    # Load backend/.env first (legacy), then root .env overriding values.
    load_dotenv(backend_dir / ".env", override=False)
    load_dotenv(repo_root / ".env", override=True)
except Exception:
    # dotenv is optional; if not present we just rely on the environment.
    pass
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from . import db, utils, embeddings, schemas
from .db import DBUnavailable
import bcrypt

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/facial_recognition_db")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")
SESSION_EXPIRES_MINUTES = int(os.getenv("SESSION_EXPIRES_MINUTES", "60"))
DEV_MODE_NO_DB = os.getenv("DEV_MODE_NO_DB", "false").lower() in ["true", "1", "yes"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not DEV_MODE_NO_DB:
        db.connect(MONGO_URI)
    try:
        yield
    finally:
        if not DEV_MODE_NO_DB:
            db.close()


app = FastAPI(title="TrueFace Backend", lifespan=lifespan)

# Add CORS middleware to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_scheme = HTTPBearer()


class SignupPayload(BaseModel):
    name: str
    email: str


class AdminLoginPayload(BaseModel):
    username: str
    password: str


class AdminActionPayload(BaseModel):
    user_id: str
    reason: str = None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    token = credentials.credentials
    payload = utils.decode_access_token(token, JWT_SECRET)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("user_id")
    session_id = payload.get("session_id")
    if session_id and not db.is_session_active(session_id):
        raise HTTPException(status_code=401, detail="Session revoked")
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token user")
    return user


def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    """Verify admin authentication and return admin user."""
    token = credentials.credentials
    payload = utils.decode_access_token(token, JWT_SECRET)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Check if this is an admin token
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    username = payload.get("username")
    admin = db.get_admin_by_username(username)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    
    return admin


@app.post("/api/auth/signup")
async def signup(
    name: str = Form(...), email: str = Form(...), image: UploadFile = File(...)
):
    contents = await image.read()
    embedding = embeddings.get_embedding(contents)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected")

    user_id = db.create_user(name, email, embedding)
    session_id = db.create_session_with_expiry(user_id, SESSION_EXPIRES_MINUTES)
    token = utils.create_access_token(
        {"user_id": user_id, "session_id": session_id}, JWT_SECRET
    )
    db.log_action(user_id, "signup", confidence=None, metadata={"email": email})
    return JSONResponse({"user_id": user_id, "token": token})


@app.exception_handler(DBUnavailable)
def db_unavailable_handler(request, exc: DBUnavailable):
    # Return 503 Service Unavailable with a short, user-friendly message.
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Database unavailable. Please start MongoDB or check MONGO_URI."
        },
    )


@app.post("/api/auth/login")
async def login(image: UploadFile = File(...)) -> schemas.MatchResponse:
    contents = await image.read()
    embedding = embeddings.get_embedding(contents)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected")

    match = db.find_best_match(embedding)
    if match is None:
        return JSONResponse({"match": None, "confidence": 0.0})

    # issue token for matched user
    session_id = db.create_session_with_expiry(
        match["user_id"], SESSION_EXPIRES_MINUTES
    )
    token = utils.create_access_token(
        {"user_id": match["user_id"], "session_id": session_id}, JWT_SECRET
    )
    match["token"] = token
    db.log_action(match["user_id"], "login", confidence=match.get("confidence"))
    return JSONResponse({"match": match})


@app.post("/api/auth/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    token = credentials.credentials
    payload = utils.decode_access_token(token, JWT_SECRET)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="No session in token")
    ok = db.revoke_session(session_id)
    return JSONResponse({"revoked": bool(ok)})


@app.post("/api/face/enroll")
async def enroll(
    image: UploadFile = File(...), current_user: dict = Depends(get_current_user)
) -> schemas.EnrollResponse:
    contents = await image.read()
    embedding = embeddings.get_embedding(contents)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected")

    ok = db.add_face_to_user(current_user["_id"], embedding)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    db.log_action(current_user["_id"], "enroll")
    return JSONResponse({"enrolled": True})


@app.post("/api/face/verify")
async def verify(
    image: UploadFile = File(...), current_user: dict = Depends(get_current_user)
) -> schemas.VerifyResponse:
    contents = await image.read()
    embedding = embeddings.get_embedding(contents)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected")

    score = db.verify_user(current_user["_id"], embedding)
    db.log_action(current_user["_id"], "verify", confidence=score)
    return JSONResponse(
        {"verified": score >= utils.DEFAULT_THRESHOLD, "confidence": float(score)}
    )


@app.post("/api/face/recognize")
async def recognize(image: UploadFile = File(...)):
    contents = await image.read()
    embedding = embeddings.get_embedding(contents)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected")

    candidates = db.search_candidates(embedding, top_k=5)
    # log recognize attempts for the top candidate if any
    if candidates:
        db.log_action(
            candidates[0]["user_id"],
            "recognize",
            confidence=candidates[0].get("confidence"),
            metadata={"top_k": len(candidates)},
        )
    return JSONResponse({"candidates": candidates})


@app.get("/api/logs")
def logs(
    limit: int = 50, current_user: dict = Depends(get_current_user)
) -> schemas.LogsResponse:
    return JSONResponse({"logs": db.get_logs(limit)})


@app.get("/api/user/profile")
def get_profile(current_user: dict = Depends(get_current_user)) -> schemas.ProfileResponse:
    """Get current user's profile information."""
    created_at = current_user.get("created_at")
    profile = {
        "user_id": current_user["_id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "face_count": len(current_user.get("faces", [])),
        "created_at": created_at.isoformat() if created_at else None,
    }
    return JSONResponse({"profile": profile})


@app.get("/api/user/sessions")
def get_user_sessions(current_user: dict = Depends(get_current_user)) -> schemas.SessionsResponse:
    """Get current user's active sessions."""
    sessions = db.get_user_sessions(current_user["_id"])
    return JSONResponse({"sessions": sessions})


@app.post("/api/user/sessions/revoke-all")
def revoke_all_sessions(
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)
):
    """Revoke all sessions for the current user except the current one."""
    try:
        # Extract current session ID from token
        token = credentials.credentials
        payload = utils.decode_access_token(token, JWT_SECRET)
        current_session_id = payload.get("session_id") if payload else None
        
        revoked_count = db.revoke_all_user_sessions(current_user["_id"], exclude_session_id=current_session_id)
        return JSONResponse({"revoked_count": revoked_count})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user/history")
def get_user_history(
    limit: int = 50, current_user: dict = Depends(get_current_user)
) -> schemas.UserHistoryResponse:
    """Get authentication/recognition history for the current user."""
    history = db.get_user_logs(current_user["_id"], limit)
    return JSONResponse({"history": history})


def _mask_uri(uri: str | None) -> str:
    if not uri:
        return "(not set)"
    # mask credentials if present
    try:
        if "@" in uri and ":" in uri:
            parts = uri.split("@")
            creds, tail = parts[0], parts[1]
            # keep scheme and host, mask credentials
            if "//" in creds:
                scheme, creds_only = creds.split("//", 1)
                return f"{scheme}//***@{tail}"
    except Exception:
        pass
    # fallback: show truncated uri
    return uri[:60] + ("..." if len(uri) > 60 else "")


@app.get("/health")
def health():
    """Health check: returns app + DB connectivity status.

    - status: ok/partial/down
    - db: reachable? + optional message
    - mongo_uri: masked for debugging
    """
    if DEV_MODE_NO_DB:
        return JSONResponse(
            status_code=200,
            content={
                "status": "ok",
                "db": {"reachable": False, "message": "DB disabled in dev mode"},
                "mongo_uri": "(dev mode - no db)",
                "dev_mode": True,
            },
        )
    
    try:
        # call a light DB operation to verify connectivity
        # db.get_logs uses the db layer and will raise DBUnavailable if not connected
        db.get_logs(limit=1)
        db_status = {"reachable": True}
        status = "ok"
        code = 200
    except DBUnavailable as e:
        db_status = {"reachable": False, "error": str(e)}
        status = "partial"
        code = 503

    return JSONResponse(
        status_code=code,
        content={
            "status": status,
            "db": db_status,
            "mongo_uri": _mask_uri(MONGO_URI),
        },
    )


# Admin API Endpoints
@app.post("/api/admin/login")
def admin_login(credentials: AdminLoginPayload):
    """Admin login endpoint."""
    admin = db.get_admin_by_username(credentials.username)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not utils.verify_password(credentials.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    db.update_admin_last_login(credentials.username)
    
    # Create admin token
    token = utils.create_access_token(
        {
            "username": admin["username"],
            "role": "admin",
            "admin_id": admin["_id"]
        },
        JWT_SECRET,
        expires_minutes=SESSION_EXPIRES_MINUTES * 4  # Longer session for admins
    )
    
    return JSONResponse({
        "token": token,
        "admin": {
            "username": admin["username"],
            "email": admin["email"],
            "last_login": admin["last_login"].isoformat() if admin["last_login"] else None
        }
    })


@app.get("/api/admin/stats")
def get_system_stats(current_admin: dict = Depends(get_current_admin)):
    """Get system statistics for admin dashboard."""
    stats = db.get_system_stats()
    return JSONResponse({"stats": stats})


@app.get("/api/admin/users")
def get_all_users(
    limit: int = 50, 
    offset: int = 0,
    current_admin: dict = Depends(get_current_admin)
):
    """Get all users for admin management."""
    users = db.get_all_users(limit=limit, offset=offset)
    
    # Format users for admin view
    formatted_users = []
    for user in users:
        formatted_user = {
            "user_id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "face_count": len(user.get("faces", [])),
            "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
            "disabled": user.get("disabled", False),
            "disabled_reason": user.get("disabled_reason"),
            "disabled_at": user.get("disabled_at").isoformat() if user.get("disabled_at") else None
        }
        formatted_users.append(formatted_user)
    
    return JSONResponse({
        "users": formatted_users,
        "total_count": db.get_user_count(),
        "offset": offset,
        "limit": limit
    })


@app.post("/api/admin/users/disable")
def disable_user_account(
    action: AdminActionPayload,
    current_admin: dict = Depends(get_current_admin)
):
    """Disable a user account."""
    success = db.disable_user(action.user_id, action.reason)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Log admin action
    db.log_action(
        action.user_id, 
        "admin_disable",
        metadata={
            "admin_username": current_admin["username"],
            "reason": action.reason
        }
    )
    
    return JSONResponse({"success": True, "message": "User account disabled"})


@app.get("/api/admin/logs")
def get_all_logs(
    limit: int = 100,
    action_filter: str = None,
    current_admin: dict = Depends(get_current_admin)
):
    """Get system logs for admin monitoring."""
    logs = db.get_logs(limit=limit)
    
    # Filter by action if specified
    if action_filter:
        logs = [log for log in logs if log.get("action") == action_filter]
    
    # Format logs for admin view
    formatted_logs = []
    for log in logs:
        formatted_log = {
            "_id": log["_id"],
            "user_id": log["user_id"],
            "action": log["action"],
            "confidence": log.get("confidence"),
            "timestamp": log["timestamp"].isoformat() if hasattr(log["timestamp"], 'isoformat') else log["timestamp"],
            "metadata": log.get("metadata", {}),
            "success": log.get("success", True)
        }
        formatted_logs.append(formatted_log)
    
    return JSONResponse({"logs": formatted_logs})


@app.get("/api/admin/analytics")
def get_analytics(
    days: int = 7,
    current_admin: dict = Depends(get_current_admin)
):
    """Get analytics data for admin dashboard."""
    # This is a simplified version - in production you'd query actual data
    if DEV_MODE_NO_DB:
        # Mock analytics data
        analytics = {
            "user_growth": [
                {"date": "2025-09-21", "count": 5},
                {"date": "2025-09-22", "count": 8},
                {"date": "2025-09-23", "count": 12},
                {"date": "2025-09-24", "count": 15},
                {"date": "2025-09-25", "count": 18},
                {"date": "2025-09-26", "count": 22},
                {"date": "2025-09-27", "count": 25},
            ],
            "authentication_trends": [
                {"date": "2025-09-21", "successful": 45, "failed": 3},
                {"date": "2025-09-22", "successful": 52, "failed": 2},
                {"date": "2025-09-23", "successful": 68, "failed": 5},
                {"date": "2025-09-24", "successful": 71, "failed": 4},
                {"date": "2025-09-25", "successful": 83, "failed": 6},
                {"date": "2025-09-26", "successful": 95, "failed": 7},
                {"date": "2025-09-27", "successful": 102, "failed": 5},
            ],
            "confidence_distribution": {
                "high": 75,  # >= 0.9
                "medium": 20,  # 0.7-0.89
                "low": 5  # < 0.7
            },
            "popular_actions": [
                {"action": "login", "count": 245},
                {"action": "verify", "count": 89},
                {"action": "enroll", "count": 34},
                {"action": "signup", "count": 25},
            ]
        }
        return JSONResponse({"analytics": analytics})
    
    # Production implementation would analyze actual data
    return JSONResponse({"analytics": {}})
    try:
        # call a light DB operation to verify connectivity
        # db.get_logs uses the db layer and will raise DBUnavailable if not connected
        db.get_logs(limit=1)
        db_status = {"reachable": True}
        status = "ok"
        code = 200
    except DBUnavailable as e:
        db_status = {"reachable": False, "error": str(e)}
        status = "partial"
        code = 503

    return JSONResponse(
        status_code=code,
        content={
            "status": status,
            "db": db_status,
            "mongo_uri": _mask_uri(MONGO_URI),
        },
    )
