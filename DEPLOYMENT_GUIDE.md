# Siddhan Employee Logs — Deployment Guide

> Last updated: 12 May 2026  
> **Live URL:** https://siddhan-logs.onrender.com

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Live Deployment (Current)](#3-live-deployment-current)
4. [Local Development (Docker Compose)](#4-local-development-docker-compose)
5. [Redeploy / Update](#5-redeploy--update)
6. [Mobile App Builds](#6-mobile-app-builds)
7. [Login Credentials](#7-login-credentials)
8. [Service URLs](#8-service-urls)
9. [Components](#9-components)
10. [Database](#10-database)
11. [API Reference](#11-api-reference)
12. [Face Recognition System](#12-face-recognition-system)
13. [Troubleshooting](#13-troubleshooting)
14. [Project Structure](#14-project-structure)

---

## 1. Project Overview

Siddhan Employee Logs is a face-recognition-based attendance management system.

| Component | Technology | Purpose |
|---|---|---|
| **Backend** | Python 3.11 + FastAPI + SQLite | REST API, JWT auth, face recognition |
| **Admin Web** | React 19 + TypeScript + Vite | HR admin dashboard |
| **DB Admin** | Python Flask | SQLite CRUD web UI |
| **Employee App** | Flutter (iOS + Android) | Employee check-in/out, 360° face registration |
| **Kiosk App** | Flutter (iOS + Android) | Face-recognition kiosk with TTS, gender-based voice |

---

## 2. Architecture

### Production (Single Container on Render.com)

```
┌──────────────────────────────────────────────────────────────────┐
│  Render.com (Free Tier)                                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Docker Container (Dockerfile.prod)                        │  │
│  │                                                            │  │
│  │  nginx :10000 (reverse proxy)                              │  │
│  │    /         → Admin (React static files)                  │  │
│  │    /api/*    → Backend (FastAPI :8000)                     │  │
│  │    /ws       → WebSocket                                   │  │
│  │    /uploads  → Uploaded face/avatar files                  │  │
│  │    /db/      → DB Admin (Flask :8080)                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          │                                       │
│         https://siddhan-logs.onrender.com                        │
│                          │                                       │
│           ┌──────────────▼──────────────┐                        │
│           │  Mobile Apps + Browsers     │                        │
│           │  (HTTPS from anywhere)      │                        │
│           └─────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Live Deployment (Current)

The system is deployed on **Render.com** as a Docker web service. The URL is **permanent** — it never changes.

### Access Points

| Service | URL |
|---|---|
| **Admin Dashboard** | https://siddhan-logs.onrender.com |
| **Backend API** | https://siddhan-logs.onrender.com/api/v1 |
| **Swagger Docs** | https://siddhan-logs.onrender.com/api/docs |
| **DB Admin** | https://siddhan-logs.onrender.com/db/ |
| **Health Check** | https://siddhan-logs.onrender.com/health |

### How It Works

1. **GitHub repo** `e-rathishkumar/siddhan-employee-logs` is connected to Render
2. Every `git push origin main` triggers an **automatic redeploy**
3. `render.yaml` in the repo root defines the service configuration
4. Render builds `Dockerfile.prod` (multi-stage: python deps → admin frontend → final image)
5. Deployed container runs nginx (port 10000) + FastAPI backend + Flask DB admin

### GitHub Repository

```
https://github.com/e-rathishkumar/siddhan-employee-logs
```

### Render Dashboard

```
https://dashboard.render.com
```
Service name: `siddhan-logs`

---

## 4. Local Development (Docker Compose)

For development, use the 3-container setup:

```bash
cd "Log Maintanance"
docker compose up -d --build
```

| Service | URL |
|---|---|
| Backend | http://localhost:8000 |
| Admin | http://localhost:3000 |
| DB Admin | http://localhost:8080 |

```bash
docker compose down         # Stop (keep data)
docker compose down -v      # Reset all data
```

---

## 5. Redeploy / Update

To push changes and trigger a new deploy on Render:

```bash
cd "Log Maintanance"
git add -A
git commit -m "your changes"
git push origin main
# Render auto-deploys within ~5 minutes
```

To manually trigger a redeploy without code changes:
- Go to https://dashboard.render.com → `siddhan-logs` → **Manual Deploy** → **Deploy latest commit**

---

## 6. Mobile App Builds

### Employee App

```bash
cd employee_app
flutter pub get

# Uses Render URL by default
flutter run

# Override for local dev
flutter run --dart-define=API_BASE_URL=http://<YOUR_IP>:8000/api/v1

# Build APK
flutter build apk --release
```

### Kiosk App

```bash
cd kiosk_app
flutter pub get

# Uses Render URL by default
flutter run

# Override for local dev
flutter run --dart-define=API_BASE_URL=http://<YOUR_IP>:8000

# Build APK
flutter build apk --release
```

---

## 7. Login Credentials

| User | Email | Password | Where |
|------|-------|----------|-------|
| **Admin** | `admin@siddhan.com` | `Siddhan@123` | Admin Web + Kiosk Login |
| **Employee** | (created by admin) | (set by admin) | Employee App |

### Environment Variables (set in render.yaml)

| Variable | Value |
|---|---|
| `DATABASE_URL` | `sqlite:////app/data/siddhan_logs.db` |
| `JWT_SECRET_KEY` | auto-generated by Render |
| `FACE_MATCH_THRESHOLD` | `0.80` (80%) |
| `ALLOWED_ORIGINS` | `*` |
| `DEFAULT_ADMIN_EMAIL` | `admin@siddhan.com` |
| `DEFAULT_ADMIN_PASSWORD` | `Siddhan@123` |
| `DATABASE_PATH` | `/app/data/siddhan_logs.db` |

---

## 8. Service URLs

### Production (Live — Permanent)

| Service | URL |
|---|---|
| Admin Web | https://siddhan-logs.onrender.com |
| Backend API | https://siddhan-logs.onrender.com/api/v1 |
| DB Admin | https://siddhan-logs.onrender.com/db/ |
| Swagger Docs | https://siddhan-logs.onrender.com/api/docs |
| Health | https://siddhan-logs.onrender.com/health |

### Local Development

| Service | URL |
|---|---|
| Backend | http://localhost:8000 |
| Admin | http://localhost:3000 |
| DB Admin | http://localhost:8080 |

---

## 9. Components

### Backend (FastAPI)
- JWT authentication (access + refresh tokens)
- Face recognition via dlib + face_recognition
- SQLite database (file-based, zero config)
- WebSocket for real-time kiosk updates

### Admin Web (React + Vite)
- Employee CRUD with 2-column grid form
- Gender field (Male/Female/Other)
- Attendance logs, geofencing, audit trail
- Real-time dashboard

### Employee App (Flutter)
- 360° face registration (7 angles)
- Profile with pencil-edit for face re-registration
- Gender display, attendance history
- Geofence-based check-in/out

### Kiosk App (Flutter)
- Login screen (admin authenticates kiosk)
- **Text-to-Speech:** Gender-based voice on check-in/out screens
  - Male voice (Aaron on iOS) for male employees
  - Female voice (Samantha on iOS) for female employees
  - Android: scans available voices; pitch fallback if none match
- Gender-based avatar (blue/male, pink/female)
- One check-in/out per day enforcement
- Admin logout (visible on admin face detect)

### DB Admin (Flask)
- Browse tables, edit/delete rows
- Raw SQL console
- Dark-themed UI

---

## 10. Database

SQLite at `/app/data/siddhan_logs.db` (in Render persistent disk)

| Table | Purpose |
|---|---|
| `users` | Auth accounts |
| `employees` | Profiles (name, email, gender, designation) |
| `check_logs` | Check-in/out records |
| `face_photos` | Face encodings |
| `kiosk_logs` | Kiosk activity |
| `geofence_zones` | Geofence definitions |
| `audit_logs` | Audit trail |

---

## 11. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/api/v1/auth/login` | POST | Login (JWT) |
| `/api/v1/employees` | GET/POST | Employee CRUD |
| `/api/v1/face/detect-and-mark` | POST | Detect + attendance |
| `/api/v1/face/register-360` | POST | 360° registration |
| `/api/v1/face/kiosk-recheckin/{id}` | POST | Re-check-in |
| `/api/v1/logs` | GET | Attendance logs |
| `/api/v1/dashboard/employee` | GET | Employee dashboard |

Full docs: https://siddhan-logs.onrender.com/api/docs

---

## 12. Face Recognition System

- **360° Registration:** 7 angles (front, left/right 45°/90°, up, down)
- **5-Day Rolling Training:** Daily captures, oldest auto-deleted on day 6
- **Ensemble Matching:** Min distance across all encodings, ≥80% confidence
- **Head-Focused Detection:** Expanded bounding boxes for better visibility

---

## 13. Troubleshooting

| Issue | Fix |
|---|---|
| Site down / sleeping | First request wakes it (~30s on free tier); wait and refresh |
| Face not detected | Better lighting, clear face |
| Mobile can't reach API | Check: `curl https://siddhan-logs.onrender.com/health` |
| Force redeploy | Render Dashboard → `siddhan-logs` → Manual Deploy |
| View logs | Render Dashboard → `siddhan-logs` → Logs tab |

> **Note:** Render free tier **spins down after 15 minutes of inactivity**. The first request after sleep takes ~30 seconds to wake up. Paid tier ($7/mo) keeps it always on.

---

## 14. Project Structure

```
Log Maintanance/
├── Dockerfile.prod          # Production multi-stage build
├── render.yaml              # Render Blueprint config
├── docker-compose.yml       # Local development (3 containers)
├── .dockerignore
├── deploy/
│   ├── nginx-prod.conf      # Nginx reverse proxy config
│   └── start.sh             # Container startup script
├── attendance-backend/      # FastAPI backend
├── ai-attendance-admin/     # React admin dashboard
├── db-admin/                # Flask DB admin UI
├── employee_app/            # Flutter employee app
└── kiosk_app/               # Flutter kiosk app
```

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Live Deployment (Current)](#3-live-deployment-current)
4. [Local Development (Docker Compose)](#4-local-development-docker-compose)
5. [Production Deployment Options](#5-production-deployment-options)
6. [Mobile App Builds](#6-mobile-app-builds)
7. [Login Credentials](#7-login-credentials)
8. [Service URLs](#8-service-urls)
9. [Components](#9-components)
10. [Database](#10-database)
11. [API Reference](#11-api-reference)
12. [Face Recognition System](#12-face-recognition-system)
13. [Troubleshooting](#13-troubleshooting)
14. [Project Structure](#14-project-structure)

---

## 1. Project Overview

Siddhan Employee Logs is a face-recognition-based attendance management system.

| Component | Technology | Purpose |
|---|---|---|
| **Backend** | Python 3.11 + FastAPI + SQLite | REST API, JWT auth, face recognition |
| **Admin Web** | React 19 + TypeScript + Vite | HR admin dashboard |
| **DB Admin** | Python Flask | SQLite CRUD web UI |
| **Employee App** | Flutter (iOS + Android) | Employee check-in/out, 360° face registration |
| **Kiosk App** | Flutter (iOS + Android) | Face-recognition kiosk with login + admin logout |

---

## 2. Architecture

### Production (Single Container + Cloudflare Tunnel)

```
┌──────────────────────────────────────────────────────────────────┐
│  YOUR MACHINE (Docker)                                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  siddhan-prod container (:10000)                           │  │
│  │                                                            │  │
│  │  nginx (reverse proxy)                                     │  │
│  │    /         → Admin (React static)                        │  │
│  │    /api/*    → Backend (FastAPI :8000)                      │  │
│  │    /ws       → WebSocket                                   │  │
│  │    /uploads  → Uploaded files                              │  │
│  │    /db/      → DB Admin (Flask :8080)                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          │                                       │
│               cloudflared tunnel                                 │
│                          │                                       │
│  ┌───────────────────────▼────────────────────────────────────┐  │
│  │  Cloudflare Edge Network                                   │  │
│  │  https://insertion-miami-participation-enhancements         │  │
│  │         .trycloudflare.com                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ▲                                       │
│           ┌──────────────┴──────────────┐                       │
│           │ Mobile Apps + Browsers      │                       │
│           │ (HTTPS from anywhere)       │                       │
│           └─────────────────────────────┘                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Live Deployment (Current)

The system is deployed using a **single Docker container** exposed via **Cloudflare Tunnel**.

### Access Points

| Service | URL |
|---|---|
| **Admin Dashboard** | https://insertion-miami-participation-enhancements.trycloudflare.com |
| **Backend API** | https://insertion-miami-participation-enhancements.trycloudflare.com/api/v1 |
| **Swagger Docs** | https://insertion-miami-participation-enhancements.trycloudflare.com/api/docs |
| **DB Admin** | https://insertion-miami-participation-enhancements.trycloudflare.com/db/ |
| **Health Check** | https://insertion-miami-participation-enhancements.trycloudflare.com/health |

### How It Works

1. **Docker container** `siddhan-prod` runs all services on port 10000
2. **Cloudflare Tunnel** (`cloudflared`) exposes port 10000 as a public HTTPS URL
3. Cloudflare provides SSL, DDoS protection, and global CDN automatically
4. Mobile apps connect via the HTTPS URL — works from any network

### Restart the Deployment

```bash
# 1. Start the production container
docker start siddhan-prod

# 2. Start the tunnel (get a new URL each time for quick tunnels)
cloudflared tunnel --url http://localhost:10000

# 3. Update mobile app URLs if the tunnel URL changes
#    employee_app/lib/core/constants/api_constants.dart
#    kiosk_app/lib/kiosk_screen.dart
```

### First-Time Setup

```bash
# Build the production image
cd "Log Maintanance"
docker build -f Dockerfile.prod -t siddhan-logs-prod .

# Run the container with persistent volumes
docker run -d --name siddhan-prod -p 10000:10000 \
  -e DATABASE_URL=sqlite:////app/data/siddhan_logs.db \
  -e JWT_SECRET_KEY=your-secure-key-here \
  -e FACE_MATCH_THRESHOLD=0.80 \
  -e ALLOWED_ORIGINS="*" \
  -e DEFAULT_ADMIN_EMAIL=admin@siddhan.com \
  -e DEFAULT_ADMIN_PASSWORD=Siddhan@123 \
  -e DATABASE_PATH=/app/data/siddhan_logs.db \
  -v siddhan_prod_data:/app/data \
  -v siddhan_prod_uploads:/app/backend/uploads \
  siddhan-logs-prod

# Expose via Cloudflare Tunnel
cloudflared tunnel --url http://localhost:10000
```

---

## 4. Local Development (Docker Compose)

For development, use the 3-container setup:

```bash
cd "Log Maintanance"
docker compose up -d --build
```

| Service | URL |
|---|---|
| Backend | http://localhost:8000 |
| Admin | http://localhost:3000 |
| DB Admin | http://localhost:8080 |

```bash
docker compose down         # Stop (keep data)
docker compose down -v      # Reset all data
```

---

## 5. Production Deployment Options

### Option A: Cloudflare Tunnel (Current — Free, Instant)

- Zero account needed for quick tunnels
- Free HTTPS + SSL + DDoS protection
- URL changes on restart (use named tunnels for permanent URL)
- Runs on your machine — no cloud hosting fees

### Option B: Render.com (Free Tier)

1. Push repo to GitHub
2. Render Dashboard → New → Web Service → connect repo
3. Set Dockerfile Path: `Dockerfile.prod`, Context: `.`
4. Add env vars from `render.yaml`
5. Deploy — gets URL like `https://siddhan-logs.onrender.com`

### Option C: Named Cloudflare Tunnel (Permanent URL)

```bash
# One-time setup (requires free Cloudflare account)
cloudflared tunnel login
cloudflared tunnel create siddhan-logs
cloudflared tunnel route dns siddhan-logs siddhan.yourdomain.com
cloudflared tunnel run --url http://localhost:10000 siddhan-logs
```

---

## 6. Mobile App Builds

### Employee App

```bash
cd employee_app
flutter pub get

# Uses the live tunnel URL by default
flutter run

# Override for local dev
flutter run --dart-define=API_BASE_URL=http://<YOUR_IP>:8000/api/v1

# Build APK
flutter build apk --release
```

### Kiosk App

```bash
cd kiosk_app
flutter pub get

# Uses the live tunnel URL by default
flutter run

# Override for local dev
flutter run --dart-define=API_BASE_URL=http://<YOUR_IP>:8000

# Build APK
flutter build apk --release
```

---

## 7. Login Credentials

| User | Email | Password | Where |
|------|-------|----------|-------|
| Admin | `admin@siddhan.com` | `Siddhan@123` | Admin Web + Kiosk Login |
| Employee | (created by admin) | (set by admin) | Employee App |

---

## 8. Service URLs

### Production (Live)

| Service | URL |
|---|---|
| Admin Web | https://insertion-miami-participation-enhancements.trycloudflare.com |
| Backend API | https://insertion-miami-participation-enhancements.trycloudflare.com/api/v1 |
| DB Admin | https://insertion-miami-participation-enhancements.trycloudflare.com/db/ |
| Swagger Docs | https://insertion-miami-participation-enhancements.trycloudflare.com/api/docs |

### Local Development

| Service | URL |
|---|---|
| Backend | http://localhost:8000 |
| Admin | http://localhost:3000 |
| DB Admin | http://localhost:8080 |

---

## 9. Components

### Backend (FastAPI)
- JWT authentication (access + refresh tokens)
- Face recognition via dlib + face_recognition
- SQLite database (file-based, zero config)
- WebSocket for real-time kiosk updates

### Admin Web (React + Vite)
- Employee CRUD with 2-column grid form
- Gender field (Male/Female/Other)
- Attendance logs, geofencing, audit trail
- Real-time dashboard

### Employee App (Flutter)
- 360° face registration (7 angles)
- Profile with pencil-edit for face re-registration
- Gender display, attendance history
- Geofence-based check-in/out

### Kiosk App (Flutter)
- Login screen (admin authenticates kiosk)
- Gender-based avatar (blue/male, pink/female)
- One check-in/out per day enforcement
- Admin logout (visible on admin face detect)

### DB Admin (Flask)
- Browse tables, edit/delete rows
- Raw SQL console
- Dark-themed UI

---

## 10. Database

SQLite at `/app/data/siddhan_logs.db` (in Docker volume `siddhan_prod_data`)

| Table | Purpose |
|---|---|
| `users` | Auth accounts |
| `employees` | Profiles (name, email, gender, designation) |
| `check_logs` | Check-in/out records |
| `face_photos` | Face encodings |
| `kiosk_logs` | Kiosk activity |
| `geofence_zones` | Geofence definitions |
| `audit_logs` | Audit trail |

### Reset

```bash
docker stop siddhan-prod
docker volume rm siddhan_prod_data
docker start siddhan-prod
```

---

## 11. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/api/v1/auth/login` | POST | Login (JWT) |
| `/api/v1/employees` | GET/POST | Employee CRUD |
| `/api/v1/face/detect-and-mark` | POST | Detect + attendance |
| `/api/v1/face/register-360` | POST | 360° registration |
| `/api/v1/face/kiosk-recheckin/{id}` | POST | Re-check-in |
| `/api/v1/logs` | GET | Attendance logs |
| `/api/v1/dashboard/employee` | GET | Employee dashboard |

Full docs: `/api/docs`

---

## 12. Face Recognition System

- **360° Registration:** 7 angles (front, left/right 45°/90°, up, down)
- **5-Day Rolling Training:** Daily captures, oldest auto-deleted on day 6
- **Ensemble Matching:** Min distance across all encodings, ≥80% confidence
- **Head-Focused Detection:** Expanded bounding boxes for better visibility

---

## 13. Troubleshooting

| Issue | Fix |
|---|---|
| Container not starting | `docker logs siddhan-prod` |
| Tunnel URL changed | Update URLs in mobile app constants, re-run apps |
| Face not detected | Better lighting, clear face |
| Mobile can't reach API | Check tunnel is running: `curl <tunnel-url>/health` |
| Reset database | `docker volume rm siddhan_prod_data && docker start siddhan-prod` |

---

## 14. Project Structure

```
siddhan-employee-logs/
├── docker-compose.yml           # Local: 3 containers
├── Dockerfile.prod              # Production: combined container
├── render.yaml                  # Render.com Blueprint
├── deploy/
│   ├── nginx-prod.conf          # Production nginx
│   └── start.sh                 # Production startup
├── ai-attendance-admin/         # Admin Web (React)
├── attendance-backend/          # Backend (FastAPI)
├── db-admin/                    # DB Admin (Flask)
├── employee_app/                # Employee App (Flutter)
└── kiosk_app/                   # Kiosk App (Flutter)
```
