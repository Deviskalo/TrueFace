# TrueFace - Context

## Project Overview

This project is a **Facial Recognition Web Application** designed with the following tech stack:

- **Frontend**: Next.js (for UI and lightweight API routes)
- **Backend**: Python (FastAPI/Flask for AI tasks)
- **Database**: MongoDB (for users, embeddings, and logs)

The app allows users to sign up using their face, log in via face recognition, enroll additional faces, verify identities, and view recognition history.

---

## System Design

```
                ┌──────────────────────┐
                │      Frontend        │
                │     (Next.js)        │
                │                      │
                │ - Login/Signup       │
                │ - Capture/Upload     │
                │ - Dashboard UI       │
                └─────────┬────────────┘
                          │ (REST API calls)
                          ▼
                ┌──────────────────────┐
                │   Python Backend     │
                │ (FastAPI/Flask)      │
                │                      │
                │ - Face Detection     │
                │ - Face Embeddings    │
                │ - Recognition/Verify │
                │ - API Endpoints      │
                └─────────┬────────────┘
                          │
                          ▼
                ┌──────────────────────┐
                │      MongoDB         │
                │                      │
                │ - User Data          │
                │ - Face Embeddings    │
                │ - Logs (history)     │
                └──────────────────────┘
```

---

## API Contract

### Auth Routes

- **POST /api/auth/signup** → Create user with embedding
- **POST /api/auth/login** → Login using face

### Face Routes

- **POST /api/face/enroll** → Add new embedding for user
- **POST /api/face/verify** → One-to-one verification
- **POST /api/face/recognize** → One-to-many recognition

### Logs

- **GET /api/logs** → Fetch recognition history

---

## MongoDB Schema

### Users Collection

- `_id`, `name`, `email`, `password_hash`
- `faces[]`: embedding vectors + timestamps

### Logs Collection

- `user_id`, `action`, `confidence`, `timestamp`, `metadata`

### Sessions Collection (optional)

- `user_id`, `token`, `issued_at`, `expires_at`

---

## Key Considerations

- Store embeddings, not raw images (privacy + performance)
- Use vector similarity search (`faiss` or cosine distance)
- JWT authentication for API protection
- Dockerized services for deployment
