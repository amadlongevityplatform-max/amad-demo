# Amad demo (أمد)

Working demo of the Amad healthy-longevity platform: public website, member area and a role-based admin dashboard.
**Demo only. All health data is fictional. Do not store real health data on this deployment.**

## Stack
- Next.js 15 (App Router, JavaScript), server components and server actions
- PostgreSQL via `pg` (any Postgres works: Neon for the demo, AWS RDS / Azure Database for PostgreSQL in the UAE for production)
- Sessions stored in the database (httpOnly cookie), passwords hashed with bcrypt

## Environment variables
| Name | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `DEMO_PASSWORD` | no | Password for all seeded demo accounts. Default `Amad-Demo-2026` |

On first request the app creates its tables and seeds demo data automatically (see `lib/db.js`). No migration step is needed.

## Structure
- `public/site/index.html` public marketing site (served at `/`), waitlist posts to `/api/waitlist`
- `app/login` sign in
- `app/app/*` member area: dashboard, Mada score, simulated upload, reports, support
- `app/admin/*` dashboard. Roles:
  - `admin`: everything, including accounts, waitlist and audit log
  - `doctor`: member health records and the review queue
  - `support`: contact details and tickets only, no health data
- `lib/demo.js` illustrative marker definitions and the simulated report generator
- Every login, health-record view, review and account change is written to `audit_log`

## Moving to production (for the dev team)
1. Host app and database inside the UAE.
2. Replace `generateReport` (simulated) with real document parsing hosted in the UAE.
3. Replace demo seeding with real onboarding and consent, add MFA for staff, encryption at rest, backups and retention rules per UAE health data law.

## Run locally
```
npm install
DATABASE_URL=postgres://... npm run dev
```
