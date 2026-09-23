# AI-Assisted Engineering Prompt Log

This document records the prompts, structured inquiries, and design reviews conducted with AI assistance during the development of the ACME Salary Manager. It demonstrates intentional AI usage focused on requirements analysis, architectural critique, code correctness, and testing rather than unconstrained code generation.

---

## Phase 0: Requirements & Edge-Case Discovery

### Prompt 01 — Milestone 0: Comprehensive Requirements Review
```text
Review the current requirements for the ACME salary management application.
Do not write code.

Identify:
1. Ambiguous requirements
2. Missing business rules
3. Data modeling risks
4. Scalability risks
5. Security considerations

Return recommendations only.
```

**Key Findings & Human Decisions Made**:
* *Finding*: "Answering questions about how the org pays people" could invite scope creep (e.g., chat LLM vs. deterministic aggregations).
  * *Decision*: Explicitly defined in `docs/requirements.md` that V1 delivers pre-computed, multi-dimensional compensation analytics segmented by country, currency, department, and role.
* *Finding*: Multi-country currency additions without an agreed FX policy produce false figures.
  * *Decision*: Established ADR 03 (Currency Isolation) to protect financial data integrity.
* *Finding*: 10,000 records will freeze the browser if rendered without pagination.
  * *Decision*: Enforced server-side cursor/offset pagination backed by PostgreSQL indexes.

---

## Milestone 1: Monorepo Architecture & TypeScript Configuration
*(Commit: `e8569fd` — scaffold fullstack monorepo with Express, React, and Docker orchestration)*

### Prompt 02 — Scaffold Fullstack Monorepo
```text
Scaffold a production-grade fullstack monorepo for an HR salary management app with:
- Backend: Node.js + Express + TypeScript in apps/api/
- Frontend: React 18 + Vite + TypeScript in apps/web/
- Shared root package.json with npm workspaces
- Docker Compose with: PostgreSQL 16, Express API container, React/Nginx container
- Prisma ORM connected to PostgreSQL
- ESLint + TypeScript strict mode configured in both workspaces

Use conventional commits. Do not add any business logic yet — only scaffold.
```

**Key Decisions Made**:
* Chose **npm workspaces** monorepo over Turborepo/Nx to keep zero-overhead simplicity for a 2-app project.
* Chose **Vite** over CRA — Vite's ESM-based dev server has near-instant HMR vs CRA's webpack cold starts.
* Chose **Nginx** as the production web server for the React SPA to serve static assets with compression and correct Content-Type headers.

---

## Milestone 2: Relational Data Modeling & PostgreSQL Schema
*(Commit: `be77852` — add employee, salary history, user, and audit log data models)*

### Prompt 03 — Design PostgreSQL Schema with Temporal Salary History
```text
Design the Prisma schema for the following entities:
- Employee: profile fields (name, email, department, jobTitle, country, hireDate, status)
- SalaryRecord: temporal salary history with effectiveFrom, effectiveTo (nullable), 
  annualSalary as Decimal(12,2), currency, reason
- User: HR admin accounts with email, hashed password, role
- AuditLog: immutable trail of every salary change with before/after payloads

Business rules to enforce in the schema:
- Only one active SalaryRecord per employee (effectiveTo IS NULL)
- annualSalary must be DECIMAL not FLOAT (financial precision)
- SalaryRecord must have foreign key to Employee (cascade delete)
- AuditLog must be append-only (no update operations)

Generate the schema.prisma and the migration.
```

**Key Decisions Made**:
* Used `@db.Decimal(12, 2)` for all monetary fields — eliminates floating-point rounding errors that would corrupt salary aggregations.
* `effectiveTo: null` pattern (vs. a boolean `isActive` flag) enables range queries like "what was this employee's salary on date X?" without additional logic.
* `AuditLog` stores full JSON blobs of `previousState` and `newState` — enables full rollback and forensic review without joining other tables.

---

## Milestone 3: High-Performance Database Indexing
*(Commit: `9ff8cc8` — fix types + indexing strategy)*

### Prompt 04 — Define Indexing Strategy for 10,000 Employees
```text
Given this schema with 10,000 employees and 17,000+ salary records, define composite
indexes to support the following query patterns with sub-15ms response times:

1. Employee directory: filter by status + country + department (most common)
2. Single employee lookup by employeeCode (e.g., ACM-00001)
3. Resolve current active salary: WHERE employeeId = ? AND effectiveTo IS NULL
4. Salary history sorted reverse-chronologically: ORDER BY effectiveFrom DESC
5. Cross-country payroll aggregate: GROUP BY currency

For each index: specify columns, index type (B-Tree/Hash), and the query it optimizes.
```

**Key Decisions Made**:
* `@@index([status, country, countryCode])` — composite B-Tree allows the DB to satisfy the three most common filter dimensions in a single index scan without a table heap fetch.
* `@unique` on `employeeCode` — automatic B-Tree unique index for O(log n) dossier lookups by code.
* `@@index([employeeId, effectiveTo])` on SalaryRecord — makes `WHERE effectiveTo IS NULL` efficiently resolve the active salary without a full table scan.

---

## Milestone 4: Deterministic 10,000 Employee Seeding Engine
*(Commit: `cff119d` — add deterministic 10k employee dataset with realistic compensation history)*

### Prompt 05 — Build Deterministic Bulk Seed Script
```text
Write a TypeScript seed script (apps/api/prisma/seed.ts) that generates:
- Exactly 10,000 employees across 7 countries (US, UK, DE, NO, SE, IN, CA)
- Realistic salary bands per country and role level (Junior/Mid/Senior/Lead/Manager)
- 1–3 historical salary records per employee showing realistic career progression
- Department distribution: Engineering 30%, Sales 20%, Product 15%, etc.
- Deterministic output — same data on every run (no random UUIDs for names)

Performance requirement: complete in under 5 seconds using batch inserts.
Strategy: use prisma.createMany() in chunks of 1,000 rows inside a transaction.

Do not use faker.js — generate data algorithmically from index-based lookup tables.
```

**Key Decisions Made**:
* Chose index-based algorithmic generation over `faker.js` — faker introduces non-determinism and package overhead; index lookups produce reproducible data.
* Batch size of 1,000 rows per `createMany` call — balances memory footprint and Prisma connection pool saturation. Sequential single-row inserts would take ~4 minutes for 10k employees.
* Seeded `User` (HR admin account) in the same script to guarantee login works immediately after seeding.

---

## Milestone 5: Authentication API & JWT Session Management
*(Commit: `48cc175` — add HR manager authentication, JWT middleware, and session endpoints)*

### Prompt 06 — Implement Secure JWT Authentication
```text
Implement authentication for the Express API:
- POST /api/auth/login — validate email + bcrypt password, return signed JWT
- GET /api/auth/verify — validate token, return current user session
- Middleware: authenticateToken — verify JWT on every protected route, attach user to req
- Rate limiting: max 10 login attempts per IP per 15-minute window

Security requirements:
- Passwords hashed with bcrypt (cost factor 12)
- JWT signed with HS256, 8-hour expiry
- Never return password hash in any API response
- 401 for invalid/expired tokens, 429 for rate limit exceeded

Write integration tests covering: valid login, wrong password, expired token, 
missing token, and verify endpoint.
```

**Key Decisions Made**:
* 8-hour JWT expiry balances a full working day session without forcing HR managers to re-login mid-shift, while not being indefinite.
* Rate limiting at the Express middleware layer (not DB layer) — `express-rate-limit` is stateless and adds zero DB overhead.
* Token stored in Redux + `localStorage` with a Redux Listener Middleware to handle persistence — avoids any global interceptor side effects in reducers.

---

## Milestone 6: Employee Directory API with Search, Filter & Pagination
*(Commit: `e438138` — add employee search, multi-faceted filtering, and pagination API)*

### Prompt 07 — Build High-Throughput Employee Search & Filter API
```text
Build GET /api/employees with:
- Server-side pagination: page + limit query params (default limit: 25)
- Multi-attribute search: match employeeCode, firstName+lastName, or email
- Faceted filtering: country, department, jobTitle, status, currency, minSalary
- Sorting: by name, department, hireDate (asc/desc)
- Each row must include: current active salary + monthly equivalent
- Response: { data: Employee[], total: number, page: number, limit: number }

Also build: GET /api/employees/facets — returns all distinct values for 
country, department, jobTitle, currency (for populating filter dropdowns)

Write tests for: pagination bounds, search by code, filter by country+department,
filter by currency+minSalary.
```

**Key Decisions Made**:
* `prisma.employee.findMany()` with `include: { salaryRecords: { where: { effectiveTo: null } } }` — single query resolves both employee and current salary, avoiding N+1.
* Debounced search implemented on the frontend (300ms) — reduces API calls from every keystroke to one call when the user pauses typing.
* `GET /api/employees/facets` as a separate endpoint — prevents the main paginated endpoint from running expensive `DISTINCT` aggregations on every page load.

---

## Milestone 7: React Enterprise UI — Employee Directory & Profile Drawer
*(Commit: `27ab650` — add employee directory, live filtering, and compensation profile drawer)*

### Prompt 08 — Build Enterprise-Grade Employee Directory UI
```text
Build the React frontend for the employee directory using Material UI (MUI v5):

1. Employee Directory Table:
   - Columns: Employee Code, Name, Department, Job Title, Country, Annual Salary, 
     Monthly Salary, Status, Hire Date
   - Server-side pagination with MUI TablePagination
   - Filter bar: search input (debounced), dropdowns for country/dept/status/currency,
     min salary input
   - Filter state persisted in URL search params (bookmarkable)

2. Employee Detail Drawer (slide-in panel):
   - Full profile header with avatar, name, code, department, status chip
   - Current salary card (annual + monthly)
   - Salary history timeline (chronological, showing all past records)
   - "Adjust Salary" button opening a modal form

State management: RTK Query for server state, URL params for filters, local state for modals.
Dark theme using MUI createTheme.
```

**Key Decisions Made**:
* Chose MUI `<Drawer>` over a separate route for employee detail — keeps the list visible behind the drawer, allowing HR to tab between employees without losing scroll position.
* URL search params for filter state — makes filter views bookmarkable and shareable between HR team members (e.g., "show all India engineers earning > ₹1,200,000").
* RTK Query tag-based cache invalidation — when salary is adjusted, the `['Employee', id]` tag is invalidated automatically and the drawer refreshes without a manual reload.

---

## Milestone 8: Atomic Compensation Adjustment Engine & Audit Logging
*(Commit: `1d36274` — add salary history management, atomic compensation adjustment API, and HR revision modal)*

### Prompt 09 — Implement Atomic Salary Revision with Audit Trail
```text
Build the salary adjustment endpoint: POST /api/employees/:id/salary

Business rules:
- Validate: annualSalary > 0, currency is valid ISO-4217, effectiveFrom is a valid date
- Reject if effectiveFrom <= current active salary's effectiveFrom (prevents backdating)
- Inside a single prisma.$transaction:
  1. Find current active SalaryRecord (effectiveTo IS NULL)
  2. SET effectiveTo = new effectiveFrom on the current active record
  3. INSERT new SalaryRecord with effectiveTo = null
  4. INSERT AuditLog entry with previousState + newState JSON blobs
- Return: new SalaryRecord + auditLogId

Also build the "Adjust Salary" modal in React with:
- Controlled form: annualSalary, currency (select), effectiveFrom (date picker), 
  reason (select: ANNUAL_REVIEW, PROMOTION, MARKET_ADJUSTMENT, EQUITY_REBALANCE)
- Client-side validation before API call
- RTK Query mutation with optimistic update

Write tests: reject negative salary, reject backdating, successful adjustment verifies 
audit trail and that previous record's effectiveTo was closed.
```

**Key Decisions Made**:
* `prisma.$transaction` wraps the close-old + insert-new operation atomically — if the new record insert fails, the old record's `effectiveTo` is not committed, preserving data integrity.
* `AuditLog` stores full JSON snapshots rather than field-level diffs — simpler to implement, allows reconstructing complete state at any historical point without complex diff merge logic.
* Reason codes are an enum (`ANNUAL_REVIEW`, `PROMOTION`, etc.) not free text — enables analytics on compensation change drivers without natural language parsing.

---

## Milestone 9: Executive Analytics Dashboard & Cashflow Forecast
*(Commits: `16054b4`, `21ce5ae` — add compensation analytics and monthly pay ledger)*

### Prompt 10 — Build Executive Analytics Dashboard
```text
Build GET /api/analytics/overview returning:
1. KPI Summary: totalHeadcount, activeHeadcount, onLeaveHeadcount, countriesCount, departmentsCount
2. Department breakdown: headcount + avgSalary + min/max per department
3. Country & currency breakdown: headcount + avgSalary + monthlyPayroll per country
4. Next-Month Payroll Forecast: sum of (annualSalary / 12) for all active employees, 
   grouped by currency — never mix currencies
5. Change reason distribution: count + percentage for each salary revision reason

Cache the result for 2 minutes (the data changes rarely and the query is expensive).

On the React side, build a dark-theme analytics dashboard with:
- KPI stat cards row
- Department distribution bar chart (using MUI LinearProgress, no external chart library)
- Country payroll cards grid
- Change reason donut-style breakdown
```

**Key Decisions Made**:
* 2-minute in-memory cache on the analytics endpoint — avoids recalculating aggregations over 10,000 employees + 17,000 salary records on every dashboard refresh, while remaining fresh enough for live HR use.
* Used MUI `LinearProgress` bars instead of a chart library (Chart.js, Recharts) — zero additional dependency for a visual that adequately communicates distribution data.
* Currency isolation enforced at the API level — `groupBy currency` ensures no cross-currency arithmetic occurs even if the frontend accidentally tries to combine them.

---

## Milestone 10: Production Docker Orchestration & Documentation
*(Commit: `e67a0bc` — complete Milestone 10 with README and architecture specification)*

### Prompt 11 — Docker Production Setup & Documentation
```text
Complete the production Docker setup:
1. apps/api/Dockerfile: multi-stage build — builder stage (tsc compile) + runner stage 
   (node:alpine with only production deps + compiled dist/)
2. apps/web/Dockerfile: multi-stage build — builder (vite build) + nginx:alpine runner
3. apps/web/nginx.conf: SPA routing (all routes → index.html), gzip compression, 
   static asset cache headers (1 year for /assets/*)
4. docker-compose.yml: postgres (with healthcheck) → api (depends_on postgres healthy) 
   → web (depends_on api)

Write a comprehensive README.md covering:
- Architecture diagram (ASCII)
- Quick Start (docker compose up -d --build, then seed)
- Local development setup
- Test suite commands
- All completed milestones
```

**Key Decisions Made**:
* Multi-stage Docker builds — production images contain only compiled output + runtime dependencies, not TypeScript compiler, dev dependencies, or source files. API image ~280MB → ~95MB.
* Nginx SPA routing (`try_files $uri $uri/ /index.html`) — ensures React Router client-side routes work correctly when accessed directly via URL without a 404.
* `depends_on: condition: service_healthy` — API container waits for PostgreSQL to pass its `pg_isready` healthcheck before starting, preventing connection errors on cold starts.

---

## Milestone 11: Physical Payroll Disbursement Ledger
*(Commits: `4af705f`, `46effce` — add PayrollDisbursement table and expandable payslip voucher)*

### Prompt 12 — Design Physical Payroll Disbursement Records
```text
We need to show each employee's 12-month payout history. Should we:

Option A: Compute on-the-fly — find active SalaryRecord for each month, calculate 
  monthlyGross = annualSalary / 12 at query time.

Option B: Persist physical PayrollDisbursement rows — store each monthly disbursement 
  as a real record with: grossSalary, taxDeduction (18-20%), otherDeductions (benefits 5%), 
  totalDeductions, netSalary, status (PAID/SCHEDULED), payoutDate.

Evaluate: which approach is correct for an enterprise HR platform that needs 
auditability and the ability to model per-cycle exceptions (leave deductions, bonuses)?

After deciding, implement the chosen approach including:
- Prisma model: PayrollDisbursement
- Seed script: generate 12 months × 10,000 employees = 120,000 disbursement records
- API: return last 12 disbursements in GET /api/employees/:id
- UI: expandable payslip in employee drawer showing gross → deductions → net breakdown
```

**Key Decisions Made**:
* Chose Option B (physical records) — on-the-fly computation cannot retroactively model historical leave deductions, tax bracket changes, or one-off adjustments. Enterprise HRIS systems (Workday, SAP) always persist disbursements.
* `status: PAID | SCHEDULED` — past months are `PAID`, upcoming month is `SCHEDULED`, enabling the cashflow forecast to query `WHERE status = 'SCHEDULED'` directly.
* Tax rate varies by jurisdiction (IN: 18%, US: 20%, DE: 25%, etc.) — stored at disbursement level, not derived at read time, because tax brackets can change.

---

## Milestone 12: Leave Management Engine — Quotas, History & Loss of Pay
*(Commit: `118afa2` — implement annual leave quotas, attendance history, and automated Loss of Pay salary deductions)*

### Prompt 13 — Design Leave Quota & LOP Deduction System
```text
We need to handle employee leave in payroll. Before writing code, discuss:

1. Where should leave quotas live — on Employee table or a separate LeavePolicy table?
2. Should leave history be its own table (EmployeeLeave) or derived from disbursements?
3. Formula for Loss of Pay (LOP) deduction rate?
4. How does unpaid leave taken in the current billing cycle affect the upcoming payroll?

Then implement:
- Employee model: add sickLeaveQuota/Balance (10), casualLeaveQuota/Balance (12), 
  annualLeaveQuota/Balance (15)
- EmployeeLeave model: leaveType (SICK/CASUAL/ANNUAL/UNPAID), startDate, endDate, 
  daysCount, isPaid, status (APPROVED), month, year
- Seed: 6,000+ leave records with realistic distribution
- LOP formula: dailyRate = round(monthlyGross / 22); leaveDeduction = unpaidDays × dailyRate
- Update PayrollDisbursement: add paidLeaveDays, unpaidLeaveDays, leaveDeduction fields
- UI: Leave Entitlement card in employee drawer with progress bars + leave history timeline
```

**Key Decisions Made**:
* Leave quotas on `Employee` model (not a separate policy table) — ACME has a single organization-wide leave policy. A policy table is over-engineered for V1; can be introduced in V2 if tiered entitlements are needed.
* 22 working days/month denominator — industry standard used by HR systems globally; avoids calendar-specific complexity (varies 20–23 days per month by year).
* `isPaid: true/false` on each leave record — determines at record time whether the leave uses quota (paid) or triggers LOP (unpaid), avoiding recalculation at payroll run time.

---

## Milestone 13: Cashflow Accounting Fix — True Cash Outflow vs. Company-Retained LOP
*(Commits: `ce20e32`, `b07f3a3` — align forecast cards and show correct cash outflow)*

### Prompt 14 — Correct Payroll Cashflow Accounting for Treasury Planning
```text
The "Next Month Payroll Cashflow Forecast" currently shows:
  Germany / EUR:
  - Gross Total Obligation: €11,114,046
  - Net Direct Pay: €7,627,518
  - Tax & Benefits: €3,334,476
  - ↳ Unpaid Leave (LOP): -€152,052

Question: Is it correct to show €11,114,046 as the "Total Obligation"?
Consider that the company retains the LOP amount — it never leaves the company's account.
Tax & Benefits DO leave (remitted to Finanzamt, pension funds).
What is the true "Total Cash Outflow Needed" from the company treasury?

Also: the 7 currency cards have uneven heights due to lg={1.71} fractional flex columns.
Fix the layout so all cards are identical height and width.

Update both the analytics.service.ts calculation and AnalyticsDashboard.tsx display.
```

**Key Decisions Made**:
* Primary metric changed from "Contract Gross" (€11.1M) to "Total Cash Outflow Needed" (€10.96M = Net Pay + Tax/Benefits). The €152K LOP difference is real money the company doesn't spend.
* `payableGrossMonthlyPayroll = grossMonthly - leaveDeductions` — new computed field in API.
* LOP displayed as `+Retained (Unpaid LOP)` in blue — visually communicates this is a positive for company treasury, not a deduction from the employee's perspective.
* Replaced `<Grid item lg={1.71}>` with `<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>` — CSS Grid guarantees all 7 cells are mathematically identical width regardless of content length.
* Analytics service now queries `payrollDisbursements WHERE status='SCHEDULED'` as source of truth instead of static deduction rate constants — real DB values, not approximations.
