# 🏦 LoanFlow — Loan Management System

A production-quality, full-stack Loan Management System built with Next.js 15, Express.js, MongoDB, and JWT authentication. Features a complete borrower-to-closure loan lifecycle with role-based access control across 6 distinct roles.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment

**Backend** — copy `.env.example` to `.env`:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lms
JWT_SECRET=lms_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
NODE_ENV=development
```

**Frontend** — create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This creates 6 users with the following credentials:

| Role         | Email                         | Password       |
|--------------|-------------------------------|----------------|
| ADMIN        | admin@example.com             | Password@123   |
| SALES        | sales@example.com             | Password@123   |
| SANCTION     | sanction@example.com          | Password@123   |
| DISBURSEMENT | disbursement@example.com      | Password@123   |
| COLLECTION   | collection@example.com        | Password@123   |
| BORROWER     | borrower@example.com          | Password@123   |

---

### 4. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App starts on http://localhost:3000
```

Visit **http://localhost:3000** → auto-redirects to login.

---

## 📋 Feature Walkthrough

### Complete Borrower Flow

1. **Sign up** at `/auth/signup` (creates BORROWER account)
2. **Personal Details** — fill Full Name, PAN, DOB, Salary, Employment Mode
   - BRE runs on submit (both client and server)
   - Rejections: age < 23 or > 50, salary < ₹25k, invalid PAN, unemployed
3. **Upload Salary Slip** — PDF/JPG/PNG, max 5MB
4. **Loan Application** — drag sliders for amount (₹50k–₹5L) and tenure (30–365d)
   - Live SI calculation: `SI = (P × R × T) / (365 × 100)`
   - Total Repayment displayed in real-time
5. **Track Loan** — view status, timeline, payments, progress bar

### Operations Workflow

| Role | URL | Actions |
|------|-----|---------|
| SALES | `/ops/sales` | View registered users who haven't applied |
| SANCTION | `/ops/sanction` | Approve (→SANCTIONED) or Reject (→SANCTION_REJECTED) with reason |
| DISBURSEMENT | `/ops/disbursement` | Disburse sanctioned loans (→DISBURSED) |
| COLLECTION | `/ops/collection` | Record payments with UTR; auto-closes at full repayment |
| ADMIN | `/admin` | Full funnel stats, KPIs, pipeline visualization |

---

## 🔄 Loan State Machine

```
LEAD → APPLIED → SANCTIONED → DISBURSED → ACTIVE → CLOSED
                ↓                                    
           BRE_REJECTED                              
                ↓
         SANCTION_REJECTED
```

Invalid transitions are blocked by the state machine service on the backend.
Every transition is recorded in `LoanStatusHistory`.

---

## 🗄️ Database Schema

### Collections

| Collection | Purpose |
|------------|---------|
| `users` | Auth + role info for all 6 roles |
| `borrowerprofiles` | Personal details (PAN, DOB, salary, employment) |
| `loanapplications` | Core loan entity with full lifecycle fields |
| `documents` | Uploaded salary slip metadata |
| `payments` | UTR-linked payment records with uniqueness constraint |
| `loanstatushistories` | Audit trail of every status transition |

---

## 🔐 RBAC — Role Based Access Control

Enforced in **two layers**:

1. **Backend middleware** — `authenticate` + `authorize(...roles)` on every route
2. **Frontend** — layout guards redirect unauthorized users; UI only shows relevant modules

```
ADMIN        → all modules + admin dashboard
SALES        → /ops/sales only
SANCTION     → /ops/sanction only
DISBURSEMENT → /ops/disbursement only
COLLECTION   → /ops/collection only
BORROWER     → /borrower only
```

Unauthorized API requests return `403 Forbidden`.

---

## 📡 API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Get current user |

### Profile (BORROWER)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/profile` | Get my profile |
| POST | `/api/profile` | Create/update profile (runs BRE) |

### Documents (BORROWER)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/documents/upload` | Upload salary slip (multipart) |
| GET | `/api/documents` | List my documents |

### Loans
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/api/loans/apply` | BORROWER | Submit loan application |
| GET | `/api/loans/my` | BORROWER | My loan applications |
| GET | `/api/loans/applied` | SANCTION, ADMIN | Applied loans queue |
| PUT | `/api/loans/:id/sanction` | SANCTION, ADMIN | Approve or reject |
| GET | `/api/loans/sanctioned` | DISBURSEMENT, ADMIN | Sanctioned loans |
| PUT | `/api/loans/:id/disburse` | DISBURSEMENT, ADMIN | Disburse loan |
| GET | `/api/loans/active` | COLLECTION, ADMIN | Active loans |
| POST | `/api/loans/:id/payment` | COLLECTION, ADMIN | Record payment |
| GET | `/api/loans/:id` | All ops + borrower | Loan details + history + payments |

### Dashboard
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/dashboard/leads` | SALES, ADMIN | Registered non-applied users |
| GET | `/api/dashboard/stats` | ADMIN | Aggregate KPIs |

---

## 🏗️ Project Structure

```
lms/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # auth, upload
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── services/        # BRE, state machine, loan calc
│   │   ├── types/           # TypeScript types
│   │   ├── index.ts         # App entry point
│   │   └── seed.ts          # Database seeder
│   ├── uploads/             # Uploaded files (auto-created)
│   ├── .env.example
│   └── tsconfig.json
│
└── frontend/
    ├── app/
    │   ├── auth/login/      # Login page
    │   ├── auth/signup/     # Signup page
    │   ├── borrower/        # Borrower portal (multi-step)
    │   ├── ops/
    │   │   ├── sales/       # Sales leads dashboard
    │   │   ├── sanction/    # Sanction queue
    │   │   ├── disbursement/# Disbursement
    │   │   └── collection/  # Payment collection
    │   └── admin/           # Admin analytics dashboard
    ├── components/
    │   ├── layout/          # OpsLayout, BorrowerLayout
    │   └── ui/              # StatusBadge, KPICard, Modal, Pagination, LoanTimeline
    ├── lib/
    │   ├── api.ts           # Axios client + all API calls
    │   ├── auth-context.tsx # React auth context
    │   └── utils.ts         # Status config, formatters
    ├── types/               # TypeScript interfaces
    └── .env.local
```

---

## ✅ Testing Checklist

### Authentication
- [ ] Signup creates BORROWER account, redirects to borrower portal
- [ ] Login with wrong password → "Invalid email or password"
- [ ] Accessing protected route without token → 401
- [ ] Accessing wrong role route → 403

### BRE Validation
- [ ] Age < 23 → rejected with age message
- [ ] Age > 50 → rejected with age message
- [ ] Monthly salary < 25000 → rejected
- [ ] Employment = UNEMPLOYED → rejected
- [ ] Invalid PAN (e.g. "123") → rejected with format error
- [ ] Valid PAN (e.g. ABCDE1234F) + valid data → profile saved

### Loan Application
- [ ] Amount < 50000 or > 500000 → validation error
- [ ] Tenure < 30 or > 365 → validation error
- [ ] Live calculator updates as sliders move
- [ ] SI formula: `(P × R × T) / (365 × 100)` — verify with known values
- [ ] Duplicate application (active loan exists) → 409 error

### Sanction
- [ ] Approve → status moves to SANCTIONED
- [ ] Reject without reason → validation error
- [ ] Reject with reason → status SANCTION_REJECTED, reason stored
- [ ] History entry created for each transition

### Disbursement
- [ ] Can only disburse SANCTIONED loans
- [ ] Disbursement date stored
- [ ] Status moves to DISBURSED

### Collection
- [ ] Duplicate UTR → 409 error
- [ ] Amount > outstanding → validation error
- [ ] Amount ≤ 0 → validation error
- [ ] First payment: DISBURSED → ACTIVE
- [ ] Final payment (total paid ≥ total repayment): ACTIVE → CLOSED
- [ ] Closed loans cannot receive more payments

### RBAC
- [ ] SALES user cannot access /ops/sanction
- [ ] BORROWER cannot access /ops/sales
- [ ] API: SALES calling /api/loans/applied → 403
- [ ] ADMIN can access all modules

---

## 🎨 UI Design

- **Theme**: Dark fintech (Deep Navy `#0F172A`)
- **Accent**: Teal `#14B8A6`
- **Secondary**: Indigo `#6366F1`
- **Glassmorphism** cards with `backdrop-filter: blur`
- **Animated** status badges, progress bars, fade-in transitions
- **Loan Timeline** visual journey tracker
- **Live calc panel** with real-time interest calculation
- **Mobile-first** responsive layout

---

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens signed with secret, 7-day expiry
- Helmet.js HTTP security headers
- File upload: type whitelist (PDF/JPG/PNG), 5MB max
- RBAC enforced at both middleware and route level
- No sensitive data in JWT payload beyond userId/email/role
