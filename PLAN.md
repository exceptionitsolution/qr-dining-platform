# Multi-Tenant Cafe QR Ordering Platform

## Context

You want a QR-ordering system for cafes, modeled on the Burger King counter-pickup flow: customer scans a QR code, browses that cafe's menu, adds items to a cart, checks out with a phone number and a payment choice (Pay at Counter or Online), and receives a token number. The cafe owner/staff watch a live counter dashboard showing each order's token, items, and payment status, and move it through preparing → ready → completed.

This isn't for one cafe — it's a shared platform for **many** cafes. Each cafe gets its own QR code and its own menu; everything else (ordering flow, cart, token system, dashboard) is the same shared logic, with strict isolation between cafes' data.

Two onboarding paths need to exist from day one:
1. **Self-serve** — a cafe owner signs up, creates their cafe, and builds their own menu, with no involvement from you.
2. **Manual** — you (the platform operator) create a cafe and its menu on an owner's behalf, for cafes that need hand-holding.

Constraints already agreed: Next.js (single codebase) hosted free on Vercel; Supabase free tier for the database (must be reachable online), using its built-in Realtime for the live dashboard and its Auth for owner logins; Razorpay as the default online payment gateway (swappable later, not committed); "Pay at Counter" instead of true COD, so a token is issued without needing cash collected first.

The project directory is currently empty — this is a from-scratch build.

---

## Architecture Decisions

**Money & IDs:** all amounts stored as integer paise (`*_cents`) to avoid float rounding and match Razorpay's API directly. All primary keys are UUIDs — this matters beyond style: an order's UUID doubles as the unguessable "access token" a customer uses to view their own order status without logging in. Sequential IDs would let anyone increment a URL and see other customers' phone numbers and orders across every cafe on the platform (a cross-tenant IDOR) — UUIDs close that off for free.

**Customer sessions:** customers never see a login screen, but under the hood the ordering page calls Supabase's anonymous sign-in (`signInAnonymously()`) once, giving each customer a real (credential-less) session. This is what lets us write a proper Row Level Security policy ("you can only read your own order") and use Realtime for live status pushes — without any session at all, we'd have no way to scope access per-customer other than "trust the URL," which also breaks Realtime (its authorization is RLS-based, not filter-based).

**Token numbering:** a dedicated `order_token_counters(cafe_id, token_date, last_token)` table, incremented via a single atomic `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` call — this is race-condition-proof under concurrent orders with no locks or cron jobs needed, and naturally resets each morning per cafe (using the cafe's own timezone, not UTC).

**Token timing:** for Pay-at-Counter, the token is issued the instant the order is placed (that's the point of this mode). For Online payment, the token is deliberately **not** issued until payment is confirmed — if issued upfront, a customer who abandons checkout mid-payment would burn a token number on a phantom order.

**Payments as their own table**, not columns on `orders` — keeps `orders` gateway-agnostic, supports retries cleanly (a failed-then-retried payment is a second row, not a mutated one), and means the Razorpay-specific logic (order creation, webhook signature verification) lives in one isolated module (`lib/payments/razorpay.ts`), so swapping gateways later touches one file, not the whole schema.

**Both onboarding paths converge on the same tables and the same menu-management UI/API** — a shared `MenuBuilder` component takes only a `cafeId` prop and doesn't know or care whether a self-serve owner or a super-admin is driving it. Access is checked in two places: the page/route layout (who's allowed to land here at all) and the API route itself (does this caller actually own this `cafeId`, or are they super-admin) — the component stays dumb on purpose.

**Roles:** a single `profiles.role` enum (`owner` | `super_admin`), populated automatically on signup, checked both in Postgres RLS policies and in Next.js route guards. Promotion to `super_admin` only ever happens by you running SQL directly — never through any app code path — so there's no self-escalation surface.

---

## Data Model & Backend (Supabase / Postgres)

**Tables** (`supabase/migrations/0001_schema.sql`):
- `profiles` — mirrors `auth.users`, holds `role`
- `cafes` — `owner_id` (nullable, so super-admin can create before an owner account exists), `slug` (QR target), `is_active` (platform-level pause), `is_published` (owner's own "go live" switch, defaults false so a fresh signup can't accidentally take orders against an empty menu), `timezone`
- `menu_categories`, `menu_items` — scoped by `cafe_id`, items have `price_cents` and an `is_available` toggle
- `order_token_counters` — the atomic per-cafe-per-day counter described above
- `orders` — `cafe_id`, `customer_session_id` (the anonymous auth uid), `token_number` (nullable until assigned), `status` enum, `payment_status` enum, `payment_method` enum, `customer_phone`, `total_cents`
- `order_items` — snapshots `name`/`price` at order time (so a later menu price edit never changes a past order's total)
- `payments` — one row per payment attempt, provider fields, raw webhook payload for debugging

**Functions/triggers** (`supabase/migrations/0002_functions.sql`):
- `next_token_number(cafe_id, date)` — the atomic counter increment
- `create_order(...)` — the *only* way an order row gets created; re-fetches prices from `menu_items` server-side (never trusts client-submitted prices), re-checks the cafe is active+published, computes totals
- `confirm_online_payment(order_id, payment_id, signature)` — idempotent (safe to call twice from client callback + webhook), flips `payment_status='paid'` and assigns the token in one step
- `mark_payment_failed(...)` — only downgrades if not already paid, so a late/out-of-order webhook can't undo a successful payment
- `enforce_order_status_transition` trigger — rejects impossible status jumps (e.g. `ready` → `preparing`) regardless of which code path (dashboard click, webhook, cron) attempted it
- `handle_new_user` trigger — creates the `profiles` row with `role='owner'` on signup

**Row Level Security** (`supabase/migrations/0003_rls.sql`) — enabled on every table, default-deny:
- `cafes`/`menu_items`: public can read only active+published cafes and available items; owners and super-admin see/edit everything for their own cafe (`owns_cafe()` / `is_super_admin()` helper functions)
- `orders`/`order_items`/`payments`: a customer can only read rows tied to their own anonymous session; owners/super-admin can read+update their cafe's orders; **no direct INSERT policy at all** — every order is created through `create_order()`, closing off price tampering and token forgery at the schema level
- Sensitive columns (`role`, `owner_id`, order totals/phone/token) are additionally locked with `REVOKE UPDATE` grants, as a second layer independent of the RLS policies themselves

---

## Application Structure (Next.js App Router)

Three separate top-level surfaces, each with its own layout and access gate:

```
app/
├── order/[cafeSlug]/           # PUBLIC — menu → cart → checkout → order/[orderId] status page
├── (auth)/signup, login/       # owner self-serve signup
├── onboarding/                 # first-run wizard: create cafe → build menu → reveal QR → go live
├── dashboard/                  # OWNER steady state: live orders board, menu management, settings
├── super-admin/                # SUPER-ADMIN: list cafes, create cafe on owner's behalf, edit any cafe's menu
└── api/                        # cafes, menu, orders, razorpay/create-order, webhooks/razorpay, cron/reconcile-payments
```

Public ordering lives under `/order/[cafeSlug]` specifically so a cafe's slug can never collide with `/dashboard`, `/login`, `/api`, etc.

**Shared components:** `components/menu-builder/MenuBuilder.tsx` (used by both `/onboarding/menu`, `/dashboard/menu`, and `/super-admin/cafes/[cafeId]/menu`), `components/qr/QRDisplay.tsx` (used by `/onboarding/qr`, `/dashboard/settings`, `/super-admin/cafes/[cafeId]/qr`), `components/cart/CartProvider.tsx`, `components/orders/OrderBoard.tsx`.

**Cart scoping:** a fresh Zustand store is created per cafe-slug mount (not a global singleton), persisted under a `cart:{slug}` localStorage key, so two browser tabs open on two different cafes never share state.

**QR generation** happens inside one shared `createCafe()` function that both onboarding paths call — the moment a cafe row is inserted, a PNG (via the `qrcode` package) encoding `https://<app>/order/<slug>` is generated and stored, so it's structurally impossible for one onboarding path to forget it.

**Empty states:** a cafe with no menu yet (or `is_published=false`) shows "menu coming soon" with no add-to-cart UI rendered at all (checked server-side, not just hidden); an owner who hasn't finished onboarding is always redirected to the right wizard step — `/dashboard` is unreachable until setup is complete.

**Key packages beyond next/react/@supabase/supabase-js:** `@supabase/ssr` (session handling across server/client components), `zustand` (cart state), `qrcode` (QR generation), `razorpay` (server-side order creation — the checkout widget itself loads via a plain script tag, no wrapper package needed), `tailwindcss`, `react-hook-form` + `zod` (the ~6 recurring forms share validation schemas between client and API routes), `clsx`. Deliberately skipping a UI component library, TanStack Query, and any extra state library — nothing here needs them at this scope.

---

## Payment Flow (Razorpay)

1. Checkout POSTs cart + phone to `/api/orders` → server calls `create_order()` → order sits `awaiting_payment` (online) or `placed` with a token already issued (pay-at-counter).
2. For online: server creates a Razorpay order via the server-side SDK, returns its id to the client, which opens Razorpay's checkout widget.
3. On success, a client callback does an optimistic "fast path" confirmation — but the **webhook is the source of truth**: `/api/webhooks/razorpay` verifies the HMAC signature over the raw request body, then calls `confirm_online_payment()`, which is idempotent so it's safe to be called by both the client callback and the webhook (and any webhook retries).
4. A Vercel Cron job (`/api/cron/reconcile-payments`) periodically polls Razorpay directly for any `awaiting_payment` order older than a few minutes, so a lost webhook never leaves an order stuck in limbo — anything unresolved past ~30 minutes is marked `payment_failed`.

---

## Build Order

1. **Scaffold** — Next.js app, Supabase project, environment variables, Tailwind, base layout.
2. **Schema + RLS** — run the three migration files above against Supabase; hand-verify RLS with the Supabase SQL editor (try reading another cafe's data as each role).
3. **Owner auth + onboarding + MenuBuilder** — signup/login, onboarding wizard, shared menu-builder component, QR generation.
4. **Customer ordering flow** — menu browse, cart, checkout form (phone + payment method), order-status page — Pay-at-Counter path first since it has no external dependency.
5. **Razorpay integration** — create-order route, checkout widget, webhook, reconciliation cron.
6. **Owner dashboard** — live orders board wired to Realtime, status/payment actions.
7. **Super-admin panel** — cafe list, create-on-behalf-of-owner flow (Supabase Auth admin invite), reusing MenuBuilder/QRDisplay.
8. **Polish** — empty states, deactivation/pause behavior, mobile styling pass (this is a phone-scanned flow, so mobile is the primary viewport, not desktop).

## Verification

- After migrations: in the Supabase SQL editor, confirm RLS actually blocks cross-tenant reads (e.g. query `orders` as one cafe owner's JWT and confirm another cafe's rows don't appear).
- Manual end-to-end pass per build-order step, on a real phone: scan a test QR, place a Pay-at-Counter order, confirm the token appears live on the dashboard without a refresh.
- Razorpay: use their test-mode keys and test card numbers to run a full online-payment order through to a token being issued, then kill the webhook temporarily to confirm the reconciliation cron still resolves it.
- Confirm two tabs on two different cafe slugs never cross-contaminate cart contents.
