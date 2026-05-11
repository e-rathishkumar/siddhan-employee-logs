# AttendAI Backend

AI-powered Attendance Management System - Backend API

## Tech Stack

- **Framework**: FastAPI 0.115
- **Database**: PostgreSQL 16 (production) / SQLite (local dev)
- **ORM**: SQLAlchemy 2.0 (sync)
- **Auth**: JWT (python-jose) + bcrypt
- **Migrations**: Alembic
- **Python**: 3.9+

## Quick Start (Local)

```bash
cd attendance-backend

# Create venv & install
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Create .env (see .env.example) or set env vars
export DATABASE_URL="sqlite:///./attendai.db"
export DEFAULT_ADMIN_EMAIL="admin@siddhan.com"
export DEFAULT_ADMIN_PASSWORD="Siddhan@123"
export JWT_SECRET_KEY="$(openssl rand -hex 32)"

# Seed database
python scripts/seed.py

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Login Credentials

Credentials are configured via environment variables:

| Variable | Description | Default |
|---|---|---|
| `DEFAULT_ADMIN_EMAIL` | Admin login email | (must be set) |
| `DEFAULT_ADMIN_PASSWORD` | Admin login password | (must be set) |

## API Documentation

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
- OpenAPI JSON: http://localhost:8000/api/openapi.json

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh | Refresh token |
| GET | /api/v1/dashboard/summary | Dashboard stats |
| GET/POST/PUT/DELETE | /api/v1/employees | Employee CRUD |
| GET/POST/PUT/DELETE | /api/v1/departments | Department CRUD |
| GET | /api/v1/departments/all | All departments (no pagination) |
| GET/POST/PUT/DELETE | /api/v1/shifts | Shift CRUD |
| GET/POST/DELETE | /api/v1/shifts/assignments | Shift assignments |
| GET/POST/PUT/DELETE | /api/v1/holidays | Holiday CRUD |
| GET/POST/PUT/DELETE | /api/v1/leaves/types | Leave type CRUD |
| GET | /api/v1/leaves/requests | Leave requests list |
| PATCH | /api/v1/leaves/requests/:id/approve | Approve leave |
| PATCH | /api/v1/leaves/requests/:id/reject | Reject leave |
| GET | /api/v1/leaves/balances | Leave balances |
| GET | /api/v1/attendance | Attendance records |
| GET | /api/v1/attendance/export | Export attendance CSV |
| GET | /api/v1/analytics/trends | Attendance trends |
| GET | /api/v1/analytics/departments | Dept analytics |
| GET | /api/v1/analytics/summary | Analytics summary |
| GET/POST/PUT/DELETE | /api/v1/geofences | Geofence CRUD |
| GET/POST/PUT | /api/v1/users | User management |
| PATCH | /api/v1/users/:id/activate | Activate user |
| PATCH | /api/v1/users/:id/deactivate | Deactivate user |
| POST | /api/v1/users/:id/reset-password | Reset password |
| GET/POST/PUT/DELETE | /api/v1/roles | Role CRUD |
| GET | /api/v1/audit/logs | Audit logs |
| GET/PUT | /api/v1/settings | Company settings |
| POST | /api/v1/reports/generate | Generate report |
| GET | /api/v1/i18n/messages | Get translations |
| GET | /api/v1/i18n/locales | Available locales |

## Localization

Supported languages:
- English (en)
- Hindi (hi) - हिंदी
- Tamil (ta) - தமிழ்

Pass `Accept-Language` header or `?lang=hi` query param.

## Docker (Production)

```bash
docker compose up --build
```

Services:
- `db`: PostgreSQL 16
- `backend`: FastAPI on port 8000
- `admin`: Admin UI on port 5173

## Project Structure

```
attendance-backend/
├── app/
│   ├── api/v1/endpoints/    # Route handlers
│   ├── core/                # Config, security, deps
│   ├── db/                  # Database engine & session
│   ├── i18n/locales/        # Translation files (en, hi, ta)
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   └── services/            # Business logic
├── alembic/                 # DB migrations
├── scripts/seed.py          # Initial data seeder
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```
