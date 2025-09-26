# Backend (FastAPI) for TrueFace

This folder contains a minimal FastAPI backend that implements the facial recognition API contract for the TrueFace project.

Quick start (local, when MongoDB is available at MONGO_URI):

```bash
python -m venv ../backend/venv
source ../backend/venv/bin/activate
pip install -r ../backend/requirements.txt
# Run from the repository root so package imports resolve
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Environment variables:

- MONGO_URI (default: mongodb://localhost:27017/facial_recognition_db)
- JWT_SECRET (default: supersecretkey)

The implementation currently uses a simple embedding stub (random vectors) and an in-memory/vector scan for similarity. This is intended as a working prototype; replace the embedding extraction in `utils.get_embedding_from_image` with a real model later.
