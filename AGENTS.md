# Peluquería — AGENTS.md

## Stack

- **Frontend**: Angular 17 standalone (`@angular-devkit/build-angular:application` esbuild), Tailwind CSS, RxJS 7
- **Backend**: Express, Mongoose, JWT auth, Stripe Checkout, Nodemailer
- **Database**: MongoDB local (`mongodb://localhost:27017/corte-premium`)
- **Styling**: Tailwind with custom `premium` gold palette and `dark` palette

## Dev servers (both required)

```powershell
# Terminal 1 - Backend (port 3000)
cd server
npm run dev          # node --watch src/server.js

# Terminal 2 - Frontend (port 4200)
ng serve             # or: npx @angular/cli serve
```

Backend: `server/.env` needed with `MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`.

## Architecture

### Frontend routes (`src/app/app.routes.ts`)
| Route | Guard | Purpose |
|---|---|---|
| `/` | — | Home |
| `/servicios`, `/equipo` | — | Public pages |
| `/login`, `/registro` | — | Auth |
| `/reservar/*` | `authGuard` | Booking wizard (4 steps) |
| `/mis-citas` | `authGuard` | User appointments |
| `/admin` | `adminGuard` | Admin panel |
| `/reservar/exito` | `authGuard` | Post-payment success |

### Booking wizard flow (all routes under `authGuard`)
`paso-1` (services) → `paso-2` (stylist, guarded: `hasServices`) → `paso-3` (datetime, guarded: `hasStylist`) → `paso-4` (confirmation + payment, guarded: `hasDate`)

State managed by `BookingService` (Angular signals). Step guards in `booking.guard.ts`.

**Important**: `BookingService` has separate signals for `catalogServices` (all services from API) and `selectedServices` (user's picks). `loadServices()` only populates the catalog — visiting `/servicios` does not mark anything as selected.

### Payment flow
1. POST `/api/payment/create-checkout-session` (JWT required) → returns Stripe Checkout URL
2. User redirected to Stripe, pays, then redirected to `/reservar/exito?session_id=cs_...`
3. GET `/api/payment/checkout-success?session_id=...` (JWT required) → creates Appointment in MongoDB
4. `POST /api/payment/webhook` (no auth, raw body) → Stripe webhook for `checkout.session.completed` as fallback

### Two confirmation paths on paso-4
- "Confirmar Reserva" → calls `POST /api/appointments` (JWT required), saves to MongoDB, falls back to localStorage
- "Pagar con Tarjeta (Stripe)" → creates Stripe session, persists to MongoDB on success

## Key gotchas

- **Stripe metadata 500-char limit**: `payment.js` stores `serviceIds` as comma-separated IDs (not full JSON). On checkout-success, services are reconstructed from the server catalog (`server/src/data/services.js`).
- **Prices validated server-side**: `create-checkout-session` ignores client-supplied prices and recalculates from catalog by service ID.
- **Availability endpoint**: `GET /api/appointments/availability?date=YYYY-MM-DD&stylistId=N` returns confirmed times for ALL users (not just current user). StepDatetimeComponent uses this instead of local filtering.
- **`POST /api/appointments` also validates prices**: Recalculates price/duration from catalog, and checks for time conflicts (same barber, date, time).
- **Webhook needs raw body**: `POST /api/payment/webhook` is mounted before `express.json()` in `server.js` with `express.raw({type:'application/json'})` for Stripe signature verification. Requires `STRIPE_WEBHOOK_SECRET` in `.env` (optional in dev — logs warning if missing).
- **Payment routes require JWT**: All `/api/payment/*` endpoints check `auth` middleware. The booking page is guarded by `authGuard` so users must log in before reserving.
- **Catalog is static JS data** (`server/src/data/services.js`, `stylists.js`), not from DB.
- **Angular dev server** uses esbuild (fast HMR) but route config changes need a full page reload.
- **No lint/typecheck/tests configured**: No `lint`, `typecheck`, or test scripts beyond `ng test` (Karma + Jasmine). No pre-commit hooks.

## Server API

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/auth/register` | — | Register, returns `{token, user}` |
| `POST /api/auth/login` | — | Login, returns `{token, user}` |
| `GET /api/catalog/services` | — | All services |
| `GET /api/catalog/stylists` | — | All stylists |
| `POST /api/payment/create-checkout-session` | JWT | Create Stripe session |
| `GET /api/payment/checkout-success` | JWT | Verify payment, create appointment |
| `POST /api/payment/webhook` | — (raw) | Stripe webhook (checkout.session.completed) |
| `GET /api/appointments/availability?date=&stylistId=` | — | Booked times for a barber on a date |
| `POST /api/appointments` | JWT | Create appointment (free booking) |
| `GET /api/appointments` | JWT | User's appointments |
| `GET /api/health` | — | Health check |

## Editor conventions (`.editorconfig`)
- 2-space indent, UTF-8, trailing newline
- Single quotes for `.ts` files
