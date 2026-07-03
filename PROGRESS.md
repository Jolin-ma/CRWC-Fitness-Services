# CRWC Fitness Services — Progress Log

_Last updated: 2026-07-02_

A student fitness booking platform (originally scaffolded from `SRS.md`), built as a full-stack prototype: Fastify + Prisma + PostgreSQL backend, React + Vite + Tailwind CSS v4 frontend.

## How to resume

Nothing is committed to git yet — everything below is in the working tree. Start with `git status` to see the full diff before doing anything destructive.

Three things need to be running locally:

```bash
# 1. Postgres (portable install, no service — must be started manually each session)
npm run db:start        # from repo root
npm run db:status       # check it's up
npm run db:stop         # when done

# 2. API server (Fastify) — port 4000
npm run dev              # from repo root

# 3. Frontend (Vite) — port 5173
cd client && npm run dev
```

Demo logins (all password `password123`): `admin@example.com`, `coach@example.com`, `student@example.com`. Also available as one-click "Demo access" buttons on the login/register pages.

## Backend

- **Stack**: Fastify, Prisma, PostgreSQL, `@fastify/jwt`, bcrypt.
- **Data model** (`prisma/schema.prisma`): `User` (STUDENT/COACH/ADMIN roles, credit balance), `Availability` (coach's recurring weekly hours), `AvailabilityOverride` (per-date exceptions to the weekly pattern — presence of a row means that date no longer follows the template), `Booking` (status: SCHEDULED/RESCHEDULED/COMPLETED/NO_SHOW).
- **Routes**:
  - `/api/auth` — register, login (JWT).
  - `/api/admin` — credit adjustments, coach availability setup, student list, global calendar. Admin-only.
  - `/api/bookings` — coach list, available-slots (student view, respects date overrides), book, resolve (coach/admin), my-availability GET/PUT/DELETE (coach's own weekly pattern or per-date override, with an overbooking guard that rejects turning off an hour that already has a real booking), mine (role-scoped booking list).
- **Cron**: hourly sweep for the 47–48h reminder window (`src/jobs/reminder.js`), emails via Resend if `RESEND_API_KEY` is set, otherwise logs to console.
- **Fixed bugs along the way**:
  - Date-only query strings (`YYYY-MM-DD`) were being parsed via `new Date(str)` → UTC → could silently land on the wrong day of week on a server behind UTC. Fixed with a local-date parser (`parseDateOnly`).
  - `@fastify/jwt` v9 / `node-cron` v3 had known CVEs — upgraded to v10 / v4, `npm audit` is clean.

## Frontend

- **Stack**: React + Vite, Tailwind CSS v4 (theme tokens via `@theme` in `src/index.css`), React Router.
- **Pages**: `/login`, `/register`, `/student`, `/admin`, `/coach` (role-gated via `ProtectedRoute`).
- **Shared shell**: `DashboardLayout` — sidebar + header used by all three dashboards.
- **Booking UI**: `AvailabilityTimeline` (student-facing, read-only, click-to-book) and `AvailabilityEditor` (coach-facing, click-to-toggle hours, weekly pattern vs. specific-date modes, "Reset date" convenience button, discard/save for unsaved edits).
- **Demo access**: one-click login buttons on both login and register pages.

## Design system

Went through a few iterations before landing on the current one:

1. Blue/slate SaaS minimalism → 2. navy-sidebar SaaS dashboard → 3. **current: cool-tone editorial**, using the college's brand colors.

Current palette (`client/src/index.css` `@theme` block):

| Token | Hex | Use |
|---|---|---|
| `--color-brand-green` | `#0B8261` | primary accent — buttons, links, "available"/positive state |
| `--color-brand-green-dark` | `#086B4F` | hover state |
| `--color-brand-ink` | `#3E2B2F` | near-black text/rules/sidebar bg — reads as "ink" |
| `--color-brand-paper` | `#F2F5F3` | page background |
| `--color-brand-red` | `#7A2E2A` | negative state (no-show, errors) — deliberately a muted oxblood, not stock Tailwind red, to stay tonally consistent with the ink |

Typography: **Fraunces** (italic serif, editorial headlines/masthead), **Work Sans** (body), **IBM Plex Mono** (data — timestamps, stat numbers, hour labels).

Visual language: sharp corners (no `rounded-*`), thin ink-toned borders instead of shadows, underline-style form inputs instead of filled boxes, masthead-style page headers with a heavy top rule + small-caps eyebrow label.

Brand name: **CRWC Fitness Services** (renamed from placeholder "Fitness Booking" everywhere — tab title, sidebar, login/register masthead).

## Infrastructure

- **Local Postgres**: no system install — portable binaries live in `.pg/` (gitignored), data dir at `.pg/data`. Database is named `crwc_fitness_services` (renamed from the original `fitness_booking`; connection string in `.env`).
- `.env` is gitignored; `.env.example` is the template (also updated to the new DB name).

## Known gaps / possible next steps

- No commits made yet in this session — everything is uncommitted working-tree changes.
- `RESEND_API_KEY` isn't set, so reminder emails just log to console instead of actually sending.
- No automated tests.
- No deployment/hosting setup — this is all local dev only.
- Register page's role selector only offers Student/Coach (Admin accounts are seed-only, by design).
