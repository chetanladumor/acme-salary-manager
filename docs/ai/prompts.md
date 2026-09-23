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

*(Additional prompts for API implementation, testing edge cases, and performance tuning will be appended as milestones progress)*
