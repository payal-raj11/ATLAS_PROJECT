# ATLAS Backend

Express API for the ATLAS Landowner Dashboard. Stores data in a JSON file
(`data/db.json`) — no database server to install. Swap `src/db.js` for a real
database later without touching the routes.

## Setup

```bash
npm install
cp .env.example .env
npm run dev        # nodemon, restarts on file changes
# or
npm start          # plain node
```

Server listens on `http://localhost:4000` by default (`PORT` in `.env`).
`CORS_ORIGIN` should match wherever your frontend runs (`http://localhost:5173` for `npm run dev` in the dashboard).

Demo login: **Landowner ID** `LO-UP-2026-04821`, **passcode** `demo1234` (see `data/db.json`).

## API reference

All routes are under `/api`. Every route except `/auth/login` requires
`Authorization: Bearer <token>`.

| Method | Path                          | Description                                   |
|--------|-------------------------------|------------------------------------------------|
| POST   | `/auth/login`                 | `{ landownerId, passcode }` → `{ token, landowner }` |
| GET    | `/me`                         | Current landowner's profile                    |
| PATCH  | `/me`                         | `{ phone?, email? }` → updated profile         |
| GET    | `/parcels`                    | All parcels for the current landowner          |
| GET    | `/parcels/:id`                | A single parcel                                |
| GET    | `/notifications`              | All notifications, newest first                |
| PATCH  | `/notifications/:id/read`     | Mark one notification read                     |
| PATCH  | `/notifications/read-all`     | Mark all notifications read                    |
| GET    | `/complaints`                 | All complaints, newest first                   |
| POST   | `/complaints`                 | `{ parcelId, category, subject, description, priority }` → created complaint |
| GET    | `/documents`                  | All documents                                  |
| GET    | `/health`                     | `{ ok: true }` — no auth required              |

## Notes on the JSON "database"

`data/db.json` is read and rewritten on every write operation (filing a
complaint, marking a notification read, editing a profile). This is fine for
a demo or small internal tool, but it isn't safe for concurrent writes at
scale — for production, replace `src/db.js` with a real database client
(Postgres via `pg`/Prisma, MongoDB via `mongoose`, etc.) while keeping the
same `getDB()`/route function signatures so the rest of the app is
unaffected.

## Security notes before going further than a demo

- Passcodes are stored in plaintext in `data/db.json` — replace with hashed
  passwords (`bcrypt`) before this touches real landowner data.
- `JWT_SECRET` in `.env.example` is a placeholder — generate a long random
  value for any real deployment and never commit `.env`.
- Add rate limiting on `/auth/login` (e.g. `express-rate-limit`) to slow down
  brute-force attempts.
