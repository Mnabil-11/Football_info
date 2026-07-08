# Football Stats Tracker ⚽

A full-stack football tracker. Browse competitions and their **matches**,
**standings**, and **top scorers**, and — once signed in — save favorite teams and
view a favorites-only dashboard.

Football data comes from [football-data.org](https://www.football-data.org/), which
does not allow browser (CORS) requests, so **all data is fetched through the backend
proxy** (`/api/football/*`). This also keeps the data-API key server-side.

The UI is Arabic + RTL by default (`<html lang="ar" dir="rtl">`).

## Tech Stack

| Layer     | Stack                                                              |
| --------- | ----------------------------------------------------------------- |
| Frontend  | Vite, React 18, TypeScript (strict), Tailwind CSS, Axios           |
| Backend   | Node.js, Express, TypeScript, JWT, bcryptjs, Zod                   |
| Database  | PostgreSQL (Neon) via Prisma ORM + Neon serverless adapter         |
| Data API  | [football-data.org](https://www.football-data.org/) v4 (via proxy) |

## Monorepo Structure

```
Football_info/
├── frontend/            # Vite + React app
│   └── src/
│       ├── api/         # http (backend client), footballApi, authApi, favoritesApi
│       ├── components/  # CompetitionSelect, MatchesList, StandingsTable, TopScorers, ...
│       ├── context/     # AuthContext, FavoritesContext
│       ├── pages/       # Profile
│       ├── utils/       # date formatting
│       └── types/       # football.ts, auth.ts
├── backend/             # Express + JWT API + football-data.org proxy
│   ├── prisma/          # schema.prisma, init.sql
│   └── src/
│       ├── config/      # env validation, prisma (Neon adapter), dbUrl
│       ├── controllers/ # auth, favorites, football
│       ├── middleware/  # auth guard, error handler
│       ├── routes/      # auth, favorites, football, index
│       ├── services/    # auth, favorites, footballData
│       └── utils/       # jwt, password, ApiError, cache
├── docs/                # diagrams.md (Mermaid: use-case, class, ERD)
└── README.md
```

## Getting Started

### 1. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_BASE_URL only — no data-API key here
npm run dev               # http://localhost:5173
```

Required env (`frontend/.env`):

- `VITE_API_BASE_URL` — backend URL, e.g. `http://localhost:4000/api`

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # then set DATABASE_URL + JWT_SECRET
npm run prisma:generate   # generate the Prisma client
npm run db:push:neon      # create tables in the `football` schema (see note)
npm run dev               # http://localhost:4000
```

Required env (`backend/.env`): `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`FOOTBALL_DATA_KEY`, `PORT`, `CLIENT_ORIGIN`.

#### Database notes (Neon)

- **Neon serverless driver.** The backend connects to Postgres through
  `@prisma/adapter-neon` over HTTPS/WebSocket (port 443) instead of raw TCP 5432.
  This is required on networks that can't reach Neon over IPv6, and works with
  Neon's connection pooler.
- **Dedicated schema.** All tables live in a `football` schema (Prisma
  `multiSchema`), so they never collide with other apps sharing the database.
  The `DATABASE_URL` therefore ends with `&schema=football`.
- **Creating tables.** `npm run db:push:neon` applies
  [`prisma/init.sql`](backend/prisma/init.sql) via the Neon driver. Alternatively,
  paste `init.sql` into the Neon Console → SQL Editor. (`prisma migrate`/`db push`
  won't work on IPv6-less networks because they use TCP 5432.)

## API Endpoints (Backend)

| Method | Path                       | Auth | Description               |
| ------ | -------------------------- | ---- | ------------------------- |
| POST   | `/api/auth/register`       | —    | Create account, get token |
| POST   | `/api/auth/login`          | —    | Login, get token          |
| GET    | `/api/auth/me`             | ✅   | Current user              |
| POST   | `/api/auth/logout`         | ✅   | Logout (client drops JWT) |
| GET    | `/api/favorites/teams`     | ✅   | List favorite teams       |
| POST   | `/api/favorites/teams`     | ✅   | Add favorite team         |
| DELETE | `/api/favorites/teams/:id` | ✅   | Remove favorite team      |
| GET    | `/api/football/competitions`                 | — | List competitions        |
| GET    | `/api/football/competitions/:code/standings` | — | League table             |
| GET    | `/api/football/competitions/:code/scorers`   | — | Top scorers              |
| GET    | `/api/football/competitions/:code/matches`   | — | Competition matches      |
| GET    | `/api/football/teams/:id/matches`            | — | A team's matches         |

The `/api/football/*` routes proxy football-data.org server-side (key stays on the
server) and cache responses briefly to respect the free-tier rate limit (~10 req/min).

## Security Note

The football-data.org key lives **only** in `backend/.env` and is never sent to the
browser — the frontend calls the backend proxy instead. Remember to set a strong
`JWT_SECRET` before any real deployment.
