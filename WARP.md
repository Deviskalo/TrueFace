# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

TrueFace is a full-stack facial recognition authentication system built with:
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and React 19
- **Backend**: FastAPI with Python, MongoDB for data storage
- **Face Recognition**: ONNX-based embedding extraction with ANN indexing
- **Authentication**: JWT tokens with session management

## Development Commands

### Quick Start
```bash
# Start both frontend and backend (interactive setup)
./dev-start.sh

# Run integration tests
./test-integration.sh
```

### Frontend (Next.js)
```bash
cd frontend

# Development
npm run dev          # Start dev server with Turbopack on http://localhost:3000
npm run build        # Production build with Turbopack
npm start            # Start production server
npm run lint         # Run ESLint

# Dependencies
npm install          # Install dependencies
```

### Backend (FastAPI)
```bash
# Setup virtual environment
python -m venv backend/venv
source backend/venv/bin/activate  # On Windows: backend\venv\Scripts\activate
pip install -r backend/requirements.txt

# Development (run from repo root to honor package imports)
uvicorn backend.main:app --reload --port 8000  # http://localhost:8000

# Testing (run from repo root)
pytest backend/tests                   # Run all backend tests
pytest backend/tests/test_api.py -q    # Run specific test file
pytest -q backend/tests -k signup      # Run tests matching keyword

# Production
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

## Architecture

### High-Level Structure
```
TrueFace/
├── frontend/          # Next.js React application
├── backend/           # FastAPI Python application  
├── dev-start.sh       # Development startup script
└── test-integration.sh # Integration test suite
```

### Frontend Architecture
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4.x
- **Camera Integration**: react-webcam for face capture
- **API Communication**: Custom useApi hook for backend integration
- **Pages**: Home, Auth (signup/login), Dashboard
- **Key Components**: WebcamCapture, authentication forms

### Backend Architecture
- **API Framework**: FastAPI with automatic OpenAPI docs at `/docs`
- **Database**: MongoDB with PyMongo driver
- **Face Recognition Pipeline**:
  - Image processing and face detection
  - Embedding extraction (configurable with ONNX models)
  - Vector similarity search with optional HNSWLIB ANN indexing
- **Authentication**: JWT tokens with session management and expiry
- **API Endpoints**:
  - `/api/auth/*` - Authentication (signup, login, logout)
  - `/api/face/*` - Face operations (enroll, verify, recognize)
  - `/api/logs` - Activity logging
  - `/health` - Health check with DB connectivity

### Database Schema
- **users**: User profiles with embedded face encodings
- **sessions**: JWT session tracking with expiry
- **logs**: Authentication and recognition activity

### Key Backend Modules
- `main.py` - FastAPI application and route handlers
- `db.py` - MongoDB operations and ANN indexing
- `embeddings.py` - Face embedding extraction
- `utils.py` - JWT token utilities
- `schemas.py` - Pydantic response models

## Environment Variables

### Backend (.env)
```bash
MONGO_URI=mongodb://localhost:27017/facial_recognition_db  # MongoDB connection
JWT_SECRET=supersecretkey                                  # JWT signing key
SESSION_EXPIRES_MINUTES=60                                 # Session expiry time
DEV_MODE_NO_DB=true                                        # Skip database for development
```

### Frontend (.env)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000                  # Backend API URL
```

## Testing

### Backend Tests
- `tests/test_api.py` - Core API endpoint testing
- `tests/test_security.py` - Authentication and session security
- `tests/test_utils.py` - Utility function testing

Run with: `cd backend && pytest`

### Integration Testing
The `test-integration.sh` script verifies:
- Frontend and backend servers are running
- CORS configuration
- Database connectivity
- API endpoint accessibility

## Development Workflow

### Adding New Features
1. **Backend**: Add routes in `main.py`, database operations in `db.py`
2. **Frontend**: Create components in `frontend/components/`, add pages in `frontend/app/`
3. **API Integration**: Update `frontend/hooks/useApi.ts` for new endpoints

### Database Operations
- Users can have multiple face embeddings for improved accuracy
- ANN indexing automatically builds in-memory for fast similarity search
- All recognition activities are logged with confidence scores

### Face Recognition Pipeline
1. Image capture via webcam
2. Face detection and embedding extraction
3. Vector similarity comparison against stored embeddings
4. Confidence-based matching with configurable thresholds

## Key Dependencies

### Frontend
- Next.js 15 with Turbopack for fast builds
- React 19 for modern React features
- react-webcam for camera integration
- Tailwind CSS 4.x for styling

### Backend  
- FastAPI for modern Python web API
- PyMongo for MongoDB integration
- NumPy for vector operations
- Optional: hnswlib for fast ANN search
- pytest for testing

## Deployment Notes

### Development URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Development Mode
The project supports a `DEV_MODE_NO_DB=true` environment variable that:
- Skips MongoDB connection during startup
- Uses in-memory test data for all API endpoints
- Returns healthy status without database dependency
- Perfect for development, testing, and CI environments

### Production Considerations
- Set strong JWT_SECRET in production
- Set `DEV_MODE_NO_DB=false` or remove entirely
- Configure CORS origins for production domains
- Use connection pooling for MongoDB
- Consider Redis for session storage in multi-instance deployments
- Enable HTTPS for camera access in production

## Common Development Tasks

### Adding a New API Endpoint
1. Add route handler in `backend/main.py`
2. Add database operations in `backend/db.py` if needed
3. Add response schema in `backend/schemas.py`
4. Update `frontend/hooks/useApi.ts` for frontend integration
5. Add tests in `backend/tests/`

### Running Single Tests
```bash
cd backend
pytest tests/test_api.py::test_signup_login_enroll_verify -v
```

### Debugging Face Recognition
- Check embedding extraction in `backend/embeddings.py`
- Monitor confidence scores in database logs
- Use `/health` endpoint to verify database connectivity

### Frontend Development
- Pages auto-reload with Turbopack
- Camera permissions required for face capture
- Local storage used for token persistence
