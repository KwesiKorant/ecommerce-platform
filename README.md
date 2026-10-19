# Ecommerce — Precision Retail & Workspace Gear

[![Live Demo](https://img.shields.io/badge/Demo-ecom--nk.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://ecom-nk.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-23272f?style=for-the-badge&logo=react&logoColor=61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.19-2d3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-Supabase_Postgres-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

A high-performance, precision e-commerce platform built for high-end mechanical interfaces, studio audio hardware, and workspace ergonomics. Engineered with sub-100ms full-stack latency targets, zero layout-thrashing 120 FPS motion physics, atomic inventory transactions, and a borderless frosted-glass aesthetic.

🔗 **Live Deployment:** [https://ecom-nk.vercel.app](https://ecom-nk.vercel.app)

---

## Architecture & Technology Stack

| Layer | Technologies | Architectural Highlights |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | Turbopack compilation, Partial Prerendering (PPR), Edge middleware, React Server Components. |
| **Frontend & UI** | **React 19, Tailwind CSS v4** | Hardware-accelerated compositor-only styling, zero runtime CSS overhead, native view transitions. |
| **Motion Physics** | **Motion (Framer Motion v14)** | Critically damped spring physics (`stiffness: 400, damping: 28`), FLIP layout transitions, proximity transforms. |
| **State & Cache** | **Zustand, TanStack Query v5** | Persistent client cart with tabular animated counters, optimistic UI rollbacks, automated cache invalidation. |
| **Database & ORM** | **Prisma 6, PostgreSQL (Supabase)** | Transaction Connection Pooling (port 6543 / PgBouncer), atomic inventory decrementing, audit trail logging. |
| **Security & Auth** | **Jose, BcryptJS** | Stateless HTTP-only JWT cookie authentication, role-based access control (`ADMIN`, `CUSTOMER`). |

---

## Key Features

### 1. Fluid macOS-Style Mobile Floating Dock
- **Tactile Island Design**: Replaces conventional bottom bars with a floating capsule elevated above the mobile home indicator bar (`bottom-[max(0.75rem,env(safe-area-inset-bottom))]`).
- **Proximity Magnification**: Hardware-accelerated parabolic scale (`scale3d(1.25)`) and upward lift as touch or cursor slides across items, governed by critically damped spring physics.
- **macOS Active Dots & Tooltips**: Glowing state dots and floating micro-labels indicate active views (Catalog, Orders, Cart, Profile, Admin Console).

### 2. Cylindrical 3D Gear Showcase Ribbon
- **WebGL-Class CSS 3D Engine**: Cylindrical equipment carousel rendering perspective transformations (`rotateY`, `translateZ`) with momentum drag and inertia ticker.
- **Zero-Waste Viewport Culling**: Automatically halts requestAnimationFrame animation loops when scrolled off-screen via `IntersectionObserver`.

### 3. Intent-Debounced Instant Search Dock
- **Option 2 Desktop Expansion**: Scoped hover detection (120ms debounce) expands the search dock without invading the central navbar, avoiding accidental triggers when sweeping the cursor.
- **Keyboard Accelerators**: Global `/` and `⌘K` / `Ctrl+K` shortcuts instantly expand and focus the input.
- **Responsive Width Boundaries**: Auto-scales from `w-36` on mobile to `w-64` on desktop to prevent layout clipping.

### 4. Borderless Sticky Glass Navbar
- **GPU Backdrop Blur**: 16px hardware-accelerated translucent glass panel (`glass-panel`) blending seamlessly into catalog content with zero hard bottom divider line.
- **Minimalist Ghost Profile**: Circular ghost utility trigger matching the Theme Toggle, restoring visual prominence to the Shopping Bag primary CTA.

### 5. Atomic Inventory Checkout & Order Lifecycle
- **Multi-Step Checkout Wizard**: Shipping destination selector, express delivery methods, and atomic inventory lock.
- **Fulfillment State Machine**: Granular transitions (`PENDING` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`). Orders page defaults directly to active `PROCESSING` orders.
- **Customer Address Management**: CRUD interface for saved delivery addresses with default destination toggling.

### 6. Admin Backoffice & Realtime Audit Trail
- **Telemetry Overview**: Real-time sales volume, active processing order counters, and SKU inventory velocity.
- **Product Catalog Management**: Create, update, restock, and archive catalog entries with instant optimistic UI.
- **Tamper-Evident Audit Logging**: Chronological immutable log of every administrative mutation (inventory adjustments, status shifts, address modifications).

---

## Demo Credentials

The platform includes pre-seeded demo accounts for evaluation:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ecommerce.com` | `AdminPass123!` | Full backoffice, audit log inspection, product creation, order status manipulation |
| **Customer** | `customer@ecommerce.com` | `CustomerPass123!` | Saved addresses, order history, personal profile settings, cart checkout |
| **Evaluator** | `evaluator@ecommerce.com` | `EvaluatorPass123!` | Sandbox customer account for testing checkout and fulfillment flows |

---

## Motion & Performance Engineering Protocol

This codebase strictly adheres to the **Compositor-Only Mandate**:
- **Whitelisted Animation Properties**: Interactive micro-interactions, spring gestures, and scroll animations mutate strictly `transform` (`translate3d`, `scale3d`) and `opacity`.
- **Zero Layout Thrashing**: Never animates box-model dimensions (`width`, `height`, `margin`, `padding`, `box-shadow`).
- **DOM Boundary Isolation**: Uses CSS containment (`contain: layout style;`) on complex widgets and floating docks to eliminate parent re-layouts.
- **Reduced Motion Fallback**: Automatically degrades translational motion to subtle opacity fades when `@media (prefers-reduced-motion: reduce)` is enabled.

---

## Local Development Setup

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database (or free Supabase project)
- npm, pnpm, or yarn

### 1. Clone & Install
```bash
git clone https://github.com/<your-username>/ecommerce-platform.git
cd ecommerce-platform
npm install
```

### 2. Configure Environment Variables
Copy the provided `.env.example` file and configure your credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Supabase Postgres Connection Pooling (port 6543)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection for Migrations (port 5432)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase Public API Keys
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# JWT Secret
JWT_SECRET="your-secure-random-jwt-secret-at-least-32-chars"
NODE_ENV="development"
```

### 3. Initialize & Seed Database
Push the Prisma schema to PostgreSQL and populate catalog fixtures:
```bash
npm run db:setup
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront.

---

## Testing & Quality Assurance

Run the comprehensive API and transaction test suite:
```bash
npm test
```
Validates:
- User authentication, JWT issuance, and cookie handling
- RBAC middleware security (`ADMIN` vs `CUSTOMER` route barriers)
- Catalog search, category filters, and product retrieval
- Address mutations, validation schemas, and default selection rules
- Atomic inventory reservation, checkout transactions, and status state machine
- Admin audit log writes on state transitions

To run a production bundle verification:
```bash
npm run build
```

---

## Production Deployment (Vercel)

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project on [Vercel](https://vercel.com/new).
3. Set the Environment Variables from your `.env`:
   - `DATABASE_URL` *(Use the Supabase transaction pooler URL on port 6543 with `?pgbouncer=true`)*
   - `DIRECT_URL` *(Use the Supabase direct URL on port 5432)*
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET`
4. The deployment will automatically run `prisma generate` during `postinstall` and compile via Turbopack.

---

## License

Crafted for **Ecommerce Platform**. All rights reserved. Distributed under the MIT License.
