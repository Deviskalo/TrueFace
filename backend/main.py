import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List

from . import db, utils

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/facial_recognition_db")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")

app = FastAPI(title="TrueFace Backend")


class SignupPayload(BaseModel):
    name: str
    email: str


@app.on_event("startup")
def startup():
    db.connect(MONGO_URI)


@app.post("/api/auth/signup")
async def signup(payload: SignupPayload, image: UploadFile = File(...)):
    contents = await image.read()
    embedding = utils.get_embedding_from_image(contents)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected")

    user = db.create_user(payload.name, payload.email, embedding)
    return JSONResponse({"user_id": str(user.inserted_id)})


@app.post("/api/auth/login")
async def login(image: UploadFile = File(...)):
    contents = await image.read()
    embedding = utils.get_embedding_from_image(contents)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected")

    match = db.find_best_match(embedding)
    if match is None:
        return JSONResponse({"match": None, "confidence": 0.0})

    return JSONResponse({"match": match})


@app.post("/api/face/enroll")
async def enroll(user_id: str, image: UploadFile = File(...)):
    contents = await image.read()
    embedding = utils.get_embedding_from_image(contents)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected")

    ok = db.add_face_to_user(user_id, embedding)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return JSONResponse({"enrolled": True})


@app.post("/api/face/verify")
async def verify(user_id: str, image: UploadFile = File(...)):
    contents = await image.read()
    embedding = utils.get_embedding_from_image(contents)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected")

    score = db.verify_user(user_id, embedding)
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
    return JSONResponse({"candidates": candidates})


@app.get("/api/logs")
def logs(limit: int = 50):
    return JSONResponse({"logs": db.get_logs(limit)})
