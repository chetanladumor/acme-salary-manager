# Engineering Tradeoffs & Design Decisions

This document captures the key engineering tradeoffs encountered and resolved during the development of the ACME Salary Manager. Each decision is framed with the problem context, the options considered, the chosen approach, and the rationale.

---

## Tradeoff 01: Compute Payroll History On-The-Fly vs. Persist Physical Disbursement Records

### Problem
Every employee needs a visible 12-month payout history. Two approaches exist:

### Options Considered

| | **Option A: Compute On-The-Fly** | **Option B: Physical Disbursement Records** |
| :--- | :--- | :--- |
| **How** | For each month, find the active `SalaryRecord` and divide `annualSalary / 12` | Persist a `PayrollDisbursement` row per employee per month with gross, tax, deductions, net, status |
| **Accuracy** | Approximation — misses historical exceptions (leave, bonuses) | Exact — real values that were or will be disbursed |
| **Auditability** | None — history is recalculated and can change if salary records are edited | Full — immutable financial ledger, tamper-evident |
| **Performance** | O(n × 12) in-memory joins at query time | O(1) indexed DB read |
| **Extensibility** | Cannot model LOP deductions, partial months, or status tags | Supports `PAID`/`SCHEDULED` status, LOP, tax, benefits as first-class fields |

### Decision: **Option B — Physical Disbursement Records**

### Rationale
Enterprise HRIS systems (SAP SuccessFactors, Workday, ADP) all persist disbursements as immutable financial ledger entries — not derived calculations. The small storage cost (118,710 rows ≈ <50MB) is negligible compared to the correctness and auditability gain. Critically, once we introduced unpaid leave deductions, on-the-fly computation became impossible without persisting those per-cycle facts anyway.

---

## Tradeoff 02: Contract Gross Salary vs. Actual Cash Outflow in Payroll Forecast

### Problem
The "Next Month Total Payroll Cashflow Forecast" originally showed **Contract Gross** (total annual salary ÷ 12) as the primary figure for each currency. This is subtly misleading for finance and treasury.

### The Accounting Reality

```
Contract Gross (Germany):   €11,114,046   ← What employees would earn at 100% attendance
  - Unpaid Leave (LOP):       - €152,052   ← Forfeited by employees taking unpaid days
= Payable Gross (Outflow):  €10,961,994   ← What company actually owes
  - Tax & Benefits:           - €3,334,476 ← Remitted to govt/insurers (cash outflow)
= Net Direct Pay:             €7,627,518   ← Cash transferred to employees' accounts
```

### Key Insight
| Component | Where does the money go? | Is it a cash outflow? |
| :--- | :--- | :---: |
| Net Direct Pay | Employees' personal bank accounts | 🔴 **YES** |
| Tax & Benefits | HMRC / IRS / Finanzamt / Pension funds | 🔴 **YES** |
| Unpaid Leave (LOP) | **Stays in company treasury** | 🟢 **NO — Retained** |

### Decision
Show **Total Cash Outflow Needed** (`grossMonthly - leaveDeductions`) as the primary figure on each forecast card. The LOP amount is surfaced separately as a positive `+Retained` figure in blue, so treasury knows it does **not** need to fund that amount.

### Rationale
A CFO preparing the cash position for next month's payroll run needs to know the exact liquidity required, not a hypothetical contract obligation. The difference between showing €11.1M vs €10.96M for Germany represents €152K of unnecessary cash reservation — and across all 7 currencies, the LOP savings total ~₹5.2M + €152K + $199K + more.

---

## Tradeoff 03: Currency Isolation vs. Unified Global Payroll Total

### Problem
The analytics dashboard could show a single "Total Monthly Payroll" figure combining all 7 currencies.

### Options Considered

| | **Option A: Convert & Combine** | **Option B: Currency Isolation** |
| :--- | :--- | :--- |
| **How** | Apply spot FX rates and sum into a base currency (USD) | Show separate totals for USD, EUR, GBP, CAD, INR, SEK, NOK |
| **Simplicity** | One number is easy to read | Seven cards require more UI space |
| **Accuracy** | Spot rates fluctuate — historical salaries converted at today's rate are distorted | Each currency total is mathematically exact |
| **Legal risk** | Mixing currencies without a budget rate policy can violate IFRS/GAAP reporting standards | No FX risk — each jurisdiction's payroll is self-contained |

### Decision: **Option B — Currency Isolation**

### Rationale
ACME has no stated FX policy (spot rate? annual budget rate? fiscal year average?). Without that, converting INR salaries at today's USD rate and comparing against EUR salaries from 6 months ago produces a financially invalid number. Currency isolation ensures 100% mathematical integrity. The 7-card layout actually gives HR managers more actionable data — they can see each jurisdiction's cash position independently.

---

## Tradeoff 04: Modular Monolith vs. Microservices

### Problem
Should the system be architected as separate services (e.g., `employee-service`, `salary-service`, `analytics-service`) or a single, modular backend?

### Options Considered

| | **Modular Monolith** | **Microservices** |
| :--- | :--- | :--- |
| **Operational complexity** | Low — one process, one DB connection pool | High — inter-service communication, service discovery, distributed tracing |
| **Cross-entity transactions** | Native DB transactions (`prisma.$transaction`) | Distributed sagas or 2-phase commits |
| **Performance at 10k records** | Sub-15ms with indexes | Network hop overhead between services |
| **Team overhead** | Single deployment, single test suite | Separate CI pipelines, versioned APIs, contract testing |
| **Future scale** | Module boundaries allow service extraction later | Over-engineered for current scale |

### Decision: **Modular Monolith**

### Rationale
10,000 employees and 118,710 disbursement records is comfortably handled by a single PostgreSQL instance on commodity hardware. The bounded module structure (`/employees`, `/salary`, `/analytics`, `/auth`) means services can be extracted to microservices if ACME scales to millions of employees — without requiring a re-architecture today at unnecessary cost.

---

## Tradeoff 05: Scheduled Disbursement DB Query vs. Static Rate Calculation for Cashflow Forecast

### Problem
To forecast next-month payroll per currency, we need deduction amounts (tax, LOP). Two approaches:

### Options Considered

| | **Option A: Hardcoded Deduction Rates** | **Option B: Query SCHEDULED Disbursements** |
| :--- | :--- | :--- |
| **How** | `netMonthly = grossMonthly × (1 - DEDUCTION_RATES[countryCode])` | `GROUP BY currency WHERE status='SCHEDULED' SUM(gross, net, tax, leave)` |
| **Accuracy** | Approximation using static percentages (e.g., `IN: 0.23`, `DE: 0.30`) | Exact — reflects real per-employee calculations already committed |
| **LOP handling** | Cannot include — LOP is per-employee, per-cycle, not a fixed rate | Naturally included — LOP is already computed in disbursement records |
| **Jurisdictional variance** | Same rate applied to all employees in a country, ignoring seniority/bracket | Per-employee bracket-aware computations automatically aggregated |

### Decision: **Option B — Query SCHEDULED Disbursements** (with Option A as fallback)

### Rationale
The SCHEDULED disbursements table already has the correct, employee-specific payroll computations. Querying it with a single `groupBy + _sum` is a sub-10ms indexed aggregate — the most accurate and performant option simultaneously. Static rates remain as a graceful fallback for edge cases where no scheduled run exists yet.

---

## Tradeoff 06: Server-Side Pagination & Filtering vs. Client-Side

### Problem
The directory shows 10,000 employees. Should filtering and pagination happen in the browser or on the server?

### Options Considered

| | **Client-Side Filtering** | **Server-Side Pagination + Filtering** |
| :--- | :--- | :--- |
| **Initial load** | Transfer all 10,000 rows (~5–10MB JSON) | Transfer only 25 rows per page (~25KB) |
| **UI performance** | JavaScript filtering of 10k objects causes frame drops | Instant — DB index returns results in <15ms |
| **Search latency** | Instant once loaded | ~30ms round-trip for debounced searches |
| **Filter state sharing** | Filter state lives in memory — not shareable | URL search params — bookmarkable and shareable between HR staff |
| **Correctness** | Can show stale data from initial load | Always fresh from DB |

### Decision: **Server-Side Pagination & Filtering**

### Rationale
Loading 10,000 employee records (plus their salary data) on initial page load would generate multi-megabyte payloads, degrade battery on laptops, and cause noticeable DOM reconciliation lag. PostgreSQL composite indexes on `(status, country, department)` make server-side filtered queries return in under 15ms — objectively faster than any client-side JavaScript filter on 10,000 objects.

---

## Tradeoff 07: Leave Quotas — Employee Table vs. Separate Entitlement Config Table

### Problem
Where should annual leave quotas (`sickLeaveQuota: 10`, `casualLeaveQuota: 12`, `annualLeaveQuota: 15`) live?

### Options Considered

| | **Option A: Fields on Employee Table** | **Option B: Separate LeavePolicy / Entitlement Table** |
| :--- | :--- | :--- |
| **Simplicity** | Simple — one JOIN to get everything | Requires additional JOIN via employee → policy → quota |
| **Flexibility** | Individual overrides only — hard to apply org-wide policy changes | Policy changes cascade automatically to all employees on the policy |
| **Auditability** | Quota stored per employee, doesn't track who changed it or when | Policy table can have its own audit trail |
| **V1 scope** | Sufficient for a single-company HR tool | Over-engineered unless ACME has multiple leave tiers |

### Decision: **Option A — Fields on Employee Table** (V1)

### Rationale
ACME is a single organization with a standard leave policy. Individual quota fields on `Employee` serve the core requirement with zero additional complexity. If ACME introduces tiered leave policies (e.g., executives get 20 days annual vs. standard 15), the entitlement table can be introduced in V2 as a backward-compatible migration.
