# ACME Salary Manager — Requirements Specification

## 1. Executive Summary & Goal
ACME is an international organization with approximately 10,000 employees operating across multiple countries, departments, and roles. Currently, employee compensation is tracked in ad-hoc, siloed spreadsheets—resulting in human error, lack of auditability, security risks around sensitive PII/compensation data, and an inability to quickly answer fundamental organizational pay questions.

**Goal**: Build a secure, high-performance, web-based salary management system that enables the HR Manager to manage employee compensation and gain immediate, aggregate insights into how ACME pays its workforce.

---

## 2. Target User Persona
* **Role**: HR Manager / People Operations Lead
* **Key Needs**:
  * Rapidly locate any employee in a 10,000-person directory without pagination latency or UI freezes.
  * Review current salary and full, immutable salary history.
  * Record salary changes with effective dates and business justification.
  * Extract compensation metrics across countries, job titles, and departments to identify pay disparities and make informed budgeting decisions.

---

## 3. Product Scope & Functional Requirements

### 3.1. Employee Directory
* **Server-Side Pagination**: Efficient browsing through 10,000 employees with configurable page sizes (default: 25).
* **Multi-Attribute Search**: Debounced search matching employee ID, full name, or work email.
* **Faceted Filtering**: Filter by country, department, job title, and employment status (Active, On Leave, Terminated).
* **Multi-Column Sorting**: Sort by employee name, job title, department, or hire date.
* **Employee Profile View**: Summary of employee demographics and primary assignment details.

### 3.2. Compensation & Salary History Management
* **Current Compensation Snapshot**: Displays active annual gross salary, currency code (ISO-4217), and current effective date.
* **Immutable Salary History**: Chronological log of all past and current compensation adjustments.
* **Salary Revision Workflow**:
  * Add new compensation record with:
    * `annualSalary`: Gross annual compensation (precision decimal).
    * `currency`: Contract currency (e.g., USD, EUR, GBP, NOK, INR).
    * `effectiveFrom`: Date when the compensation takes effect.
    * `reason`: Business justification (e.g., *Annual Merit Review, Promotion, Market Adjustment, Equity Realignment*).
* **Domain Invariants & Business Rules**:
  * Salaries must be positive non-zero values.
  * Overlapping effective date ranges for an individual employee are strictly prohibited and enforced at the domain service layer.
  * Updating a salary does **not** overwrite previous records; it creates a new revision and automatically bounds the prior active record (`effectiveTo`).

### 3.3. Compensation Insights & Executive Analytics
* **Workforce Overview**: Total employee headcount, active employees count, and country count.
* **Headcount by Geography & Department**: Distribution breakdown across all operating regions.
* **Currency-Aware Salary Analytics**:
  * Minimum, maximum, median, and average salary segmented by **Country and Currency**.
  * Departmental and role-based salary distributions within specific currencies.
* **Currency Isolation Principle**:
  * Financial metrics are calculated and displayed strictly within each local currency. Monetary amounts across different currencies are never naively added together without an explicit foreign exchange conversion policy.

### 3.4. Deterministic 10,000 Employee Dataset
* **Realistic Distributions**: Realistic department headcounts, role hierarchies (Junior, Mid, Senior, Lead, Manager), and localized salary bands.
* **Multi-Country Coverage**: Realistic distribution across key ACME operating locations (e.g., United States, United Kingdom, Germany, Norway, Sweden, India, Canada).
* **Multi-Record History**: Seed data includes realistic career progression (1 to 3 historical salary adjustments for a subset of employees).
* **Deterministic Seeder**: Batch-inserted via database transactions to guarantee sub-5-second execution.

---

## 4. Deliberately Out of Scope (and Rationale)

| Excluded Feature | Engineering / Product Rationale |
| :--- | :--- |
| **Payroll Processing & Disbursements** | Gross salary tracking is a core HRIS function. Actual payroll processing (gross-to-net calculations, tax withholdings, direct deposits) requires regional banking integrations and specialized payroll engines (e.g., ADP, Gusto). |
| **Live FX / Multi-Currency Aggregation** | Exchange rates fluctuate continuously. Converting historical salaries using real-time spot rates distorts past compensation decisions. Without an agreed fiscal-year fixed budget rate table, naively converting currencies introduces misleading financial figures. |
| **Employee Self-Service Portal** | V1 specifically targets the HR Manager persona. Adding self-service introduces complex row-level permissioning and mobile responsiveness constraints without serving the core goal. |
| **Benefits, Equity & Bonus Tracking** | Restricting V1 to annualized base compensation guarantees data integrity and clean domain modeling before introducing complex vesting schedules and non-monetary perks. |
| **Free-Form LLM Natural Language Querying** | Financial analytics require exact, deterministic mathematical figures. Conversational AI interfaces risk hallucinating numbers on financial audits. Pre-computed, filterable BI aggregates provide 100% mathematical accuracy. |

---

## 5. Non-Functional & Quality Standards
* **Architecture**: Modular monolith with clear boundary separation (`auth`, `employees`, `salaries`, `insights`).
* **Performance**: Sub-100ms API response time on paginated and indexed queries across 10,000 records.
* **Type Safety**: End-to-end TypeScript from Prisma database models to frontend UI components.
* **Data Integrity**: PostgreSQL relational model with foreign key constraints and `DECIMAL(12, 2)` monetary columns to eliminate floating-point rounding errors.
* **Testability**: Fast, deterministic unit tests covering domain rules (e.g., overlapping salary rejection, pagination bounds) and API integration tests.
