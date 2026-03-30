# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Heatmap da Rede** is a full-stack telecom network management SPA for Conectnet Telecom. It provides interactive visualization of OLT/ONU signal levels, customer management, and network topology heatmaps. Deployed on Linux with Nginx reverse proxy.

## Development Commands

### Backend (Node.js + Express, port 5005)
```bash
cd backend
npm install
npm run dev        # Development with nodemon
```

### Frontend (Vue 3 + Vite, port 5000)
```bash
cd frontend
npm install
npm run dev        # Dev server with hot-reload
npm run build      # Production build
npm run preview    # Preview production build
```

### Docker (recommended for full-stack)
```bash
docker-compose up  # Starts both backend and frontend
```

There are no automated tests configured in this project.

## Architecture

### Backend (MVC, `backend/src/`)
- **`server.js`** — Entry point. Starts HTTP server and 3 background cron loops: ONU signal fetching, Tomodat data sync, cleanup jobs.
- **`src/app.js`** — Express setup, MongoDB connection, registers all routes from `routes/index.js`.
- **`routes/index.js`** — Aggregates all 28 route modules organized by domain (users, OLT, ONU, PDFs, PPPoE, backups, etc.).
- **`controllers/`** — Business logic. Largest: `oltController.js` (OLT/ONU SSH management), `fiberhomeController.js` (Fiberhome protocol), `fetchController.js` (ETL from external APIs).
- **`models/`** — Mongoose schemas for MongoDB.
- **`scripts/`** — Background jobs using `node-cron`: `uploadSignals.js`, `updateFetch.js`, `deleteReservados.js`.
- **`middleware/`** — JWT auth (`auth.js`), file upload, IP injection, request monitoring.

### Frontend (Vue 3 SPA, `frontend/src/`)
- **`router/index.js`** — Vue Router with auth/role guards. Routes check localStorage for token and user role metadata.
- **`stores/`** — Pinia state: auth, notifications, heatmap data, OLT list, dashboard.
- **`api/`** — Axios instances for backend communication, organized by domain.
- **`views/`** — Page-level components: `HeatMapView`, `DashboardView`, `ComercialView`, `ViabilidadeView`, `AuditoriaView`, `LoginView`.
- **`components/`** — Feature-organized reusable components (HeatMap, Dashboard, Dialogs, Modals).
- **`directives/`** — Custom `v-role` directive for template-level role-based rendering.

### Authentication & Authorization
- JWT issued on login, stored in localStorage.
- Backend verifies via `middleware/auth.js` (`verifyToken`).
- Frontend router guards check token + role; `v-role` directive controls element visibility.
- Roles: `admin`, `technician`, `sales`, `guest`.

### Databases
- **MongoDB** — Primary database. Connection string via `MONGO_DB_ACCESS` env var.
- **PostgreSQL** — Legacy Tomodat data via Knex.js (`knexfile.js`). Connection configured separately.

### Key External Integrations
- **OLTs** — SSH and TL1 connections via `ssh2` library and tcp raw sockets. Vendors: (parks, Fiberhome).
- **Mk solutions** — REST API integration (`mkOsController.js`) with old erp Mk solutions.
- **Hubsoft** — Current erp rest API integration.
- **Tomodat** — original cto data is fetched from tomodat API.

## Environment Variables
The backend uses `dotenv`. Required variables:
- `MONGO_DB_ACCESS` — MongoDB connection string
- `TOKEN_KEY` — JWT signing secret

No `.env` file is committed; configure locally or via Docker environment.
