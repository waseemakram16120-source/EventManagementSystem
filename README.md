# EventFlow — Event Management System

A complete, full-stack event management platform. Discover events, RSVP in one click, and create and manage your own events with real-time capacity tracking.

> **Live demo:** _coming soon — deploy link will be added here after the Vercel deployment._

## What it does

- **Browse events** — search, filter by category, sort by date, popularity or price, and paginate through results.
- **Featured events** — hand-picked upcoming events on the home page, plus a browse-by-category strip.
- **RSVP flow** — RSVP / cancel RSVP with duplicate and capacity checks, live attendee counts and a capacity bar.
- **Organizer tools** — create, edit and delete your own events (owner-only), with a dashboard showing your events, upcoming count and total attendees.
- **Auth** — JWT-based register / login, protected routes, and a demo account so anyone can try it instantly.
- **Demo mode** — the API runs fully without a database: if no MongoDB is configured it serves the same API from an in-memory store seeded with 8 realistic events. Plug in a real `MONGODB_URI` and it switches to MongoDB automatically.

## Tech stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 18, Vite 5, React Router 6, Axios |
| Backend  | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB (optional — in-memory demo mode otherwise) |
| Auth     | JSON Web Tokens (7-day expiry), bcryptjs |
| Security | Helmet, CORS allow-list, rate limiting, express-validator |
| Deploy   | Vercel (frontend static + serverless API) |

## Features

- JWT auth (register, login, `/me`) with 7-day tokens
- Full event CRUD with owner-only edit/delete
- RSVP + cancel RSVP (duplicate & full-capacity guards)
- Filter / search / sort / pagination, featured events, organizer stats
- Request validation on every write endpoint — 400s with field errors, never 500s
- Invalid ids return 400; unknown routes return JSON 404
- Helmet headers, restricted CORS, rate limits (100/15 min auth, 300/15 min API)
- Image URL per event with a category default when left blank

## Project structure

```
EventFlow/
├── api/
│   └── index.js            # Vercel serverless entry (exports the Express app)
├── backend/
│   ├── config/db.js        # Mongo connect — never crashes; falls back to demo mode
│   ├── lib/
│   │   ├── data.js         # Data layer: Mongo or in-memory store, same API
│   │   ├── store.js        # In-memory demo store
│   │   └── seedData.js     # 8 seeded events + demo user
│   ├── middleware/         # auth (JWT), validate, errorHandler
│   ├── models/             # User, Event (Mongoose)
│   ├── routes/             # auth, events
│   ├── seed.js             # Seed a real MongoDB
│   ├── server.js           # Express app (exports app; listens only when run directly)
│   └── test-db.js          # API health-check script
├── frontend/
│   ├── public/favicon.svg
│   └── src/
│       ├── lib/api.js          # Axios instance (VITE_API_URL or relative /api)
│       ├── lib/eventImages.js  # Default cover image per category
│       ├── context/AuthContext.jsx
│       ├── components/         # EventCard, Navbar, Footer, Toast
│       └── pages/              # Home, Events, EventDetail, Create/Edit, Dashboard, Login, Register, NotFound
├── vercel.json
└── package.json            # Root scripts (dev runs backend + frontend)
```

## Local setup

```bash
git clone https://github.com/waseemakram16120-source/EventManagementSystem.git
cd EventManagementSystem

# Backend
cd backend
cp .env.example .env   # MONGODB_URI optional — leave empty for demo mode
npm install
npm run seed           # only if you set a real MONGODB_URI
npm run dev            # http://localhost:5000

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev            # http://localhost:3000
```

Or run both at once from the repo root:

```bash
npm install   # installs concurrently for the dev script
npm run dev
```

### Demo login

| Email | Password |
| ----- | -------- |
| `demo@eventflow.pk` | `Demo1234` |

The demo account organizes all 8 seeded events. You can also register a fresh account — no email verification needed.

## Environment variables

| Variable | Where | Required | Description |
| -------- | ----- | -------- | ----------- |
| `PORT` | backend | No (default `5000`) | API port |
| `MONGODB_URI` | backend | No | MongoDB connection string. Empty/unreachable → demo mode |
| `JWT_SECRET` | backend | No (dev fallback) | Secret for signing JWTs — set a long random value in production |
| `CLIENT_URL` | backend | No (default `http://localhost:3000`) | Comma-separated allowed CORS origins |
| `VITE_API_URL` | frontend | No | API base URL. Leave empty for relative `/api` (Vite proxy / Vercel rewrites) |

## API endpoints

Base: `/api`

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/health` | — | Health check (`{ status, mode: mongo\|demo }`) |
| POST | `/auth/register` | — | Register (name, email, password ≥ 6) |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/auth/me` | ✅ | Current user + events attending |
| GET | `/events` | — | List — `category, search, status, sort=newest\|popular\|price-low\|price-high\|date, page, limit` → `{ events, totalPages, currentPage, total }` |
| GET | `/events/featured` | — | Featured upcoming events (max 6) |
| GET | `/events/stats` | ✅ | Organizer stats |
| GET | `/events/my-events` | ✅ | Events created by the logged-in user |
| GET | `/events/:id` | — | Single event |
| POST | `/events` | ✅ | Create event |
| PUT | `/events/:id` | ✅ owner | Update event (capacity can't drop below attendees) |
| DELETE | `/events/:id` | ✅ owner | Delete event |
| POST | `/events/:id/rsvp` | ✅ | RSVP |
| POST | `/events/:id/cancel-rsvp` | ✅ | Cancel RSVP |

## Deployment (Vercel)

1. Import the repo in the [Vercel dashboard](https://vercel.com/new).
2. Vercel picks up `vercel.json` automatically: builds `frontend/` with Vite and serves the API from `api/index.js` (`/api/*` rewrites).
3. No environment variables are required — the app runs in demo mode out of the box.
4. For a real database, set in Vercel → Project Settings → Environment Variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long random secret
   - `VITE_API_URL` — leave empty (relative `/api` works via rewrites)
5. Optional: run `npm run seed` locally against the same `MONGODB_URI` to load the demo events and demo account into Atlas.

## Author

**Muhammad Waseem Akram** — Computer Science student, COMSATS University Vehari, Pakistan.
