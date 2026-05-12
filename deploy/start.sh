#!/bin/bash
set -e

echo "=== Siddhan Logs - Starting Services ==="

# Create data directories
mkdir -p /app/data /app/backend/uploads/faces /app/backend/uploads/avatars

# Seed the database (creates admin user + tables)
echo "[1/4] Seeding database..."
cd /app/backend && python scripts/seed.py

# Start backend (FastAPI + Uvicorn)
# IMPORTANT: Single worker to stay within Render free tier 512MB RAM.
# dlib + face_recognition uses ~200-300MB per worker.
echo "[2/4] Starting backend on :8000..."
cd /app/backend && uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1 --timeout-keep-alive 120 &
BACKEND_PID=$!

# Start DB Admin (Flask)
echo "[3/4] Starting DB Admin on :8080..."
cd /app/db-admin && python app.py &
DBADMIN_PID=$!

# Wait for backend to be ready (up to 30s)
echo "[4/4] Waiting for backend to be ready..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "  Backend ready after ${i}s"
    break
  fi
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERROR: Backend process died!"
    exit 1
  fi
  sleep 1
done

# Start nginx in foreground
nginx -g "daemon off;" &
NGINX_PID=$!

echo "=== All services started ==="
echo "  Admin Panel : http://localhost:10000"
echo "  Backend API : http://localhost:10000/api/v1"
echo "  DB Admin    : http://localhost:10000/db/"
echo "  Health      : http://localhost:10000/health"

# Wait for any process to exit
wait -n $BACKEND_PID $DBADMIN_PID $NGINX_PID

# If any process exits, stop all
echo "A service exited, shutting down..."
kill $BACKEND_PID $DBADMIN_PID $NGINX_PID 2>/dev/null
exit 1
