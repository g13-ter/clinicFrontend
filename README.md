# School Clinic Management — Frontend

The staff-facing web app for the School Clinic Management System: a landing
page, login, and role-aware dashboard for admins, doctors, nurses, and staff
to manage patients, visits, appointments, medicines, purchase requests,
reports, and audit logs.

Built with React 19, TypeScript, Vite, React Router, and Tailwind CSS.

---

## Live Deployment

- **Frontend (Vercel):** https://clinic-frontend-git-nursedashboard-scms2.vercel.app/login
- **Backend (Render):** https://clinicbackend-1-slng.onrender.com

This is a Vercel **branch preview** deployment (note the `-git-nursedashboard-`
in the URL). It will change once this branch is merged to production, and
any new branch gets its own preview URL. The backend's `CLIENT_ORIGIN` env
var must include whichever frontend URL you're testing from, or login will
fail with a `403 Request origin is not allowed`.

All API calls are relative (`/api/...`) and go through the rewrite in
`vercel.json`, which forwards them server-side to the Render backend above.
From the browser's point of view this makes every request same-origin —
no CORS, and cookies stay scoped correctly to the Vercel domain. See
`vercel.json` below.

---

## Tech stack

- **React 19 + TypeScript** — UI
- **Vite** — dev server & build tool
- **React Router 7** — client-side routing, role-gated via `ProtectedRoute`
- **Tailwind CSS 4** — styling
- **Vitest + jsdom** — unit/component testing
- **ESLint + typescript-eslint** — linting

---

## Run locally

### Prerequisites

- Node.js 22 or newer
- npm
- The backend configured and connected to MongoDB; follow
  [the backend setup guide](../backend/README.md#run-locally) first

### 1. Install dependencies

From the `frontend` directory:

```bash
npm ci
```

Use `npm install` instead when you intentionally want to update dependencies or
the lockfile.

### 2. Start the backend

In one terminal, from `backend/`:

```bash
npm run dev
```

Wait until <http://localhost:5000/api/health/ready> reports that the database is
connected. The frontend cannot log in or load clinic data without the API.

### 3. Start the frontend

In a second terminal, from `frontend/`:

```bash
npm run dev
```

Open <http://localhost:5173>. Sign in using the account created with the
backend's `npm run seed-admin` command. The default local credentials are
`admin@clinic.com` / `admin123` unless they were changed in `backend/.env`.

No frontend environment file is needed for local development. All browser
requests use `/api`, and Vite proxies that path to
`http://127.0.0.1:5000` as configured in `vite.config.ts`.

### Start both apps with one command

After installing dependencies in both directories and configuring
`backend/.env`, you can start the complete system from the repository root:

```bash
npm run dev
```

The root script starts the backend, waits for its readiness endpoint, and then
starts Vite. Press `Ctrl+C` to stop both processes.

### Production preview

```bash
npm run build
npm run preview
```

This serves the optimized frontend assets for a UI check. Vite's preview
server does not proxy `/api`; a fully working production-style preview also
needs a reverse proxy configured like the deployment described below.

### Common local problems

- **Vite shows a proxy/network error:** make sure the backend is running on
  port `5000` and its readiness endpoint returns `200`.
- **Login fails:** seed an administrator, verify the credentials, and check the
  backend terminal for errors.
- **Port 5173 is already in use:** stop the other Vite process. If Vite selects
  a different port, add that exact origin to `CLIENT_ORIGIN` in `backend/.env`
  and restart the backend.
- **API runs on another port:** update the `/api` proxy target in
  `vite.config.ts` to match it.

## Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Starts the Vite dev server with HMR |
| `npm run build` | Type-checks (`tsc -b`) then builds for production (`dist/`) |
| `npm run preview` | Serves the production build locally |
| `npm test` | Runs the Vitest suite once |
| `npm run test:watch` | Runs Vitest in watch mode |
| `npm run lint` | Runs ESLint |
| `npm run check` | Lint (zero warnings) + tests + build — run before pushing |

---

## Roles & access

Every route is gated by role through `ProtectedRoute` and the
`ROUTE_ACCESS` map in `src/config/permissions.ts`, mirroring the backend's
RBAC model:

| Role | Can access |
|---|---|
| `superadmin` | Dashboard, Users, Role Permissions, Audit Log, Settings, Profile |
| `admin` | Dashboard, Students, Appointments, Purchase Requests, Users, Reports, Audit Log, Settings |
| `doctor` | Dashboard, Clinical Care, Students, Student Queue, Appointments, Inventory |
| `nurse` | Dashboard, Clinical Care, Students, Student Queue, Appointments, Inventory, Purchase Requests, Reports |
| `staff` | Dashboard, Students, Student Queue, Appointments |

`/` (landing page) and `/login` are public. Everything else redirects to
`/login` if there's no valid session, or to `/dashboard` if the logged-in
user's role isn't allowed on that route.

---

## Project structure

```
src/
  App.tsx              route table — public routes + role-gated routes via ProtectedRoute
  main.tsx             app entry point
  pages/                one component per route (lazy-loaded except Login)
  layout/
    Layout.tsx          shared shell: nav, header, role-aware menu (NAV_ITEMS)
  components/
    ProtectedRoute.tsx  redirects based on session + role
    Modal.tsx, ConfirmDialog.tsx, Toast.tsx, FieldError.tsx, icons.tsx
    AdminSectionTabs.tsx, DoctorWorkspaceTabs.tsx
    ErrorBoundary.tsx   catches render errors app-wide
  features/
    clinical/           clinical workspace data/model logic
    dashboard/           dashboard data-fetching hook
    patients/            patient medical history, visits, printable summary
  hooks/
    useAuth.ts, useFormErrors.ts, useToast.ts
    useSessionExpiryWarning.ts   warns before the session cookie expires
  services/
    api.ts              thin fetch wrapper, all calls relative to "/api"
  utils/
    auth.ts             session restore/save/clear (cookie-based, not JWT-in-storage)
    dashboardAlerts.ts, date.ts, download.ts, types.ts
  config/
    permissions.ts       roles, route access map, nav items, capability checks
```

---

## Authentication model

Login is cookie-based, not token-in-localStorage:

- `POST /api/auth/login` sets an `HttpOnly` session cookie — the frontend
  never sees or stores the raw token.
- `sessionStorage` holds only a small non-sensitive cache (`id`, `role`,
  expiry) used to render the UI instantly without waiting on a network
  round-trip; it is **not** the source of truth for access control.
- On load, `restoreCurrentSession()` (`src/utils/auth.ts`) calls
  `GET /api/auth/session` to ask the server whether the cookie is still
  valid, and reconciles local state accordingly.
- `useSessionExpiryWarning` proactively warns the user before the cookie
  expires so they aren't surprised by a sudden logout mid-task.
- Every real request still relies on the server validating the `HttpOnly`
  cookie and the user's live role/permissions — the client-side role check
  only controls navigation and what's rendered, never actual authorization.

---

## `vercel.json`

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://clinicbackend-1-slng.onrender.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Must live at the **project root** (not under `src/`) — Vercel only reads it
from there. The first rule proxies API calls to the Render backend; the
second serves `index.html` for any other path so client-side routing
survives a hard refresh or a direct link.

---

## Testing

```bash
npm test
```

Vitest + jsdom. Current coverage includes `permissions.ts` (role/route
access logic), `auth.ts` (session restore/save/clear), `api.ts` (request
wrapper), `download.ts`, and the clinical workspace and dashboard data
models/hooks.

---

## Deployment notes (Vercel)

- Set project root's `vercel.json` as shown above, pointing at your actual
  Render backend URL.
- No environment variables are required for the current build — the app
  talks to the backend exclusively through the relative `/api` path and
  the Vercel rewrite, so there's nothing else to configure per-environment.
- On the **backend** side (Render), make sure `CLIENT_ORIGIN` includes this
  app's exact deployed origin (production domain, and any preview URLs
  you're actively testing), or requests will be rejected with a CORS
  `403 Request origin is not allowed`.
