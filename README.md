# TrueFace

## 🚀 Overview

A **full-stack facial recognition web application** using:

- **Next.js** → frontend (UI + API routes)
- **Python (FastAPI)** → backend AI service (face detection, embeddings, recognition)
- **MongoDB** → database for user info, embeddings, and recognition logs

---

## 🏗️ Features

- User **signup with face image**
- **Face login** (no password required)
- Enroll multiple faces per user
- Verify identity (1:1 face check)
- Recognize user (1:N search across DB)
- Recognition history & logs

---

## 📂 Project Structure

```
facial-recognition-app/
│── frontend/           # Next.js app
│── backend/            # Python FastAPI app
│── database/           # MongoDB setup
│── docker-compose.yml  # Local deployment
│── Context.md          # Project background & docs
│── README.md           # Main readme
```

---

## 🔑 API Endpoints

- `POST /api/auth/signup` → Register user with face
- `POST /api/auth/login` → Login via face recognition
- `POST /api/face/enroll` → Add new face embedding
- `POST /api/face/verify` → Verify identity (1:1)
- `POST /api/face/recognize` → Recognize face (1:N)
- `GET /api/logs` → View recognition history

---

## 📊 MongoDB Collections

- **users** → user info + embeddings
- **logs** → history of logins/recognitions
- **sessions** → optional JWT token storage

---

## ⚡ Setup Instructions

1. Clone repo:
   ```bash
   git clone https://github.com/Deviskalo/TrueFace.git
   cd TrueFace
   ```
2. Install dependencies for frontend & backend:
   ```bash
   cd frontend && npm install
   cd ../backend && pip install -r requirements.txt
   ```
3. Configure `.env` for MongoDB + JWT secrets.
4. Run services with Docker Compose:
   ```bash
   docker-compose up --build
   ```

---

## 🔮 Future Enhancements

- Add **liveness detection** (prevent photo spoofing)
- Integrate **2FA** (face + OTP)
- Optimize embeddings search with **Faiss/Annoy**

---

## 👨‍💻 Author

Built by Dev Iskalo - 2025
