import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from . import db, utils

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/facial_recognition_db")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")
SESSION_EXPIRES_MINUTES = int(os.getenv("SESSION_EXPIRES_MINUTES", "60"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.connect(MONGO_URI)
    try:
        yield
    finally:
        db.close()


app = FastAPI(title="TrueFace Backend", lifespan=lifespan)
auth_scheme = HTTPBearer()


class SignupPayload(BaseModel):
    name: str
    email: str


@app.on_event("startup")
def startup():
    db.connect(MONGO_URI)


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
    embedding = utils.get_embedding_from_image(contents)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected")

    user_id = db.create_user(name, email, embedding)
    session_id = db.create_session_with_expiry(user_id, SESSION_EXPIRES_MINUTES)
    token = utils.create_access_token(
        {"user_id": user_id, "session_id": session_id}, JWT_SECRET
    )
    db.log_action(user_id, "signup", confidence=None, metadata={"email": email})
    return JSONResponse({"user_id": user_id, "token": token})


@app.post("/api/auth/login")
async def login(image: UploadFile = File(...)):
    contents = await image.read()
    embedding = utils.get_embedding_from_image(contents)
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
):
    contents = await image.read()
    embedding = utils.get_embedding_from_image(contents)
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
):
    contents = await image.read()
    embedding = utils.get_embedding_from_image(contents)
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
    embedding = utils.get_embedding_from_image(contents)
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
def logs(limit: int = 50, current_user: dict = Depends(get_current_user)):
    return JSONResponse({"logs": db.get_logs(limit)})
