# HealthBot / HealthAction — How to Run

HealthBot is an AI health information assistant covering symptoms, vaccination
reference schedules, and maternal/child health. It is **not** a medical service.

Read [project_overview.md](project_overview.md) for the architecture, and the in-app
Privacy / Terms / Disclaimer pages for the safety rules.

## 1. Prerequisites

**Node.js 20.19 or newer** (Node 22 LTS or 24 recommended).

Node 18 does **not** work: Vitest 4 requires `^20.19.0 || >=22.12.0`, and the app's
`engines` field in `package.json` enforces the same minimum. Check with `node -v`
before installing.

## 2. Environment variables

The app has two environments, and the Gemini key belongs to the server only.

**Frontend** — create `.env` in the project root (see `.env.example`):

```
VITE_API_URL=http://localhost:3001
```

Only `VITE_*` values are compiled into the browser bundle, so **never** put a key in
one. The old `VITE_GEMINI_API_KEY` and `VITE_SUPABASE_*` variables are no longer used;
if you have them set, delete them.

**Server** — create `server/.env` (see `server/.env.example`):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=...
DB_NAME=healthbot

PORT=3001
GEMINI_API_KEY=...
PATIENT_JWT_SECRET=<32+ random characters>
ADMIN_KEY=<optional, for /admin>
NODE_ENV=production   # on a deployed server
```

`PATIENT_JWT_SECRET` is required in production: the server refuses to start without a
32+ character secret rather than fall back to a guessable default.

## 3. Install and run

```bash
npm install
npm run dev        # frontend on http://localhost:8080
npm run dev:server # API on http://localhost:3001 (separate terminal)
```

Build and serve the production bundle through the Express server:

```bash
npm run build
npm start
```

## 4. Checks

```bash
npm test           # Vitest, including the emergency-detection suite
npm run lint
npx tsc -p tsconfig.app.json --noEmit
```

## 5. Safety rules this codebase depends on

- **Emergency numbers are a fixed UI element** on the chat screen (`EmergencyBar`), not
  something that appears only when a keyword matches.
- **Emergency detection** (`src/lib/emergency.ts`) runs client-side and again on the
  server. When it fires, a fixed reply is returned and the model is not called.
- **Vaccination schedules are static data** (`src/lib/vaccinationSchedules.ts`), never
  model output. A clinician should still review that file before launch.
- **Fallback replies are fixed text** and contain no doses or diagnoses.
- Chat and vaccination data are scoped to the caller's session id; `admin` sees all.
