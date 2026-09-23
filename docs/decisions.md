# Architecture Decision Records (ADRs)

## ADR 01: Modular Monolith vs. Microservices Architecture
* **Context**: The system manages 10,000 employees for an internal HR team.
* **Decision**: Adopt a clean **modular monolith** structure rather than a distributed microservices architecture.
* **Rationale**:
  * 10,000 records is well within the single-node capability of a relational database like PostgreSQL.
  * Microservices introduce distributed transactions, network latency, serialization overhead, and complex infrastructure (service meshes, distributed tracing) without any operational need at this scale.
  * Clear module boundaries (`employees`, `salaries`, `insights`, `auth`) ensure high cohesion and loose coupling, allowing individual services to be extracted in the future if organizational scaling requires it.

---

## ADR 02: Immutable Salary History vs. Overwriting Employee Salary
* **Context**: Employee salaries change due to promotions, cost-of-living adjustments, and market reviews.
* **Decision**: Separate `Employee` from `SalaryRecord`. Treat salary records as append-only historical entries with `effectiveFrom` and `effectiveTo` temporal boundaries.
* **Rationale**:
  * Overwriting an employee's salary destroys historical auditability and makes compensation trend reporting impossible.
  * Preserving records enables compensation progression analysis and ensures compliance with enterprise HR audit requirements.
  * Enforcing the invariant that an employee cannot have overlapping active salary periods is maintained directly in the domain service layer.

---

## ADR 03: Currency Isolation vs. Automatic Global Conversion
* **Context**: ACME operates across countries with distinct local currencies (USD, EUR, GBP, NOK, SEK, INR, CAD).
* **Decision**: Calculate and present salary metrics grouped strictly by country and currency. Do not naively convert and combine distinct currencies into a single global total.
* **Rationale**:
  * Combining amounts across currencies without an agreed-upon foreign exchange (FX) conversion policy (e.g., fixed annual budget rate vs. spot rate) yields misleading and legally invalid financial insights.
  * Currency isolation guarantees 100% mathematical integrity for HR compensation benchmarking within local talent markets.

---

## ADR 04: Server-Side Pagination, Filtering, and Indexing
* **Context**: The dataset consists of 10,000 employees, each potentially having multiple salary history records.
* **Decision**: Perform all search, filtering, sorting, and pagination on the PostgreSQL backend. The client requests data in bounded pages (e.g., 25 records).
* **Rationale**:
  * Transferring 10,000 full records over the wire generates multi-megabyte payloads, degrades mobile/laptop battery performance, and causes UI frame drops during DOM reconciliation.
  * B-tree indexes on `country`, `department`, `jobTitle`, `employmentStatus`, and composite indexes on `(employeeId, effectiveFrom)` guarantee sub-15ms response times directly from PostgreSQL.

---

## ADR 05: State Management Strategy (RTK Query + URL + Local State)
* **Context**: The web application requires data synchronization, filter persistence, and clean form management.
* **Decision**: Use **Redux Toolkit with RTK Query** strictly for server-state caching and request lifecycle management. Use **URL search parameters** for table filters/pagination, and **local React state** for forms/modals.
* **Rationale**:
  * Storing transient form inputs or modal toggles in a global Redux store introduces unnecessary boilerplate and re-renders.
  * Storing search and filter state in the URL makes views bookmarkable and shareable between HR team members.
  * RTK Query provides automatic request deduplication, cache invalidation on mutations (e.g., refetching employee compensation after an update), and built-in loading/error states.

---

## ADR 06: Deterministic Bulk Seeding Architecture
* **Context**: Assessment requires verifying the system with 10,000 employee records and associated salary histories.
* **Decision**: Implement a deterministic generator script executing chunked batch inserts (`createMany` in batches of 1,000) within transactional boundaries.
* **Rationale**:
  * Sequential single-row inserts via an ORM loop take several minutes and exhaust connection pools.
  * Chunked batch transactions complete in under 4 seconds while ensuring clean rollback in case of any constraint failure during local setup.
