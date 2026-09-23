# System Architecture & Technical Specifications

> ACME Workforce Compensation & Salary Manager Architecture Specification

---

## 1. Domain Entities & Database Schema

The core persistence model is maintained in PostgreSQL 16 managed via Prisma ORM:

### 1.1 User & Identity
* `User`: HR administrative staff accounts with email, hashed passwords (`bcrypt`), and roles (`HR_ADMIN`, `HR_MANAGER`).

### 1.2 Workforce Directory
* `Employee`: Core profile containing `employeeCode` (unique, e.g. `ACM-00001`), `firstName`, `lastName`, `email`, `department`, `jobTitle`, `country`, `countryCode`, `hireDate`, and `status` (`ACTIVE`, `ON_LEAVE`, `INACTIVE`).
* `Country`: Supported operational jurisdictions (`US`, `DE`, `GB`, `CA`, `SE`, `NO`, `IN`) and currencies (`USD`, `EUR`, `GBP`, `CAD`, `SEK`, `NOK`, `INR`).
* `Department`: Organizational divisions (`Engineering`, `Product`, `Design`, `Sales`, `Marketing`, `Finance`, `People`, `Operations`).

### 1.3 Compensation & Historical Ledger
* `SalaryRecord`: Temporal record of compensation:
  * `annualSalary`: Gross base salary with `Decimal(12, 2)` precision.
  * `currency`: Currency code matching jurisdiction.
  * `effectiveFrom`: Date when salary took effect.
  * `effectiveTo`: Nullable date when superseded (null indicates current active salary).
  * `reason`: Categorized business driver (`NEW_HIRE`, `ANNUAL_REVIEW`, `PROMOTION`, `MARKET_ADJUSTMENT`, `EQUITY_REBALANCE`).
* `AuditLog`: Immutable audit trail tracking every modification, the acting HR admin ID, previous payload, and new payload.

---

## 2. Temporal Invariant Preservation & Atomic Adjustments

To ensure compensation histories remain historically accurate without overlapping pay periods:

1. **Active Record Isolation**: Exactly one `SalaryRecord` per employee has `effectiveTo: null` at any given time.
2. **Atomic Transition**: When an adjustment is submitted:
   - The current active salary record is retrieved.
   - Within an atomic database transaction (`prisma.$transaction`), the existing active record's `effectiveTo` is updated to the new record's `effectiveFrom`.
   - The new salary record is inserted with `effectiveTo: null`.
   - An audit log entry is synchronously persisted with before/after state diffs.
3. **No Overlaps**: Strict date validation prevents adjustments with effective dates prior to the current active salary's effective date.

---

## 3. High-Performance Indexing Strategy

To maintain sub-15ms query execution times across 10,000 employees and tens of thousands of salary adjustments:

| Table | Index Columns | Index Type | Optimization Target |
| :--- | :--- | :--- | :--- |
| `employees` | `(status, country, department)` | Composite B-Tree | Multi-faceted filtered directory queries |
| `employees` | `employee_code` | Unique B-Tree | Instant single-employee dossier lookups |
| `salary_records` | `(employee_id, effective_to)` | Composite B-Tree | Fast resolution of current active salary (`effective_to IS NULL`) |
| `salary_records` | `(employee_id, effective_from DESC)` | Composite B-Tree | Reverse chronological salary timeline sorting |
| `salary_records` | `currency` | B-Tree | Aggregated cross-currency cashflow payroll forecasting |

---

## 4. Monthly Disbursement Engine & Payroll Forecasting

### 4.1 Employee Monthly Pay Ledger
For any selected employee, the API computes both their current monthly gross compensation:
$$\text{Monthly Salary} = \left\lfloor \frac{\text{Annual Salary}}{12} \right\rceil$$

And reconstructs a 12-month historical disbursement ledger by matching monthly payment dates (e.g. 28th of each calendar month) against the active compensation record in effect during that pay cycle.

### 4.2 Next-Month Payroll Cashflow Forecast
The analytics engine computes total next-month organizational payroll obligations for each operating currency:
$$\text{Next Month Total Payroll}_{\text{currency}} = \sum_{e \in \text{Active Employees}} \left\lfloor \frac{\text{Active Salary}_e}{12} \right\rceil$$

This guarantees that HR Executives and CFOs know their exact cash liquidity requirements per country and currency for the upcoming payroll run without imprecise cross-currency foreign exchange distortions.
