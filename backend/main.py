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
