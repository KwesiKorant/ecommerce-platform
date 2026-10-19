# Ecommerce Platform — State Save Document

> **Saved State:** Completed Base Model (Phases 0–4 Verified)  
> **Date:** October 17, 2026  
> **Branch:** `main` | **Latest Commit:** `942d11a` | **Working Tree:** Clean

---

## 1. Project Overview & Working Directory

- **Project Root:** [`/Users/kay/Documents/ecommerce-platform`](file:///Users/kay/Documents/ecommerce-platform)
- **Architectural Vault (Read-Only):** [`/Users/kay/Documents/Arcfield-Vault/02 Products/E-Commerce Platform`](file:///Users/kay/Documents/Arcfield-Vault/02%20Products/E-Commerce%20Platform)

---

## 2. Completed Milestones

1. **Phase 0: Scaffolding & Setup (`a26895e`)**
   - Next.js 16.4.2 (App Router, Turbopack) + React 19.3.0 + TypeScript 5.9.3 + Tailwind CSS v4.
   - Pinned Prisma ORM `6.19.3` to match TRD specifications.
   - Security and utility libraries installed (`jose`, `bcryptjs`, `zod@4.6.7`, `@tanstack/react-query`, `zustand`, `motion`, `lucide-react`, `next-themes`, `@supabase/ssr`, `@supabase/supabase-js`).

2. **Phase 1: Relational Schema & Supabase Setup (`711a02d`)**
   - Active Supabase Project: `ecommerce-platform` (ID: `yuavqptzlwbjyfhsqauw`, Region: `eu-west-1`).
   - Connection string uses dedicated PostgreSQL pooler user `prisma_user` with `BYPASSRLS`.
   - Monetary precision `@db.Decimal(12, 2)` across `Product.price`, `OrderItem.unitPrice`, `Order.totalAmount`.
   - Historical price snapshotting in `OrderItem.unitPrice`.
   - Soft-delete pattern `Product.isArchived` preventing referential integrity failures.
   - Realtime CDC publication enabled on `public.Product`.
   - Deterministic seed script with 3 users, 5 categories, 10 products, and 2 initial orders.

3. **Phase 2: Security & Utility Pipeline (`2da6aaf`)**
   - Cached global Prisma singleton ([`src/lib/prisma.ts`](file:///Users/kay/Documents/ecommerce-platform/src/lib/prisma.ts)).
   - Standardized API response envelopes & masked errors ([`src/lib/api-response.ts`](file:///Users/kay/Documents/ecommerce-platform/src/lib/api-response.ts)).
   - Sliding-window in-memory rate limiter ([`src/lib/rate-limiter.ts`](file:///Users/kay/Documents/ecommerce-platform/src/lib/rate-limiter.ts)).
   - Strict Zod schemas with price-stripping ([`src/lib/validations/`](file:///Users/kay/Documents/ecommerce-platform/src/lib/validations)).
   - JWT session management via `jose` with `HttpOnly` cookies and CWE-290 test bypass guard restricted to `NODE_ENV !== "production"` ([`src/lib/auth-check.ts`](file:///Users/kay/Documents/ecommerce-platform/src/lib/auth-check.ts)).
   - Atomic transaction pipeline ([`src/lib/transactions.ts`](file:///Users/kay/Documents/ecommerce-platform/src/lib/transactions.ts)).
   - Next.js 16.4 proxy convention ([`src/proxy.ts`](file:///Users/kay/Documents/ecommerce-platform/src/proxy.ts)).

4. **Phase 3: REST API & Automated Verification (`ad80411`)**
   - 9 complete endpoints covering Auth, Catalog, and Orders.
   - 30 / 30 automated integration tests passing across AC-1 through AC-8 ([`tests/api.test.mjs`](file:///Users/kay/Documents/ecommerce-platform/tests/api.test.mjs)).

5. **Phase 4: 120 FPS Motion Storefront & Admin (`967bdd4`, `4128ffe`, `942d11a`)**
   - Storefront homepage ([`src/app/page.tsx`](file:///Users/kay/Documents/ecommerce-platform/src/app/page.tsx)) with category filtering, search dock, and product cards.
   - Cart slide-over drawer with Zustand persistence ([`src/store/use-cart-store.ts`](file:///Users/kay/Documents/ecommerce-platform/src/store/use-cart-store.ts)).
   - Kinematic 4-step checkout wizard modal with server-side validation.
   - Customer Order Ledger ([`src/app/orders/page.tsx`](file:///Users/kay/Documents/ecommerce-platform/src/app/orders/page.tsx)).
   - Admin Inventory Management Console ([`src/app/admin/page.tsx`](file:///Users/kay/Documents/ecommerce-platform/src/app/admin/page.tsx)).
   - Auth Gateway ([`src/app/login/page.tsx`](file:///Users/kay/Documents/ecommerce-platform/src/app/login/page.tsx)).
   - 120 FPS UI primitives: Tabular counter, Hold-to-confirm button, Offline HUD, Search dock, Scroll-to-top sentinel, Circular ripple theme toggle.
   - Unsplash CDN optimization to prevent upstream proxy timeouts.

---

## 3. Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@ecommerce.com` | `AdminPass123!` |
| **Customer** | `customer@ecommerce.com` | `CustomerPass123!` |
| **Evaluator** | `evaluator@ecommerce.com` | `EvaluatorPass123!` |

---

## 4. How to Resume Work

### Start Development Server
```bash
npm run dev
# Or run production build
npm run build && npm run start
```
Accessible at: `http://localhost:3000`

### Run Automated Acceptance Tests
```bash
npm test
```

### Database Maintenance
```bash
# Push schema changes to Supabase
npx prisma db push

# Reseed test data
npm run db:seed

# Full reset
npm run db:reset
```

---

## 5. Upcoming Roadmap / Tweaks for Future Sessions

1. **Checkout & Payments:**
   - Real or mock Stripe Elements integration with webhook handling.
   - Email dispatch simulator or PDF order receipt generation.
2. **Catalog Refinements:**
   - Multi-image gallery on product detail modals.
   - Sorting by price, popularity, and stock availability.
3. **Admin Enhancements:**
   - Image upload pipeline directly into Supabase Storage bucket.
   - Low-stock notification badges and inventory batch edit.
4. **DevOps & CI/CD:**
   - GitHub Actions workflow (`.github/workflows/ci.yml`) running `npm run build` and `npm test`.
