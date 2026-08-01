# Deployment

The app is two independently deployed pieces: a static SPA (`frontend/`) and
a Node API (`backend/`), talking to a Neon Postgres database and (optionally)
a Redis cache.

## 1. Database (Neon) — already set up

Neon is already provisioned; `npm run db:push:neon` (from `backend/`)
applies `prisma/init.sql`. Grab the pooled connection string from the Neon
console for `DATABASE_URL` in step 3.

## 2. Cache (Redis) — recommended, optional

`backend/src/utils/cache.ts` caches football-data.org/API-Football responses.
Without `REDIS_URL` it falls back to an in-memory `Map`, which is fine for a
single always-on instance but is wiped on every restart/cold start and isn't
shared across instances — a real problem on free hosting tiers, which sleep
and cold-start constantly.

Recommended free option: [Upstash](https://upstash.com) — create a Redis
database, copy its `rediss://` connection string into `REDIS_URL`.

## 3. Backend API

Env vars needed in production (see `backend/.env.example` for the full list
with descriptions):

| Var | Notes |
|---|---|
| `DATABASE_URL` | From Neon |
| `JWT_SECRET` | Long random string |
| `FOOTBALL_DATA_KEY` | football-data.org token |
| `APIFOOTBALL_KEY` / `APIFOOTBALL_HOST` | RapidAPI |
| `CLIENT_ORIGIN` | Your deployed frontend's exact origin, e.g. `https://football-info.vercel.app` |
| `NODE_ENV` | **Must be `production`.** Turns on `secure` cookies and locks CORS to `CLIENT_ORIGIN` ([server config](backend/src/app.ts)) — without it, auth cookies won't be marked secure and CORS falls back to a dev-only localhost allowlist. |
| `REDIS_URL` | Optional but recommended, see step 2 |

Pick one host:

- **Render** — `backend/render.yaml` is a ready-made
  [Blueprint](https://render.com/docs/blueprint-spec). In the Render
  dashboard: New → Blueprint → select this repo → fill in the secret env
  vars it prompts for.
- **Railway** — New Project → Deploy from GitHub repo → set the root
  directory to `backend`. Railway builds `backend/Dockerfile` automatically;
  set the env vars above in the service's Variables tab.
- **Fly.io** — from `backend/`: `fly launch --no-deploy` (claims an app name,
  edit `fly.toml`'s `app` if it collides), then `fly secrets set
  DATABASE_URL=... JWT_SECRET=... FOOTBALL_DATA_KEY=... APIFOOTBALL_KEY=...
  CLIENT_ORIGIN=... REDIS_URL=...` and `fly deploy`.

All three build `npm run prisma:generate && npm run build` then run
`node dist/server.js`, and expose `GET /health` for health checks.

## 4. Frontend

Set `VITE_API_BASE_URL` to the deployed backend's URL + `/api` (e.g.
`https://football-info-api.onrender.com/api`) as a build-time env var on
whichever host you pick — it's baked into the build, not read at runtime.

- **Vercel** — Import the repo, set **Root Directory** to `frontend` in
  project settings. `frontend/vercel.json` handles the SPA rewrite (all
  paths → `index.html`) so client-side routes don't 404 on refresh.
- **Netlify** — Import the repo; `netlify.toml` at the repo root already
  sets `base = frontend`, the build command, and the SPA redirect (backed up
  by `frontend/public/_redirects`, copied into the build output).

## 5. After deploying

- Update `CLIENT_ORIGIN` on the backend to the real frontend URL (and
  redeploy) once you know it — chicken-and-egg with step 3.
- Update the canonical URLs baked into [index.html](frontend/index.html),
  [robots.txt](frontend/public/robots.txt), and
  [sitemap.xml](frontend/public/sitemap.xml) — they currently point at the
  placeholder `football-info.example.com`.
- Hit `/health` on the deployed backend and confirm the frontend loads data
  end-to-end before considering it live.
