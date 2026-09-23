# Midnight Feast — Gourmet Late-Night Dining Application

A production-grade, full-stack late-night restaurant application built strictly according to the **37 Midnight Feast Restaurant Business Rules**.

---

## Key Highlights

- **37 Business Rules Implemented**: All rules are implemented across PostgreSQL constraints, Row Level Security (RLS) policies, trusted server-side stored procedures, React components, staff/admin portals, and automated tests.
- **Operating Hours Across Midnight**: Default schedule **6:00 PM – 2:00 AM** (18:00 to 02:00).
- **Authoritative Server Pricing**: Client totals are never trusted. The trusted PostgreSQL order creation procedure recalculates:
  $$\text{Subtotal} \to \text{Discount} \to \text{Tax} \to \text{Delivery Fee} \to \text{Final Total}$$
- **Customer Cancellation Lockdown**: Customers can cancel only when the order is strictly in `Pending` status. Once preparation starts, cancellation is locked.
- **Role-Based Security**: Complete separation of privileges for **Customer**, **Staff**, and **Admin**.
- **Idempotency & Double-Click Prevention**: Guarantees zero duplicate orders on network retries or repeated button presses.
- **Dual Mode**: Connects seamlessly to remote Supabase via environment variables or runs with built-in reactive local persistence for offline development.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React icons, Vite
- **Backend & Database**: PostgreSQL, Supabase, Row-Level Security (RLS), Stored Procedures & Triggers
- **Testing**: Vitest automated test suite

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Test Suite
```bash
npm test
```
Runs 17 automated tests verifying business hours, pricing recalculations, minimum order constraints, free delivery thresholds, coupon validation, and cancellation rules.

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```

---

## Database Migrations & Supabase Setup

The database schema and policies are defined in:
- `supabase/migrations/20260923000001_midnight_feast_schema.sql`
- `supabase/seed.sql`

To apply to your Supabase project:
```bash
# Optional: Link to your remote Supabase project
supabase link --project-ref <your-project-ref>
supabase db push
```

To configure live Supabase credentials, create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## Built-in Role Simulator

The header includes an interactive role switcher to test and demonstrate all 3 roles:
- **Customer**: Aarav Patel (Orders, Favorites, Tracking, Reviewing, Address management)
- **Staff**: Chef Marco Rossi (Live order pipeline, Kitchen status transitions, Reservations, Quick availability toggle)
- **Admin**: Elena Vance (Global settings, Menu CRUD, Order refunds, Review moderation, Audit logs)

---

## Complete Rule Cross-Reference

Refer to [BUSINESS_RULES_IMPLEMENTATION.md](file:///c:/Users/lagud/OneDrive/Desktop/mid/BUSINESS_RULES_IMPLEMENTATION.md) for the complete 1:1 cross-reference mapping of all 37 rules.
