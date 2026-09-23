# AI-Assisted Engineering Prompt Log

This document records the prompts, structured inquiries, and design reviews conducted with AI assistance during the development of the ACME Salary Manager. It demonstrates intentional AI usage focused on requirements analysis, architectural critique, code correctness, and testing rather than unconstrained code generation.

---

## Phase 0: Requirements & Edge-Case Discovery

### Prompt 01: Comprehensive Requirements Review
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

## Phase 1: Domain Modeling & Invariants

### Prompt 02: Relational Data Model & Temporal Invariants Review
```text
Review the proposed Employee, SalaryRecord, User, and AuditLog models.
Focus on:
- Normalization and foreign key constraints
- Salary history and effective dating
- Preventing overlapping salary periods
- Indexing strategy for 10,000 employees
- Query patterns for insights (country, department, role)

Do not generate code yet. Provide architectural evaluation and schema recommendations.
```

**Key Findings & Human Decisions Made**:
* *Finding*: Overwriting salary fields causes loss of historical career progression.
  * *Decision*: Designed `SalaryRecord` with `effectiveFrom`, `effectiveTo`, `annualSalary` (Decimal), and `reason`.
* *Finding*: Concurrency hazard when calculating overlaps if multiple HR users edit the same employee.
  * *Decision*: Encapsulated salary updates in a transactional service layer verifying date boundary invariants.
* *Finding*: Raw floats cause rounding errors in financial sums.
  * *Decision*: Specified `@db.Decimal(12, 2)` for all monetary fields.

---

## Phase 2: Payroll History & Disbursement Ledger

### Prompt 03: Should Payroll Disbursements Be Computed or Persisted?
```text
We need to show an employee's 12-month payout history. Two approaches:

Option A: Compute on-the-fly — for each month, find the active SalaryRecord at that
  date and calculate monthlyGross = annualSalary / 12.

Option B: Persist physical PayrollDisbursement rows — store each monthly disbursement
  as a real database record with gross, tax, deductions, net, and status fields.

Evaluate the tradeoffs: correctness, auditability, performance, future extensibility.
Which should we choose for an enterprise HR platform?
```

**Key Findings & Human Decisions Made**:
* *Finding*: On-the-fly computation cannot model historical exceptions — e.g., if an employee had 2 unpaid leaves in August, that deduction has no record after the fact.
  * *Decision*: Build a physical `payroll_disbursements` table. Each monthly pay cycle is a persisted, immutable financial record — exactly how real enterprise HRIS systems (SAP, Workday) operate.
* *Finding*: Physical records allow `PAID` vs `SCHEDULED` status to directly reflect real disbursement state, enabling accurate next-month cashflow forecasting from live database aggregates.
  * *Decision*: Seeded 118,710 disbursement records covering all 10,000 employees across 12 months, enabling analytics to query real payroll history rather than hypothetical calculations.

---

## Phase 3: Leave Management & Loss of Pay (LOP) Engine

### Prompt 04: Leave Quota & Deduction Design Discussion
```text
We need to handle employee leave in payroll. Design a system for:
- Paid leaves (sick, casual, annual) — employee uses from annual quota, no salary cut
- Unpaid leaves (Loss of Pay / LOP) — salary deduction for each working day missed

Questions:
1. Where should leave quotas live — on the Employee table or a separate config table?
2. Should leave history be its own table or derived from disbursements?
3. How should we calculate the daily deduction rate?
4. How does LOP affect the upcoming payroll cycle?

Discuss the design before writing any code.
```

**Key Findings & Human Decisions Made**:
* *Finding*: Leave quotas are employee-specific (a new hire vs. a 10-year employee may have different entitlements), so they should live on the `Employee` model as `sickLeaveQuota`, `casualLeaveQuota`, `annualLeaveQuota`.
  * *Decision*: Added quota + balance fields to `Employee`. Balance decrements when paid leave is approved.
* *Finding*: Leave history is a separate business concept from payroll. A leave taken may span two pay periods, and the deduction belongs to the specific pay cycle in which it was incurred.
  * *Decision*: Created `EmployeeLeave` table with `leaveType` (`SICK`, `CASUAL`, `ANNUAL`, `UNPAID`), `isPaid`, `daysCount`, `month`, `year` — linking leaves to specific pay cycles.
* *Finding*: The industry-standard daily rate formula uses 22 working days per month.
  * *Decision*: `dailyRate = Math.round(monthlyGross / 22)`, `leaveDeduction = unpaidDays × dailyRate`.

---

## Phase 4: Payroll Cashflow Accounting Correctness

### Prompt 05: Gross vs. Net vs. Cash Outflow — What Does the Finance Team Actually Need?
```text
In the "Next Month Total Payroll Cashflow Forecast" dashboard, we show:
- Gross Total Obligation: €11,114,046 (Germany)
- Unpaid Leave (LOP): -€152,052

The question: should the LOP deduction reduce the primary Gross figure?

Consider:
- Tax & Benefits remittance goes from the company account to govt/insurers
- Unpaid Leave is money the company NEVER pays out — it stays in company accounts
- What is the true "Total Cash Outflow Needed" from the company treasury?
```

**Key Findings & Human Decisions Made**:
* *Finding*: The contract-based gross (€11,114,046) overstates what the company actually needs to fund. It includes €152,052 that employees forfeited by taking unpaid leave — money the company retains.
  * *Decision*: Separate the cashflow into three distinct buckets:
    1. **Net Direct Pay** (→ employees' bank accounts): Cash Outflow 🔴
    2. **Tax & Benefits** (→ HMRC, IRS, Finanzamt, pension funds): Cash Outflow 🔴
    3. **Retained (Unpaid LOP)** (stays in company treasury): Cash Saved 🟢
* *Finding*: The primary number shown on the card should be the **Total Cash Outflow Required** (`payableGross = grossMonthly - leaveDeductions`), not the contractual base gross.
  * *Decision*: Updated analytics service to compute `payableGrossMonthlyPayroll` from live `SCHEDULED` disbursement aggregates. Updated UI to show "Total Cash Outflow Needed" with the LOP savings shown as a blue `+Retained` badge.
* *Finding*: Tax & Benefits also leave the company account (remitted to government authorities), so they are genuine cash outflows — unlike LOP which never leaves.
  * *Decision*: `deductionsMonthlyPayroll` field now stores only tax + benefits (genuine outflows), cleanly separated from LOP.

**Germany Verification (live database)**:
```
Contract Gross Base:  €11,114,046
Retained (LOP):        + €152,052  (stays with company)
Total Cash Outflow:   €10,961,994  ← PRIMARY figure shown
  → Net Direct Pay:   €7,627,518
  → Tax & Benefits:   €3,334,476
```

---

## Phase 5: Performance & UI Layout Engineering

### Prompt 06: Forecasting Cards — CSS Grid vs. MUI Fractional Columns
```text
We have 7 currency cards in the "Next Month Total Payroll Cashflow Forecast" section.
Currently using: <Grid item xs={12} sm={6} md={3} lg={1.71}>

The cards have uneven heights because:
1. 1.71 × 7 = 11.97, which doesn't divide cleanly into MUI's 12-column grid
2. Country names of different lengths cause text to wrap differently (e.g., "India" vs "United Kingdom")
3. MUI Grid items stretch to fill row height but Paper components inside do not

What is the cleanest fix? Consider: MUI Grid stretch vs. CSS Grid auto-track, 
height matching, and breakpoint behavior.
```

**Key Findings & Human Decisions Made**:
* *Finding*: MUI `<Grid item>` is a flexbox container. Fractional column values don't divide cleanly and cause row-break artifacts at intermediate screen widths.
  * *Decision*: Replace MUI Grid with a native CSS Grid via `<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)', xl: 'repeat(7, 1fr)' } }}>`. CSS Grid guarantees all cells in a row are identically sized regardless of content.
* *Finding*: `Paper` components inside Grid items don't stretch to match sibling heights unless explicitly set to `height: '100%'` with `display: 'flex'` and `flexDirection: 'column'`.
  * *Decision*: Applied `height: '100%'`, `display: 'flex'`, `flexDirection: 'column'`, `justifyContent: 'space-between'` to each card so header, numbers, and footers align horizontally across all 7 cards at any viewport width.

---

## Phase 6: Analytics Service — Scheduled Disbursements Integration

### Prompt 07: Source of Truth for Cashflow Forecast — Salary Records vs. Disbursements
```text
For the "Next Month Payroll Cashflow Forecast", we currently compute monthly payroll
by summing all active employee salaryRecords and dividing by 12.

Problem: This doesn't account for unpaid leave deductions already committed for
the upcoming pay cycle (recorded in payroll_disbursements WHERE status='SCHEDULED').

Two approaches:
A) Keep computing from salaryRecords + apply estimated deduction rates
B) Query the SCHEDULED payroll_disbursements directly for real gross, net, tax, leave

Which is more correct for an enterprise HR cashflow dashboard?
```

**Key Findings & Human Decisions Made**:
* *Finding*: Option A introduces double-approximation error — once when dividing annual salary by 12, and again when applying static deduction rate percentages that vary by jurisdiction.
  * *Decision*: Use Option B — `prisma.payrollDisbursement.groupBy({ by: ['currency'], where: { status: 'SCHEDULED' } })` with `_sum` of all monetary fields. This surfaces real values already computed from the exact same pay run that will be disbursed.
* *Finding*: The analytics service previously used hardcoded deduction rate constants (e.g., `IN: 0.23`, `DE: 0.30`), which are approximations that would diverge from actual payroll as HR applies adjustments.
  * *Decision*: These rates are now used only as a fallback when no `SCHEDULED` disbursements exist. The live database is always preferred as the source of truth.
