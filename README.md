# Referral System

A production-oriented referral platform: users register, get a unique referral
code, and earn exactly 10 points for every valid referral. Built with
Next.js (App Router), TypeScript, Prisma, and PostgreSQL.

## Stack

- **Next.js 14** (App Router, Route Handlers, Server Components)
- **PostgreSQL** + **Prisma ORM**
- **Zod** for server-side validation
- **Argon2id** for password hashing
- **DB-backed sessions** (opaque token in an HttpOnly cookie, only its hash stored)
- **Tailwind CSS** for the UI

## Quick start

```bash
git clone <repository>
cd referral-system
npm install
cp .env.example .env
# Set DATABASE_URL to your PostgreSQL connection string (e.g. a Supabase
# connection string) and NEXT_PUBLIC_APP_URL
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | Used to build the shareable referral link (`/register?ref=CODE`) |

Never commit a real `.env` file — only `.env.example` is checked in.

## Architecture

```
Browser
  |
  v
Next.js App Router  --  Auth pages, protected dashboard, route handlers
  |
  v
Service layer (lib/)  --  auth.ts, referral.ts, validation.ts, security.ts
  |
  v
Prisma ORM  -->  PostgreSQL
```

**Principle:** the UI never decides whether a reward is valid. Every API
route re-checks authentication and re-validates input server-side; the
referral reward itself is guaranteed correct by the database schema, not by
trusting the client.

## Data model

- `User` — account + `referralCode` (unique) + `points`
- `Referral` — one row per successful referral. `referredUserId` is
  **unique**, which makes it impossible at the database level for a single
  new user to ever generate more than one reward, no matter how many times
  registration is retried or raced.
- `Session` — DB-backed session table. Only a SHA-256 hash of the session
  token is stored; the raw token lives only in the HttpOnly cookie.

## The referral transaction

`lib/referral.ts` → `registerUserWithReferral()`:

```ts
await prisma.$transaction(async (tx) => {
  const referrer = referralCode
    ? await tx.user.findUnique({ where: { referralCode } })
    : null;

  const user = await tx.user.create({ data: { name, email, passwordHash, referralCode: newCode } });

  if (referrer && referrer.id !== user.id) {
    await tx.referral.create({ data: { referrerId: referrer.id, referredUserId: user.id, pointsAwarded: 10 } });
    await tx.user.update({ where: { id: referrer.id }, data: { points: { increment: 10 } } });
  }

  return user;
});
```

User creation, the `Referral` row, and the referrer's `+10` point increment
all happen inside a single transaction — if any step fails, nothing commits.
A `P2002` unique-constraint error (e.g. a concurrent duplicate email) is
caught and turned into a safe, generic client-facing error rather than a
raw database error.

## Security

- Passwords hashed with **Argon2id** (OWASP-recommended parameters), never
  stored or returned in plaintext.
- Sessions are DB-backed, HttpOnly, `Secure` in production, `SameSite=Lax`,
  and only a hash of the token is persisted.
- All input validated server-side with **Zod**; email is normalized
  (trimmed + lowercased) before every uniqueness check and lookup.
- Login returns the same generic "Invalid email or password" error whether
  the account doesn't exist or the password is wrong, to reduce account
  enumeration.
- `passwordHash` and other internal fields are never selected into
  API responses — `getCurrentUser()` only returns a `SafeUser` projection.
- Dashboard and `/api/referrals`, `/api/me` all re-check authentication
  server-side and scope every query to the authenticated user's own id.
- Basic in-memory rate limiting on `/api/auth/login` and
  `/api/auth/register` (see `lib/rateLimit.ts`). This is fine for a single
  instance; a multi-instance production deployment should move this to a
  shared store (Redis/Upstash) so the limit is enforced across processes.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.js`.
- No stack traces or raw database errors are ever returned to the client —
  unexpected errors are logged server-side and mapped to a generic 500.

## Tests

```bash
npm test
```

- `tests/validation.test.ts` — pure unit tests for the Zod schemas, no DB required.
- `tests/referral.integration.test.ts` — integration tests against a real
  PostgreSQL database, covering every edge case from the assessment spec:
  registration without a referral, exactly-10-points on a valid referral,
  invalid referral codes awarding nothing, duplicate email rejection, and
  proof that a second `Referral` row for the same referred user is rejected
  at the database level. Point `DATABASE_URL` at a disposable test database
  and run migrations before running these.

## Project structure

```
app/
  (auth)/login/page.tsx
  (auth)/register/page.tsx
  dashboard/page.tsx
  api/auth/register/route.ts
  api/auth/login/route.ts
  api/auth/logout/route.ts
  api/referrals/route.ts
  api/me/route.ts
components/
  auth/        LoginForm, RegisterForm
  dashboard/   SummaryCards, ReferralTicket, ReferralHistoryTable, LogoutButton
  ui/          Field, Button
lib/
  db.ts          Prisma client singleton
  auth.ts        session create/read/destroy
  security.ts    password hashing, token + referral code generation
  validation.ts  Zod schemas
  referral.ts    the core registration + referral transaction
  rateLimit.ts   in-memory rate limiter
prisma/schema.prisma
tests/
```

## Submission checklist

- [x] No secrets committed
- [x] No plaintext passwords
- [x] Prisma migration included (`prisma migrate dev` generates it on first run)
- [x] README works from a clean clone
- [x] Referral reward is atomic (single `$transaction`)
- [x] Duplicate reward is impossible at the database level (`referredUserId @unique`)
- [x] Dashboard is protected (server-side session check, redirects if unauthenticated)
- [x] Input validation is server-side (Zod on every route)
- [x] Tests cover referral edge cases
- [x] UI is responsive and polished
