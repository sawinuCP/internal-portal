# Team Portal — Internal Portal

A small internal portal built as a team home base: login-gated, with a single
content section — an **announcements feed** that supports creating and viewing
posts. Next.js (App Router) for both frontend and backend, TypeScript,
Prisma + SQLite, Tailwind CSS, and Zod.

Scope follows the brief: one section done cleanly end-to-end rather than
several half-built ones.

## Quick start

Prereqs: Node.js 18.18+ (developed on Node 22) and npm.

```bash
npm install
npx prisma migrate dev     # creates the SQLite database (prisma/dev.db)
npm run db:seed            # seeds demo users + a few announcements
npm run dev                # http://localhost:3000
```

Demo logins (created by the seed script):

| Email | Password |
|---|---|
| amara@portal.dev | Password123! |
| dilan@portal.dev | Password123! |

## What's inside

- **Login page** (`/login`) with inline validation, pending state, and a clear
  error banner; honors `?next=` to return you to where you were headed.
- **Sign up** (`/signup`) — self-serve account creation; new users land
  straight in the portal.
- **Protected portal** (`/announcements`) — the announcements feed:
  - create announcements (validated, with a character counter) and see them
    appear at the top of the list,
  - newest-first feed with author attribution and relative timestamps,
  - loading skeletons, an empty state, and an error state with retry.
- **Logout** from the top bar (POST, revokes the server-side session).
- Logged-out visitors to any portal URL are redirected to login.

## Auth implementation

**Credential storage.** Passwords are hashed with bcrypt (cost 12); plaintext
is never stored or logged. Login verifies with `bcrypt.compare`.

**Account creation.** Signup hashes passwords with bcrypt at creation
(8–72 chars — bcrypt ignores bytes past 72). Duplicate emails are rejected
with `409`; the unique index also catches races between simultaneous
signups, and new sessions start immediately after signup.

**Sessions.** On login the server creates a `Session` row and sets an opaque,
32-byte random token in a cookie:

```
Set-Cookie: portal_session=<token>; HttpOnly; SameSite=Lax; Max-Age=604800; Secure (in production)
```

- The database stores only the **SHA-256 hash** of the token — a leaked
  database alone cannot be used to forge valid cookies.
- `HttpOnly` keeps the token invisible to JavaScript (XSS cannot steal it);
  `SameSite=Lax` stops cross-site POSTs from riding the session (CSRF).
- Expiry (7 days) is checked **server-side on every lookup** against the DB
  record — the cookie's own expiry is a convenience, not the guard.
- Logout deletes the session row (instant revocation) and clears the cookie;
  expired sessions are removed lazily when encountered and on login.

**Three protection layers** (defense in depth):

1. `src/proxy.ts` — Next.js 16's middleware convention: an edge check that
   redirects to `/login?next=…` when no session cookie is present (cheap
   first filter, cookie *presence* only).
2. `src/app/(portal)/layout.tsx` — the real gate: resolves the session against
   the database on every request and redirects if invalid.
3. API routes — `requireSession()` returns `401` before any handler logic runs;
   every protected endpoint guards itself, since APIs are reachable without
   the UI.

**Login hardening.**

- Zod-validated bodies; one generic `Invalid email or password.` message for
  unknown email *and* wrong password (no user enumeration), with a dummy
  bcrypt compare so both failure paths cost the same time (no timing oracle).
- In-memory rate limiting: 5 login attempts per minute per IP+email (`429`
  afterwards).
- Mutating endpoints accept only JSON and require a same-`Origin` header —
  defense in depth on top of `SameSite=Lax`.

**Why DB sessions instead of JWT.** For a server-rendered portal, revocable
sessions are simpler and safer: logout (or log-out-everywhere) is a DELETE,
a stolen token can be killed instantly, and no token ever lives in
JS-readable storage. Stateless JWTs pay off across many independent services —
not the case here.

## API contract

| Method & path | Auth | Success | Errors |
|---|---|---|---|
| `POST /api/auth/login` | — | `200 {user}` + session cookie | `400` bad JSON, `401` invalid creds, `422` validation, `429` rate-limited, `403` cross-origin |
| `POST /api/auth/register` | — | `201 {user}` + session cookie | `400` bad JSON, `409` email taken, `422` validation, `403` cross-origin |
| `POST /api/auth/logout` | ✔ | `204` | `403` cross-origin |
| `GET /api/auth/me` | ✔ | `200 {user}` | `401` |
| `GET /api/announcements` | ✔ | `200 {items}` newest-first | `401` |
| `POST /api/announcements` | ✔ | `201 {item}` | `401`, `403`, `422` |

All errors use one envelope:

```json
{ "error": { "message": "…", "fields": { "title": "…" } } }
```

## Project structure

```
src/
├── proxy.ts                       # edge guard (cookie presence → redirect)
├── app/
│   ├── page.tsx                   # entry redirect: portal or login
│   ├── login/page.tsx             # public login page
│   ├── signup/page.tsx            # public signup page
│   ├── (portal)/                  # authenticated area
│   │   ├── layout.tsx             # DB-verified session + top bar + logout
│   │   └── announcements/page.tsx # the content section
│   └── api/
│       ├── auth/{login,logout,me}/route.ts
│       └── announcements/route.ts # GET list + POST create
├── components/
│   ├── ui/                        # Button, Input, Textarea, FormField, Alert, Card
│   ├── auth/                      # LoginForm, SignupForm, LogoutButton
│   └── announcements/             # Section, Form, List
└── lib/
    ├── db.ts                      # Prisma client singleton
    ├── auth/                      # password, session, guard, rateLimit, constants
    ├── http/                      # response envelope, origin check
    ├── validation/schemas.ts      # zod schemas shared by API + forms
    ├── hooks/useAnnouncements.ts  # feed state: loading / error / create
    └── utils/time.ts              # relative timestamps
```

## Key decisions

| Decision | Why |
|---|---|
| Announcements feed as the section | Cleanest create + view story; ordering, timestamps, and author attribution come naturally |
| SQLite via Prisma | A real relational DB with zero external services — runs anywhere after `npm install` |
| bcryptjs (cost 12) | Standard credential hashing without native-build friction |
| Server-side sessions; opaque token, SHA-256-hashed at rest | Instant revocation, XSS-resistant storage, no JWT revocation problem |
| Open signup | Keeps the take-home self-serve: reviewers create their own account. A real internal portal would gate this behind invite codes or admin provisioning |
| Zod schemas shared by API and forms | Client and server validation can never drift apart |
| RSC pages + one small client hook | Server components render; `useAnnouncements` owns feed state; no global state library at this scope |
| In-memory rate limiter | Right-sized for this scope; a real deployment would use a shared store (below) |

## With more time

- Unit/integration tests (Vitest) for the auth libs and API handlers.
- Session binding to user-agent/IP with "new sign-in" notifications.
- Redis-backed rate limiting and session store for multi-instance deploys.
- Pagination ("load more") on the feed.
- A deploy story: serverless file systems can't host SQLite, so the datasource
  would move to Turso/Postgres via Prisma driver adapters.

## Troubleshooting (Windows dev servers)

On some Windows machines, real-time antivirus locks Turbopack's dev manifests
mid-rename (`EPERM ... rename ... .next\dev\...`), which surfaces as random
500s on pages in dev mode — the API routes keep working. The `dev` script
therefore uses webpack (`next dev --webpack`), which is immune to this. If
you prefer Turbopack, run `npm run dev:turbo`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:3000 (webpack — see troubleshooting) |
| `npm run dev:turbo` | Dev server with Turbopack |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply migrations in dev |
| `npm run db:seed` | Seed demo users + announcements |
| `npm run db:studio` | Browse data in Prisma Studio |

