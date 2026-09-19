# ATLAS Platform — Integrated Build

This package contains the unified backend and five patched frontends for
the Central → State → District → Village/Survey → Landowner land
acquisition workflow.

**Everything in "Backend" below has been run and tested against a real
PostgreSQL database in the build environment** — not just written. The
frontend wiring has been patched and code-reviewed but **has not been
run through `npm run dev` and clicked through in a browser** (no GUI
browser in the build sandbox) — see "What to verify first" below.

---

## 1. What's fully done and verified

- **Database schema** (`backend/src/schema.sql`) — applies cleanly to Postgres 16.
- **Seed script** (`backend/src/scripts/seed.js`) — transforms your master CSV,
  fixing the project/state scoping bug (every project now belongs to exactly
  one state), and populates users, projects, parcels, compensation
  installments, and disputes. Tested run: 429 users, 37 projects, 1000
  parcels, 1613 installments, 1830 disputes.
- **Full REST API** — auth (register/login/OTP + approval queue), projects
  (create/list/accept/reject/assign/verify), parcels, disputes, documents,
  complaints, notifications, and the **survey** layer (`/api/survey/*`) for
  your teammate's upcoming frontend.
- **The exact workflow you asked for, proven live over HTTP**: Central
  creates & assigns a project → State sees it + gets notified → State
  accepts → Central notified → State forwards to District → District
  accepts → District verifies → Central notified with a full audit trail.
  Same pattern proven for Survey → District (field visit logged →
  District notified).

## 2. What's patched in the frontends

| App | Status |
|---|---|
| **Login page** | Fully wired — real register/login/OTP calls, redirects each role to its dashboard with a token. |
| **Central Authority** | `AddProposal.jsx` creates real projects via the API. `Projects.jsx` fetches live data. Other pages (Dashboard charts, Funding, Reports, Monitoring, Land Impact) still read local mock data. |
| **State Authority** | `Projects.jsx` fetches live data with working **Accept / Reject** buttons wired to the API. Other pages (Dashboard, ProjectsToDistrict assign UI, Reports) still read local mock data. |
| **Village / Survey** | `AtlasContext.jsx` (the shared state every page reads from) now fetches real parcels from the API on load — this alone surfaces live data across Dashboard, Land Scrutiny, etc. Assign/handover actions in this app are not yet wired to write back to the API. |
| **Landowner Dashboard** | `App.jsx`'s central data-loading effect now calls the real backend (parcels, notifications, complaints, documents, profile) with proper auth headers, replacing its old calls to its own bundled Express server. |

## 3. What's NOT done yet (be honest with your team about this)

- District doesn't have its own standalone app — its actions currently live
  inside the State app's `ProjectsToDistrict.jsx`, which is **not yet wired**
  (still static). Decide whether District gets its own app or stays embedded,
  then wire its accept/verify actions the same way State's were.
- Most secondary pages in every app (Reports, Funding, Monitoring, GIS map
  layers, Documents tabs) still read local mock/JSON data, not the API.
- No file upload handling yet — `/api/documents` stores a `file_url` you
  provide; there's no actual upload endpoint or storage (S3/local disk) behind it.
- No automated tests.
- Survey's own frontend hasn't arrived yet — backend is ready and waiting
  (see `backend/src/routes/survey.js`).

## 4. Setup (fresh machine)

```bash
# 1. Install PostgreSQL 16+, create a database and user
createdb atlas

# 2. Backend
cd backend
cp .env.example .env        # fill in your DB credentials + a real JWT_SECRET
npm install
npm run db:init             # applies schema.sql
mkdir -p data/raw
cp /path/to/fully_synced_master_dataset.csv data/raw/fully_synced_master_dataset.csv
npm run db:seed             # populates the database
npm start                   # runs on :5000

# 3. Each frontend (separate terminal per app)
cd frontends/login-page && npm install && npm run dev        # :5173
cd frontends/central-authority && npm install && npm run dev  # :5174
cd frontends/state-authority && npm install && npm run dev    # :5175
cd frontends/village-survey && npm install && npm run dev     # :5176
cd frontends/landowner-dashboard && npm install && npm run dev # :5177
```

All demo accounts use the password `Passw0rd!`. Sample logins after seeding
(check `backend/src/scripts/seed.js` for how identities are generated):
- Central: `admin.central@atlas.gov.in`
- Bihar State: `bihar.state@atlas.gov.in`
- A district/survey/landowner identity — query the DB:
  `SELECT identity, role FROM users WHERE role = 'district' LIMIT 5;`

## 5. What to verify first (things I could not check without a browser)

1. Run `npm run dev` on the Login page and each dashboard, confirm each
   Vite dev server actually starts on the port `ROLE_DASHBOARD_URL` in
   `frontends/login-page/src/App.jsx` expects. **Update those URLs** if your
   ports differ.
2. Log in as Central, submit a proposal via Add Proposal, confirm it appears
   in `Projects.jsx` and that the target state's account gets notified.
3. Check the browser console on first load of each patched app for CORS
   errors — update `CLIENT_ORIGINS` in `backend/.env` to match whatever
   ports Vite actually assigns.
4. Central and State's `adaptProject()` status-mapping (in `Projects.jsx`)
   is a best-effort translation from the backend's precise workflow statuses
   into the old mock UI's status strings — review whether the mapping reads
   right for your team.

## 6. Adding the Survey teammate's frontend later

1. Have them scaffold a Vite + React app like the others.
2. Copy `frontend-integration/apiClient.js` (also at
   `backend/../frontend-integration/apiClient.js` in the original build) into
   their `src/services/`.
3. Point their login through the same Login page (role = `survey`) — token
   handoff already works, since `survey` is a valid role end to end.
4. Call `api.parcels.list()` (auto-scoped to their assigned parcels via
   `/api/survey/assignments`) and `POST /api/survey/field-visits` to log
   field work. Both are already tested and working.

---

For the fuller written breakdown behind these decisions (the original data
audit, the project/state bug, the status-vocabulary mismatch), refer back to
the conversation that produced this build.
