# CRWC Fitness Services — Progress Log

_Last updated: 2026-07-03_

A fitness booking + coaching platform (originally scaffolded from `SRS.md`), built as a full-stack prototype: Fastify + Prisma + PostgreSQL backend, React + Vite + Tailwind CSS v4 frontend.

**UI terminology note**: internally the STUDENT/COACH roles are unchanged (DB, routes, `role` enum), but the UI displays them as **Client** and **Personal Trainer** everywhere (sidebar, demo login buttons, page headers). Keep this in mind when grepping — "coach" and "student" in code map to "Personal Trainer" and "Client" on screen.

## How to resume

Committed and pushed — repo is at https://github.com/Jolin-ma/CRWC-Fitness-Services (branch `main`, first commit `923696e`). Run `git status` / `git log` to see where things stand if more work has happened since this was written.

Three things need to be running locally:

```bash
# 1. Postgres (portable install, no service — must be started manually each session)
npm run db:start        # from repo root
npm run db:status       # check it's up
npm run db:stop         # when done

# 2. API server (Fastify) — port 4000
npm run dev              # from repo root

# 3. Frontend (Vite) — port 5173 (falls back to 5174 if 5173 is taken by a stale process)
cd client && npm run dev
```

Demo logins (all password `password123`): `admin@example.com` (Brianna), `coach@example.com` (Allie), `student@example.com` (Sam). Also available as one-click "Demo access" buttons on the login/register pages. Four more personal trainers exist with no demo-login button: `owen@`, `carter@`, `michelle@`, `ojasvi@example.com`.

**Gotcha**: `node --watch` locks the Prisma query engine `.dll`. If `npx prisma generate` fails with `EPERM`, kill whatever's listening on port 4000 first (`netstat -ano | findstr :4000` on Windows) before regenerating.

## Backend

- **Stack**: Fastify, Prisma, PostgreSQL, `@fastify/jwt`, bcrypt.
- **Data model** (`prisma/schema.prisma`):
  - `User` — STUDENT/COACH/ADMIN roles, credit balance, `startDate` (client's program start date, admin-editable, defaults to signup date).
  - `Availability` / `AvailabilityOverride` — coach's recurring weekly hours and per-date exceptions. `Availability` has a `@@unique([coachId, dayOfWeek, startTime, endTime])` constraint (added after a bug where re-seeding created duplicate windows and students saw the same schedule rendered 2-3x — see "Fixed bugs" below).
  - `Booking` — status: SCHEDULED/RESCHEDULED/COMPLETED/NO_SHOW.
  - `BodyStat` — weight log entries (client or trainer can log).
  - `Goal` — WEIGHT (auto-tracked against `BodyStat`, snapshots `startingWeight` at creation) or FREEFORM (title + target date + manual complete toggle).
  - `WorkoutEntry` — exercise/sets/reps/weight(optional), freeform date (not tied to a booking).
  - `NutritionEntry` — food/calories/protein/carbs/fat(optional)/`mealType` (BREAKFAST/LUNCH/DINNER/SNACK, defaults to SNACK).
  - `WaterEntry` — ounces, freeform date.
  - All the fitness-tracking models (`BodyStat`, `Goal`, `WorkoutEntry`, `NutritionEntry`, `WaterEntry`) follow the same permission shape: a STUDENT logs their own, a COACH logs on behalf of any client via `studentId` in the body, ADMIN is blocked (403).
- **Routes**:
  - `/api/auth` — register, login (JWT). Register auto-sets `startDate` for new STUDENT accounts.
  - `/api/admin` — credit adjustments, coach availability setup, student list (+ `startDate`), student booking history (`/students/:id/bookings`, powers the admin client-history page), **cycles** (`/cycles`, `/cycles/:label/clients` — dynamically groups clients into Sept 1–Aug 31 seasons like "2025-26" based on booking dates, no manual tagging).
  - `/api/bookings` — coach list, available-slots, book, resolve, my-availability GET/PUT (coach's own weekly pattern or per-date override), mine.
  - `/api/body-stats`, `/api/goals`, `/api/workouts`, `/api/nutrition`, `/api/water` — the fitness-tracking CRUD, described above.
- **Cron**: hourly sweep for the 47–48h reminder window (`src/jobs/reminder.js`), emails via Resend if `RESEND_API_KEY` is set, otherwise logs to console (`RESEND_API_KEY` is currently **not set** — reminders are stub-logged only).
- **Fixed bugs along the way**:
  - Date-only query strings (`YYYY-MM-DD`) were being parsed via `new Date(str)` → UTC → could silently land on the wrong day of week on a server behind UTC. Fixed with a local-date parser (`parseDateOnly`).
  - `@fastify/jwt` v9 / `node-cron` v3 had known CVEs — upgraded to v10 / v4, `npm audit` is clean.
  - `Availability` had no uniqueness constraint, so re-running `prisma/seed.js` (which happened multiple times while iterating on trainer names) silently inserted duplicate rows via a no-op `skipDuplicates`. Deduped the data, added `@@unique([coachId, dayOfWeek, startTime, endTime])`, and confirmed reseeding is now idempotent.

## Frontend

- **Stack**: React + Vite, Tailwind CSS v4 (theme tokens via `@theme` in `src/index.css`), React Router.
- **Pages & routes** (role-gated via `ProtectedRoute`):
  - `/login`, `/register`
  - **Client**: `/student` (book a session), `/student/progress` (streak, session milestones capped at 20, member-since, trainer notes — service-usage tracking only), `/student/body-goals` (weight log + chart + weight/freeform goals), `/student/workouts` (exercise/sets/reps/weight log), `/student/nutrition` (meals grouped by type with a live calorie total, macros, water intake)
  - **Personal Trainer**: `/coach` — schedule, availability editor, and quick-log rows on each upcoming session for client weight, a freeform goal, a workout set, and a meal (mirrors what the client can self-log)
  - **Admin**: `/admin` (client balances incl. editable start date), `/admin/clients/:id` (a client's full session history), `/admin/cycles`, `/admin/cycles/:label` (season folders)
- **Shared shell**: `DashboardLayout` — sidebar (now a real multi-item nav per role, was a single static label originally) + header, used by all dashboards. Sidebar active-state uses longest-prefix-match so a sub-page like `/student/progress` doesn't also highlight a parent nav item like `/student`.
- **Booking UI**: `AvailabilityTimeline` (client-facing, read-only, click-to-book) and `AvailabilityEditor` (trainer-facing, click-to-toggle hours, weekly pattern vs. specific-date modes). Trainer-editable hour range is 9am–9pm (`AVAILABILITY_START_HOUR`/`END_HOUR` in `src/routes/bookings.js`); the client's booking timeline reflects whatever a trainer actually turns on within that range, not a hardcoded range of its own.
- **Charting**: `WeightChart` — hand-rolled SVG line chart (no external chart lib), built following the `dataviz` skill (single brand-green hue, validated for contrast, hover crosshair + tooltip, endpoint value label, table fallback underneath for accessibility).
- **Demo access**: one-click login buttons on both login and register pages, labeled Client/Personal Trainer/Admin.

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

Visual language: sharp corners (no `rounded-*`), thin ink-toned borders instead of shadows, underline-style form inputs instead of filled boxes, masthead-style page headers with a heavy top rule + small-caps eyebrow label. Light mode only — no dark theme support exists.

Brand name: **CRWC Fitness Services** (renamed from placeholder "Fitness Booking" everywhere — tab title, sidebar, login/register masthead).

## Infrastructure

- **Local Postgres**: no system install — portable binaries live in `.pg/` (gitignored), data dir at `.pg/data`. Database is named `crwc_fitness_services`; connection string in `.env`.
- `.env` is gitignored; `.env.example` is the template.
- **Git**: initialized and pushed this session — first commit `923696e` on `main`, remote `origin` → `https://github.com/Jolin-ma/CRWC-Fitness-Services`.

## Known gaps / possible next steps

- `RESEND_API_KEY` isn't set, so reminder emails just log to console instead of actually sending.
- No automated tests.
- No deployment/hosting setup — this is all local dev only.
- Register page's role selector only offers Student/Coach (Admin accounts are seed-only, by design).
- The trainer's dashboard quick-log rows (weight/goal/workout/meal, one per upcoming session card) are getting crowded — five stacked rows per booking. Fine for now, but worth revisiting as a cleaner "quick log" widget if more trackables get added.
- Nutrition/workout/body-stat/goal logging is all self-reported, freeform text (e.g. exercise names, food names) — no canonical exercise or food database, so there's no autocomplete or duplicate-detection.
