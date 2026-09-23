# ACME Workforce Compensation & Salary Manager

> High-performance employee compensation management, auditable salary revision engine, and executive cashflow payroll analytics platform built for an enterprise workforce of 10,000 employees across 7 global jurisdictions.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.18-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg)](https://www.docker.com/)

---

## 🎯 Executive Overview

ACME Salary Manager transitions organizational compensation management away from fragile, error-prone spreadsheets into a centralized, auditable, high-performance web platform. Tailored specifically for the **HR Executive & Compensation Director** persona, the system balances day-to-day employee salary administration with high-level workforce cashflow analytics and monthly payroll obligations.

### 🌟 Core Capabilities
* **10,000-Employee Global Directory**: Server-side paginated directory with sub-millisecond query performance, multi-parameter faceted filtering (country, department, status, currency, minimum salary), and debounced search.
* **Dual Annual & Monthly Salary Views**: Immediate visibility into annual base compensation alongside monthly gross pay across all employee tables and dossiers.
* **12-Month Historical Monthly Payout Ledger**: Comprehensive disbursement timeline showing exact monthly salaries paid to each employee over the past 12 months, with `PAID` / `SCHEDULED` status tags and compensation basis.
* **Next-Month Total Payroll Cashflow Forecast**: Real-time projection of monthly gross payroll liabilities aggregated across all 7 operational currencies (USD, EUR, GBP, CAD, AUD, INR, SEK, NOK) directly on the executive analytics dashboard.
* **Atomic Compensation Adjustments**: Temporal compensation revision engine with automatic closure of prior salary records, overlap prevention, reason tracking, and immutable audit logs.
* **Executive Workforce Analytics**: Real-time KPI summary, department compensation vs. headcount density, change reason distributions, and regional compensation tables.
* **Pure Redux Architecture**: Zero side-effects in reducers; session token persistence is orchestrated entirely through `createListenerMiddleware`.

---

## 📐 Architecture & System Design

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer (Vite + React 18)        │
│  • Material UI (MUI v5) High-Density Enterprise Interface   │
│  • Redux Toolkit + Pure authSlice + authListenerMiddleware  │
│  • RTK Query Server-State Caching with Tag Invalidation     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON REST (Port 5174 /api reverse-proxy)
┌──────────────────────────────▼──────────────────────────────┐
│                    Modular Express API                      │
│  ├── /api/auth       (JWT authentication, session verify)   │
│  ├── /api/employees  (Faceted search, pagination, dossiers) │
│  ├── /api/salaries   (Atomic adjustments, audit ledger)     │
│  └── /api/analytics  (Workforce KPIs, regional run-rate)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Connection Pool (Prisma Client)
┌──────────────────────────────▼──────────────────────────────┐
│                     Persistence Layer                       │
│  PostgreSQL 16 Engine                                       │
│  • 10,000 employees & 17,458 historical salary records      │
│  • Decimal(12, 2) monetary precision                        │
│  • Composite indexes: (status, country_id, dept_id), etc.   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Docker Orchestration)

The entire production stack (PostgreSQL, Express API, and React Web via Nginx) is orchestrated via Docker Compose:

```bash
# 1. Clone repository
git clone https://github.com/chetanladumor/acme-salary-manager.git
cd acme-salary-manager

# 2. Launch production containers
docker compose up -d --build

# 3. Seed deterministic 10k workforce (if not already seeded)
npm run db:seed --workspace=@acme/api
```

### Access Points & Credentials
* **Web Application**: [http://localhost:5174](http://localhost:5174)
* **API Server**: [http://localhost:5001](http://localhost:5001)
* **Default HR Admin Credentials**:
  * Email: `hr@acme.com`
  * Password: `Admin#Pass2026!`

---

## 💻 Local Development Setup

```bash
# Install root monorepo dependencies
npm install

# Start local PostgreSQL container (if running natively)
docker compose up -d postgres

# Push Prisma schema and generate types
npm run db:push --workspace=@acme/api
npm run db:generate --workspace=@acme/api

# Seed deterministic dataset (10,000 employees in ~2.2s)
npm run db:seed --workspace=@acme/api

# Run automated tests (33 passing unit/integration tests)
npm run test --workspaces

# Start backend & frontend in development mode
npm run dev --workspaces
```

---

## 🎬 Video Demo

> 📺 **Demo Video**: *(Add Loom/video link here after recording)*

---

## 📊 Analytics & Next-Month Payroll Cashflow

The platform computes **Total Cash Outflow Needed** for the upcoming pay cycle — the actual amount the company must fund from treasury (Net Pay + Tax/Benefits). Unpaid Leave (LOP) savings are surfaced separately as retained funds that never leave the company account.

| Operating Jurisdiction | Currency | Active Workforce | Cash Outflow Required | LOP Retained by Company |
| :--- | :---: | :---: | :---: | :---: |
| **United States** | USD | 1,402 | **$16,073,076** | +$199,148 |
| **Canada** | CAD | 1,431 | **$15,177,836** | +$184,846 |
| **United Kingdom** | GBP | 1,432 | **£10,372,625** | +£119,582 |
| **Germany** | EUR | 1,479 | **€10,961,994** | +€152,052 |
| **Sweden** | SEK | 1,437 | **102,880,660 SEK** | +1,560,415 SEK |
| **Norway** | NOK | 1,378 | **106,333,852 NOK** | +1,114,499 NOK |
| **India** | INR | 1,441 | **₹390,081,777** | +₹5,259,383 |

> 💡 **Cashflow Accounting**: `Cash Outflow = Net Direct Pay (to employees) + Tax & Benefits (to government/insurers)`. Unpaid Leave (LOP) is salary the company never pays — it stays in company accounts.

---

## 🧪 Test Suite & Quality Verification

Run unit, integration, and Redux purity tests across all workspaces:

```bash
npm run test --workspaces
```

* **`@acme/api` (22 tests)**:
  * Authentication, session validation, and unauthorized rejection tests
  * Employee search, multifaceted filtering, and pagination limits
  * Salary adjustment atomicity, audit logging, and temporal closure
  * Executive analytics KPIs and next-month payroll calculations
* **`@acme/web` (11 tests)**:
  * Pure Redux `authSlice` state transitions
  * Currency formatters, date formatters, and percentage calculators

---

## 📄 Engineering Artifacts

| Document | Description |
| :--- | :--- |
| [`docs/requirements.md`](docs/requirements.md) | Product requirements: goal, scope, deliberate exclusions & rationale |
| [`docs/architecture.md`](docs/architecture.md) | System architecture, data models, indexing strategy, payroll engine |
| [`docs/decisions.md`](docs/decisions.md) | Architecture Decision Records (ADRs) — 6 key design decisions |
| [`docs/tradeoffs.md`](docs/tradeoffs.md) | Engineering tradeoffs — 7 key decisions with options and rationale |
| [`docs/ai/prompts.md`](docs/ai/prompts.md) | AI-assisted engineering prompt log — intentional AI usage documentation |

---

## 🗺️ Completed Milestones

- [x] **Milestone 1**: Monorepo Architecture & TypeScript Configuration
- [x] **Milestone 2**: Relational Data Modeling & PostgreSQL Schema with Decimal precision
- [x] **Milestone 3**: High-Performance Database Indexing & Query Optimizations
- [x] **Milestone 4**: Sanitized Deterministic Seeding Engine (10,000 employees, 17,782 revisions in 2.24s)
- [x] **Milestone 5**: Secure Authentication API & Session Management (JWT, bcrypt, rate limiting)
- [x] **Milestone 6**: High-Throughput Employee Directory & Filter Engine
- [x] **Milestone 7**: Responsive React Enterprise Client & Pure Redux Architecture
- [x] **Milestone 8**: Atomic Compensation Adjustment Engine & Audit Logging
- [x] **Milestone 9**: Executive Analytics Dashboard, Monthly Pay Ledger & Cashflow Forecast
- [x] **Milestone 10**: Production Docker Orchestration, End-to-End Verification & Documentation
- [x] **Milestone 11**: Physical Payroll Disbursement Ledger (118,710 records) with Tax, LOP & Benefits
- [x] **Milestone 12**: Leave Management Engine — Quotas, History, Automated Loss of Pay Deductions
- [x] **Milestone 13**: Cashflow Accounting Fix — True Cash Outflow vs. Company-Retained LOP Savings
