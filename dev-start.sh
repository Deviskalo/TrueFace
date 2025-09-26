#!/bin/bash
set -euo pipefail

# Start both backend (uvicorn) and frontend (Next.js) in the background with logs.
# This script is idempotent and will only install dependencies if missing.

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_VENV="$BACKEND_DIR/venv"
LOG_DIR_BACKEND="$BACKEND_DIR/.dev"
LOG_DIR_FRONTEND="$FRONTEND_DIR/.dev"

mkdir -p "$LOG_DIR_BACKEND" "$LOG_DIR_FRONTEND"

echo "🚀 Starting TrueFace Development Environment"
echo "========================================"

# Ensure Python virtual environment and deps
if [ ! -d "$BACKEND_VENV" ]; then
  echo "⚠️  Backend Python virtual environment not found. Creating one..."
  python -m venv "$BACKEND_VENV"
  source "$BACKEND_VENV/bin/activate"
  pip install -r "$BACKEND_DIR/requirements.txt"
  deactivate || true
fi

# Ensure Node dependencies
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "⚠️  Frontend dependencies not installed. Installing..."
  (cd "$FRONTEND_DIR" && npm install)
fi

# Check if ports are free
BACKEND_PORT=8000
FRONTEND_PORT=3000

if lsof -i :$BACKEND_PORT -sTCP:LISTEN -Pn >/dev/null 2>&1; then
  echo "ℹ️  Backend port $BACKEND_PORT already in use. Skipping backend start."
else
  echo "▶️  Starting backend on http://localhost:$BACKEND_PORT ..."
  ( 
    source "$BACKEND_VENV/bin/activate"
    # Use fully-qualified module path to avoid relative import issues
    exec uvicorn backend.main:app --reload --host 0.0.0.0 --port $BACKEND_PORT \
      >"$LOG_DIR_BACKEND/uvicorn.log" 2>&1 
  ) &
  echo $! > "$LOG_DIR_BACKEND/uvicorn.pid"
fi

if lsof -i :$FRONTEND_PORT -sTCP:LISTEN -Pn >/dev/null 2>&1; then
  echo "ℹ️  Frontend port $FRONTEND_PORT already in use. Skipping frontend start."
else
  echo "▶️  Starting frontend on http://localhost:$FRONTEND_PORT ..."
  ( 
    cd "$FRONTEND_DIR"
    exec npm run dev \
      >"$LOG_DIR_FRONTEND/next.log" 2>&1 
  ) &
  echo $! > "$LOG_DIR_FRONTEND/next.pid"
fi

sleep 1

echo ""
echo "📝 Development URLs:"
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo "   Backend:  http://localhost:$BACKEND_PORT"
echo ""
echo "🗒️  Logs:"
echo "   Backend: tail -f $LOG_DIR_BACKEND/uvicorn.log"
echo "   Frontend: tail -f $LOG_DIR_FRONTEND/next.log"
echo ""
echo "✅ Done. Servers should be starting in the background."
echo "   Use Ctrl+C to exit this script; background servers will continue running."
