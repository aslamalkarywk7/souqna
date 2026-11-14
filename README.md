# Souqna · سوقنا

**A full-stack, bilingual (Arabic RTL / English LTR) e-commerce platform** — complete relational
database, JWT authentication, cart & checkout with coupons, order lifecycle management, reviews,
wishlist, and a role-protected admin dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Feature Matrix](#feature-matrix)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [Business Rules](#business-rules)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)

---

## Overview

Souqna is a production-shaped e-commerce platform built as a single repository containing a
React SPA (`src/`) and an Express API (`server/`). It demonstrates the full commerce lifecycle
end-to-end: browse → search → cart → coupon → checkout → payment → order tracking → admin
fulfillment — with a **true bilingual UI** where switching language flips the entire document
direction (RTL ↔ LTR) and every product carries separate Arabic/English content.

Monetary correctness is treated as a first-class concern: **all prices are stored and
transmitted as integer minor units** (halalas), formatted for display only at the edges via
`Intl.NumberFormat`.

## Feature Matrix

| Area | Capabilities |
| --- | --- |
| **Catalog** | Paginated listing, full-text search (AR/EN/brand), category & price filters, 5 sort orders, featured collections, related products |
| **Product page** | Image gallery, specs table, stock badges, quantity picker, reviews with rating aggregates |
| **Cart** | Guest cart (localStorage) that **merges into the server cart on login**, stock-aware quantity limits |
| **Checkout** | Address form, coupon validation, COD or card (simulated gateway), transactional order creation |
| **Orders** | Order history, detail view, cancellation with **automatic stock restoration & coupon refund** |
| **Reviews** | 1–5 stars, one per user/product (DB-enforced), denormalized rating aggregates refreshed on write |
| **Wishlist** | Per-user favorites with fast toggle |
| **Auth** | JWT (7-day), bcrypt password hashing, role-based guards (`customer` / `admin`) on both client routes and API |
| **Admin** | KPI dashboard (revenue, best sellers, low stock), product CRUD (soft delete), order status workflow, coupon management |
| **i18n** | Arabic-first RTL with instant EN/LTR switch, persisted preference, localized currency & dates |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript (strict), React Router 7, Tailwind CSS 4, i18next, Motion, lucide-react |
| Backend | Node.js, Express 4, better-sqlite3 (WAL), Zod validation, jsonwebtoken, bcryptjs |
| Build | Vite 6, tsx (server), concurrently (one-command dev) |
| Fonts | Fontsource self-hosted (Inter Variable + Cairo) — zero external CDN calls |

## Architecture

```
Browser ──► Vite dev server :5173 ──┐
                                    │ /api proxy
                                    ▼
                          Express API :3001 ──► SQLite (data/souqna.db, WAL)
                                    │
                          ┌─────────┴─────────┐
                     zod validation      JWT auth middleware
                          │                   │
                     route handlers ──► better-sqlite3 prepared statements
                                    │
                          PaymentService interface (mock gateway — swap for Stripe, etc.)
```

- **Single transaction checkout**: stock re-validation, order + items insert, stock decrement,
  coupon consumption, and cart clearing happen atomically. If any step throws, nothing persists.
- **DTO boundary**: raw DB rows never reach the client; `server/src/lib/serialize.ts` parses
  JSON columns and shapes stable API objects.
- **Stable error contract**: every failure returns `{error: {code, message}}` with machine codes
  (`OUT_OF_STOCK`, `COUPON_EXPIRED`, …) the frontend maps to localized messages.

## Database Schema

10 tables, fully indexed with FK constraints (`server/src/db/schema.sql`):

| Table | Purpose |
| --- | --- |
| `users` | Accounts with `role` check constraint (`customer`/`admin`), bcrypt hashes |
| `addresses` | Saved shipping addresses per user |
| `categories` | Bilingual names, image, self-referencing `parent_id` |
| `products` | SKU/slug, `name_ar`/`name_en` + descriptions, integer price, `compare_at_price`, stock, JSON `images`/`specs`, featured flag, rating aggregates |
| `carts` / `cart_items` | Server-side cart, `UNIQUE(cart_id, product_id)` |
| `orders` | Human-friendly `order_number`, 7-state status workflow, payment status, totals snapshot, shipping address snapshot, coupon reference |
| `order_items` | **Price & name snapshot at purchase time** — history survives product edits |
| `coupons` | `percent`/`fixed`, min subtotal, max uses, expiry |
| `reviews` | 1–5 rating, `UNIQUE(product_id, user_id)` |
| `wishlist_items` | `UNIQUE(user_id, product_id)` |

Seed data (`server/src/db/seed.ts`): 6 categories, 24 bilingual products with real imagery,
2 coupons, 3 users, sample reviews.

## API Reference

All routes under `/api` — JSON in/out.

| Method & Path | Auth | Description |
| --- | --- | --- |
| `POST /auth/register` · `POST /auth/login` | — | Returns `{token, user}` |
| `GET /auth/me` · `PATCH /auth/me` | JWT | Session / profile update |
| `GET /products` | — | `q`, `category`, `featured`, `price_min/max`, `sort`, `page`, `per_page` |
| `GET /products/:slug` | — | Product + 4 related |
| `GET /products/:id/reviews` | — | Reviews with usernames |
| `POST /products/:id/reviews` · `DELETE …/reviews` | JWT | Create (one per user) / own review |
| `GET/POST/PATCH/DELETE /cart…` | JWT | Full cart operations + `POST /cart/merge` for guest carts |
| `POST /coupons/validate` | — | Non-destructive coupon check |
| `POST /orders` | JWT | Transactional checkout |
| `GET /orders` · `GET /orders/:orderNumber` | JWT | History / details |
| `POST /orders/:orderNumber/cancel` | JWT | Cancel + restock + refund coupon |
| `GET/POST/DELETE /wishlist…` | JWT | Favorites |
| `GET /admin/stats` | Admin | Revenue, best sellers, low stock, recent orders |
| `GET/POST/PATCH/DELETE /admin/products…` | Admin | Product CRUD (soft delete) |
| `GET/POST/DELETE /admin/categories…` | Admin | Category management |
| `GET /admin/orders` · `PATCH /admin/orders/:id` | Admin | Order workflow |
| `GET/POST/DELETE /admin/coupons…` | Admin | Coupon management |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Run

```bash
git clone https://github.com/aslamalkarywk7/dfghjk.git souqna
cd souqna
npm install
npm run dev        # API :3001 + Vite :5173 (proxied) in one command
```

Open **http://localhost:5173**. The database is created and seeded automatically on first run.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | API + client concurrently with hot reload |
| `npm run build` | Production client build to `dist/` |
| `npm start` | Production server (serves `dist/` + API on :3001) |
| `npm run lint` | Strict typecheck of both client and server |
| `npm run db:reset` | Drop, migrate, and reseed the database |

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@souqna.com` | `Admin@123` |
| Customer | `sara@example.com` | `User@123` |
| Customer | `omar@example.com` | `User@123` |

Active coupons: `WELCOME10` (10%, min SAR 100) · `SAVE50` (SAR 50 off, min SAR 300).

## Business Rules

- Prices are **integer minor units** everywhere (DB, API, cart math); formatting happens only in the UI.
- Free shipping over **SAR 500**, otherwise **SAR 25**.
- Orders transition `pending → paid → processing → shipped → delivered`; `cancelled`/`refunded` restore stock.
- Card payments mark orders `paid` instantly (simulated gateway behind a `PaymentService` interface — replace with a real PSP without touching route logic).
- Cancelling an order returns its coupon usage and flips paid charges to `refunded`.
- Product deletion is soft (`is_active = 0`) so order history never breaks.

## Testing

A 32-assertion end-to-end smoke suite covering the full lifecycle — auth (valid/invalid/duplicate),
catalog search & filtering, cart, coupon validation (percent & fixed), transactional checkout
with exact total math, stock decrement & restoration on cancel, review uniqueness, wishlist,
RBAC (customer blocked from admin), admin CRUD for products/coupons — passes **32/32** against a
freshly seeded database.

## Project Structure

```
├── index.html                  # RTL-first shell, SEO meta
├── vite.config.ts              # React + Tailwind + /api proxy
├── src/                        # ── Client ──
│   ├── main.tsx                # Providers, router, self-hosted fonts
│   ├── App.tsx                 # Route tree with auth/admin guards
│   ├── i18n/                   # ar.json / en.json dictionaries + direction manager
│   ├── context/                # AuthContext (JWT session), CartContext (guest↔server merge)
│   ├── lib/                    # api client, money formatting
│   ├── components/             # ProductCard, RatingStars, Pagination, Toast, layout…
│   └── pages/                  # home, catalog, product, cart, checkout, auth,
│       ├── account/            #   profile, orders, order details, wishlist
│       └── admin/              #   dashboard, products, orders, coupons
└── server/                     # ── API ──
    └── src/
        ├── index.ts            # Express app, route mounting, SPA serving
        ├── db/                 # schema.sql, connection, migrate, seed
        ├── lib/                # errors, pricing/coupons, DTO serializers
        ├── middleware/         # JWT auth, admin guard, zod parsing, error handler
        ├── services/           # PaymentService (mock gateway)
        └── routes/             # auth, products, cart, coupons, orders, reviews, wishlist, admin
```

## Roadmap

- [ ] Real payment provider (Stripe / Moyasar / Paymob) behind `PaymentService`
- [ ] Refresh-token rotation & rate limiting on auth endpoints
- [ ] Email notifications on order status change
- [ ] Image uploads (S3-compatible storage) instead of URL input
- [ ] Full test suite (Vitest unit + Playwright E2E) in CI
- [ ] PostgreSQL migration path (repository pattern already isolates SQL)
