# ACME Salary Manager

> High-performance employee compensation management and executive pay analytics system designed for an organization of 10,000 employees across multiple global jurisdictions.

---

## 🎯 Executive Overview

ACME Salary Manager transitions organizational compensation management away from error-prone spreadsheets into a centralized, auditable, web-based platform. Tailored specifically for the **HR Manager** persona, the system balances day-to-day employee salary administration with high-level workforce compensation analytics.

### Core Capabilities
* **10,000-Employee Directory**: High-performance, server-side paginated directory with instant multi-parameter filtering (country, department, role, status) and debounced search.
* **Immutable Salary History**: Temporal compensation modeling preserving historical pay adjustments, effective date ranges, and business justification (merit, promotion, market adjustment).
* **Compensation Insights & Analytics**: Real-time compensation distribution metrics (minimum, median, maximum, average) segmented by country and currency without misleading cross-currency conversions.
* **Audit Trail**: Operational logging capturing who modified compensation records and why.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  React (TypeScript) + Redux Toolkit / RTK Query + Material UI│
│  • Virtualized table rendering & URL-driven query state     │
│  • RTK Query server-state caching & automatic invalidation  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST
┌──────────────────────────────▼──────────────────────────────┐
│                    Modular Monolith API                     │
│               Node.js + Express + TypeScript                │
│  ├── Modules: Auth | Employees | Salaries | Insights        │
│  ├── Domain Invariant Validation (No overlapping dates)    │
│  └── Centralized Error Handling & Structured Response Format│
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     Persistence Layer                       │
│             PostgreSQL + Prisma ORM (Type-Safe)             │
│  ├── Decimal(12, 2) Monetary Precision                     │
│  ├── Strategic Composite Indexes for Sub-15ms Queries       │
│  └── 10k Deterministic Seed Dataset                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Documentation & Engineering Artifacts

Every architectural decision and engineering tradeoff is documented in the [`docs/`](./docs) directory:

* [**Requirements Specification**](./docs/requirements.md): Goals, HR Manager user stories, in-scope features, and explicit out-of-scope justifications.
* [**Architecture Decision Records (ADRs)**](./docs/decisions.md): Tradeoff evaluations (Modular Monolith, Immutable History, Currency Isolation, RTK Query, Server-Side Pagination).
* [**AI-Assisted Engineering Log**](./docs/ai/prompts.md): Exact prompts and human engineering decisions made during AI-accelerated workflows.

---

## 🛠️ Technology Stack

| Layer | Technology | Selection Rationale |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Material UI | High-density financial enterprise UI, component accessibility, and strict type safety |
| **State & Cache** | Redux Toolkit (RTK Query) | Predictable server-state caching, automatic cache invalidation, minimal boilerplate |
| **Backend** | Node.js, Express, TypeScript | Modular routing, high I/O throughput, clear separation of concerns |
| **Database & ORM**| PostgreSQL, Prisma ORM | Relational integrity, temporal queries, composite indexing, strict schema migrations |
| **Testing** | Vitest, React Testing Library, Supertest | Fast execution, isolated domain invariant testing, and determinism |

---

## 🗺️ Roadmap & Incremental Milestones

- [x] **Milestone 1**: Requirements specification, Architecture Decision Records, and AI prompt audit log.
- [ ] **Milestone 2**: Monorepo workspace initialization, TypeScript configuration, and linting.
- [ ] **Milestone 3**: PostgreSQL schema, Prisma migrations, and 10,000-employee deterministic seed script.
- [ ] **Milestone 4**: Express modular API (Employees, Salaries with date-overlap invariants, and Insights).
- [ ] **Milestone 5**: React frontend with RTK Query and high-density employee directory.
- [ ] **Milestone 6**: Compensation Insights dashboard (distributions by country and department).
- [ ] **Milestone 7**: Automated test suite (domain unit tests, API tests).
- [ ] **Milestone 8**: Production deployment configuration and video demonstration.
