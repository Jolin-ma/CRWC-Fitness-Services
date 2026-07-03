# Software Requirement Specification (SRS) & Architecture Blueprint
## Project: Student Fitness Booking & Progress Management Platform (Web Prototype)

This document outlines the architectural blueprint, feature set, user workflows, and relational database schema for a student-focused fitness booking and tracking web prototype.

---

## 1. Project Overview & Scope

The objective is to build a high-efficiency web prototype that automates the booking flow between students, coaches, and administrators while ensuring strict verification of remaining prepaid session balances.

### Core Mechanics
1. **Prepaid Session Enforcement:** Students buy session packages (1, 3, 6, 10, or 20 sessions). Since the external payment collection method is variable, an **Admin Dashboard** allows manual verification/crediting of packages. The booking engine remains locked (`credits == 0`) until verified.
2. **Real-time Scheduling:** Students book open slots connected directly to individual coaches' real-time calendars.
3. **Automated Reminders:** A dedicated cron-engine fires automated 48-hour email notifications to both student and coach before a session.
4. **Attendance & Progress Tracking:** Coaches/Admins resolve past sessions (Completed, No-Show, Rescheduled) and log fitness progress details directly to the student's historic profile.

---

## 2. System Architecture & Tech Stack

* **Frontend Framework:** React with Tailwind CSS for component modularity and accelerated UI building.
* **Backend Runtime:** Node.js with Fastify. Fastify is selected over Express for high-performance throughput, low structural overhead, and native JSON schema validation.
* **Database:** PostgreSQL to handle strict entity relations securely.
* **ORM:** Prisma for type-safe database queries and automated schema migrations.
* **Email Engine:** Resend or SendGrid API for programmatic HTML transaction dispatches.
* **Task Scheduler:** `node-cron` or `BullMQ` to execute the 48-hour automated confirmation engine.

---

## 3. Detailed Data Models (Prisma Schema Blueprint)

Core entities: `User` (roles: `STUDENT`, `COACH`, `ADMIN`), `Booking` (status: `SCHEDULED`, `RESCHEDULED`, `COMPLETED`, `NO_SHOW`), and `Availability`. See section 4 for the workflows these models support.

---

## 4. User Journeys & Core Views

### 4.1 Student Experience

**Authentication & Portal Entry:** Student authenticates. The dashboard evaluates `remainingCredits`.

- **State A — Zero Balance (Locked Interface):** The booking calendar is blocked out by a UI overlay stating: "No active session packages detected. Contact administration or complete payment verification to activate booking."
- **State B — Active Balance (Unlocked Interface):** The calendar panel renders. The student selects a coach from a dropdown, rendering that coach's matching weekly availability grid.

**Booking Execution:** Student locks an empty slot. System fires a payload to `/api/bookings`, confirming `credits > 0`, decrements `remainingCredits` by 1, and saves the new `Booking` row.

### 4.2 Admin Portal & Global Ledger

- **Manual Credit Overrides:** Since third-party payment processing (e.g. Stripe) is decoupled at this phase, the Admin needs an input view to look up students by email and update package allocations manually (+1, +3, +6, +10, +20).
- **The Global Calendar (Master Grid):** A layered chronological calendar showing every coach's active workload. Admin has drag-and-drop / click-to-edit permissions to override bookings.
- **User Management:** Interface to provision new Coach profiles, set up baseline weekly operational hours (`Availability` records), and audit outstanding student balances.

### 4.3 Coach & Session Resolution Interface

Coaches log in to manage their personal daily schedule and handle post-session status updates:

- **Mark Completed:** Locks the session. Opens a rich-text area titled "Log Client Progress Notes." Coach inputs fitness progress data, saved to `coachNotes`. The credit is permanently spent.
- **Mark No-Show:** Session terminates. The credit is not returned to the student, to enforce accountability.
- **Mark Rescheduled:** Status changes, and the credit is returned to the student's ledger, allowing them to book a new slot.

---

## 5. Automated 48-Hour Notification Engine (Backend Strategy)

The Fastify instance runs an automated background worker tracking a precision execution window:

1. **Interval Trigger:** Every hour, the system wakes a target cron task.
2. **Optimized SQL Query:** The script sweeps PostgreSQL for matching bookings:

```sql
SELECT * FROM "Booking"
WHERE "status" = 'SCHEDULED'
  AND "reminderSent" = false
  AND "sessionTime" <= NOW() + INTERVAL '48 hours'
  AND "sessionTime" > NOW() + INTERVAL '47 hours';
```

3. **Dispatch Lifecycle:** For every matching row:
   - Fetch `student.email` and `coach.email`.
   - Compile a structural HTML transaction email detailing the session time, location, and pre-workout expectations.
   - Fire emails using the Resend/SendGrid SDK.
   - Update the database flag `reminderSent = true` to protect against duplicate notification runs.

---

## 6. Target API Endpoint Blueprint

### `/api/auth`
- `POST /register` & `POST /login` — Manages secure JWT tokens and returns `UserRole`.

### `/api/admin`
- `PATCH /credits` — Payload: `{ studentId: Int, creditAdjustment: Int }`. Modifies user session counts.
- `POST /coaches/availability` — Sets baseline coach availability grids.

### `/api/bookings`
- `GET /available-slots?coachId={id}&date={ISOString}` — Fetches free time segments for a coach.
- `POST /book` — Payload: `{ coachId: Int, sessionTime: DateTime }`. Verifies credit balance and decrements it.
- `PATCH /resolve` — Payload: `{ bookingId: Int, status: BookingStatus, coachNotes: String? }`. Used by admins/coaches to log outcome status and progress notes.
