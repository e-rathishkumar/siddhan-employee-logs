#!/bin/bash
set -e

echo "=== Siddhan Logs - Starting Services ==="

# Create data directories
mkdir -p /app/data /app/backend/uploads/faces /app/backend/uploads/avatars

# Seed the database (creates admin user + tables)
echo "[1/4] Seeding database..."
cd /app/backend && python scripts/seed.py

# Start backend (FastAPI + Uvicorn)
echo "[2/4] Starting backend on :8000..."
cd /app/backend && uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2 &
BACKEND_PID=$!

# Start DB Admin (Flask)
echo "[3/4] Starting DB Admin on :8080..."
cd /app/db-admin && python app.py &
DBADMIN_PID=$!

# Wait for backend to be ready
echo "[4/4] Starting nginx on :10000..."
sleep 3

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
