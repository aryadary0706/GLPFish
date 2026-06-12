# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install all dependencies (frontend + backend)
npm run dev          # Start dev servers concurrently (frontend :5173, backend :4000)
npm run dev:fe       # Frontend only (Vite)
npm run dev:be       # Backend only (Express with --watch)
npm run build        # Production build → dist/
npm run lint         # ESLint — strict, fails on any warning (--max-warnings 0)
npm run preview      # Preview production build
```

No test runner is configured.

## Environment Variables

Copy `.env.local` and fill in:

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Frontend | Backend base URL |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public Supabase key |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Elevated DB access — never expose to frontend |
| `JWT_SECRET` | Backend | Token signing |
| `FISH_MODEL_API_URL` | Backend | FastAPI model server URL |
| `PORT` | Backend | Default `4000` |

The AI model runs on an external FastAPI server (Hugging Face Space: `aryarasyad-fish-quality-classification`). Set `FISH_MODEL_API_URL` accordingly or point to a local instance on port 8000.

## Architecture

GLPFish is a full-stack fish quality inspection system. Users create batches, upload eye and gill photos per fish, trigger AI grading, and view results.

```
Frontend (React/Vite :5173)
    ↓ axios + JWT header
Backend (Express :4000)
    ↓ Supabase SDK        ↓ HTTP (multipart images)
  Supabase DB/Storage    FastAPI Model Server
```

### Frontend (`src/`)

- **`App.tsx`** — Route definitions (React Router v6)
- **`context/AuthContext.jsx`** — Global auth state; restores session from `localStorage` on load; emits `unauthorized` event on 401 to redirect to login
- **`lib/api.js`** — Axios instance that injects `Authorization: Bearer {token}` and handles 401 globally
- **`hooks/`** — All API interaction lives here (`useBatches`, `useInspection`, `useHasilGrading`, `useDistribusi`, `useProfiles`, `useRole`)
- **`services/`** — Raw API call functions used by hooks and AuthContext
- **`pages/`** — Route components; `DashboardLayout.tsx` wraps all protected routes

Path alias `@` maps to `src/` (configured in `vite.config.js`).

### Backend (`backend/src/`)

- **`server.js`** — Express entry point; mounts routes under `/api/*`
- **`lib/supabase.js`** — Supabase client (uses service role key)
- **`lib/model.js`** — Calls FastAPI model server with image buffers; returns grade + confidence
- **`middleware/auth.js`** — `requireAuth` middleware: verifies JWT, attaches user to `req.user`
- **`services/PredictAI.js`** — Full prediction pipeline: fetches images from storage → calls model → writes `prediction_results`

### Database Schema (Supabase)

| Table | Key columns |
|---|---|
| `profiles` | `id`, `name`, `role`, `email` |
| `batches` | `id`, `jenis`, `tanggal`, `lokasi`, `status`, `estimasi_jumlah`, `user_id` |
| `fishes` | `id`, `batch_id`, `fish_index`, `status`, `eye_image_id`, `gill_image_id` |
| `images` | `id`, `storage_path`, `mime_type`, `batch_id` |
| `prediction_results` | `fish_id`, `grade` (A/B/C), `confidence`, eye/gill analysis fields |

Batch status lifecycle: `incomplete` → `processing` → `done` / `failed`.

### Key API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/users/me                          (JWT required)
POST   /api/batches                           (JWT required)
GET    /api/batches                           (JWT required)
GET    /api/batches/user/:userId              (JWT required)
GET    /api/batches/:batchId/hasil            (JWT required)
PATCH  /api/batches/:batchId/status           (JWT required)
POST   /api/upload/predict                    (multipart, JWT required)
GET    /api/inspections/:id                   (JWT required)
GET    /api/health
```

### Admin Role Detection

Admin access is checked by role field OR hardcoded emails:

```javascript
isAdmin = user?.role === 'admin' ||
          user?.email === 'admin@glpfish.com' ||
          user?.email === 'admin123@gmail.com'
```

## Styling

Tailwind CSS v3 with `darkMode: 'selector'`. Custom brand colors defined in `tailwind.config.js`:
- Primary: `#FB7D00` (orange)
- Secondary: `#FFEE1D` (yellow)
- Success: `#0DF26D` (green)
