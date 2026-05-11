# AI Attendance Admin Dashboard

A production-ready React + TypeScript admin dashboard for an AI-powered Employee Attendance System. Features real-time attendance monitoring, employee management, analytics, and geofence configuration.

## Tech Stack

- **Framework**: React 19 + TypeScript 6
- **Build Tool**: Vite 8
- **State Management**: Zustand (minimal boilerplate, excellent TypeScript support)
- **Styling**: Tailwind CSS 4
- **Routing**: React Router v7
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Maps**: Leaflet + React-Leaflet
- **HTTP Client**: Axios with interceptors
- **Testing**: Jest 30 + React Testing Library + MSW 2
- **Containerization**: Docker (multi-stage) + Nginx

## Architecture Decision: Zustand over Redux Toolkit

Zustand was chosen for state management because:
1. **Zero boilerplate** — no actions, reducers, or action creators
2. **TypeScript-first** — excellent type inference without extra types
3. **Lightweight** — 1KB vs ~12KB for RTK
4. **Selective subscriptions** — components only re-render on the specific slice they consume
5. **Middleware support** — persist, devtools, immer all available
6. **Simpler testing** — stores are plain functions, no provider wrapping needed

## Getting Started

### Prerequisites

- Node.js 22 LTS
- npm 10+

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1   # Backend API base URL
VITE_WS_URL=ws://localhost:8000/ws               # WebSocket URL for real-time feed
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_DEFAULT_CENTER_LAT=28.6139                  # Default map center latitude
VITE_DEFAULT_CENTER_LNG=77.2090                  # Default map center longitude
```

### Development

```bash
npm run dev
```

App runs at `http://localhost:3000`. API requests are proxied to `http://localhost:8000`.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report (target: 80%)
npm run test:coverage
```

### Test Structure

- `src/**/*.test.ts(x)` — co-located with source files
- `src/test/mocks/handlers.ts` — MSW request handlers
- `src/test/mocks/server.ts` — MSW server setup
- `src/test/utils/` — test utilities (render with providers)

## Project Structure

```
src/
├── features/           # Feature-based modules
│   ├── auth/          # Login, route protection
│   ├── employees/     # CRUD, face photos
│   ├── attendance/    # Dashboard, filters, real-time
│   ├── analytics/     # Charts, reports
│   └── geofence/      # Map, zone management
├── shared/
│   ├── api/           # Axios client with interceptors
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom hooks
│   ├── types/         # TypeScript interfaces
│   └── utils/         # Utility functions
├── stores/            # Zustand stores
├── layouts/           # Page layouts
├── routes/            # Route definitions
└── test/              # Test infrastructure
```

## Modules

### Auth
- JWT-based login with form validation
- Role-based route protection (admin, manager, viewer)
- Automatic token refresh with request queue
- Global 401/403 handling

### Employee Management
- Paginated employee list with search
- Create/edit employee form with Zod validation
- Face embedding photo upload
- Employee deactivation

### Attendance Dashboard
- Real-time attendance feed via WebSocket + polling fallback
- Filters: date, employee, department, status
- CSV/Excel export
- Status badges (present, absent, late, half-day)

### Analytics
- Daily/weekly/monthly trend lines
- Department attendance rate bar charts
- Absenteeism pie chart breakdown
- Summary KPI cards

### Geofence Configuration
- Interactive Leaflet map
- Click-to-place zone center
- Configurable radius per zone
- Visual zone circles on map
- CRUD zone management

## Docker

### Build & Run

```bash
# Build image
docker build -t ai-attendance-admin \
  --build-arg VITE_API_BASE_URL=http://api.example.com/api/v1 \
  --build-arg VITE_WS_URL=ws://api.example.com/ws \
  .

# Run container
docker run -p 3000:80 ai-attendance-admin
```

### Docker Compose (Full Stack)

```bash
docker-compose up -d
```

Services:
- **frontend**: React app on Nginx (port 3000)
- **backend**: API server (port 8000)
- **db**: PostgreSQL 16 (port 5432)
- **redis**: Redis 7 (port 6379)

## API Integration

All API calls go through `src/shared/api/client.ts` which provides:
- Bearer token injection via request interceptor
- Automatic token refresh on 401 with request queue
- Global redirect to login on failed refresh
- Global redirect to /unauthorized on 403

## Security

- JWT stored in memory (Zustand store), not localStorage
- httpOnly cookies for refresh tokens (backend responsibility)
- Credentials sent with every request (`withCredentials: true`)
- No sensitive data in client-side storage

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type check + production build |
| `npm run preview` | Preview production build |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Run ESLint |
