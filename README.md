# Hospital Management System (HMS)

## 🏥 Overview

A production-quality, full-stack Hospital Management System built with React + TypeScript + Vite (frontend) and Node.js + Express + Prisma + PostgreSQL (backend).

## 🚀 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router v6
- TanStack Query
- Zustand (state management)
- React Hook Form + Zod
- Framer Motion
- Recharts
- Lucide Icons

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT Authentication (access + refresh tokens)
- bcrypt password hashing
- Zod validation
- Helmet + Rate Limiting

## 📁 Project Structure

```
hms/
├── apps/
│   ├── frontend/     # React + Vite app (port 5173)
│   └── backend/      # Express API (port 5000)
└── package.json      # Monorepo root (npm workspaces)
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm 8+

### 1. Clone & Install
```bash
git clone <repo>
cd hms
npm install
```

### 2. Configure Backend
```bash
cd apps/backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Setup Database
```bash
cd apps/backend
npm run prisma:migrate
npm run prisma:seed
```

### 4. Start Development
```bash
# From monorepo root — starts both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Prisma Studio: `npm run prisma:studio` (from apps/backend)

## 🔐 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@123` |
| Staff | `staff` | `Staff@123` |

## 📡 API Documentation

Base URL: `http://localhost:5000/api/v1`

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /auth/login | Public |
| POST | /auth/refresh | Public |
| POST | /auth/logout | Auth |
| GET | /auth/me | Auth |
| PATCH | /auth/change-password | Auth |

### Patients
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /patients | Auth |
| GET | /patients/:id | Auth |
| POST | /patients | Admin |
| PATCH | /patients/:id | Admin |
| DELETE | /patients/:id | Admin |
| PATCH | /patients/:id/admit | Admin |
| PATCH | /patients/:id/discharge | Admin |

### Staff
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /staff | Auth |
| GET | /staff/:id | Auth |
| POST | /staff | Admin |
| PATCH | /staff/:id | Admin |
| DELETE | /staff/:id | Admin |

### Dashboard
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /dashboard/stats | Auth |
| GET | /dashboard/charts/admissions | Auth |
| GET | /dashboard/charts/staff-distribution | Auth |
| GET | /dashboard/activity | Auth |

### Reports (Admin only)
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /reports/patients | Admin |
| GET | /reports/staff | Admin |
| GET | /reports/admissions | Admin |
| GET | /reports/discharges | Admin |

## 🗄️ Database Schema

See `apps/backend/prisma/schema.prisma` for the full schema.

Models: `User`, `Patient`, `Staff`, `AuditLog`

## 🔒 Security Features

- JWT access tokens (15 min) + refresh tokens (7 days)
- bcrypt password hashing (12 rounds)
- Role-based access control (Admin / Staff)
- Helmet security headers
- Rate limiting (100 req / 15 min)
- Input validation with Zod
- SQL injection protection via Prisma ORM
- Soft deletes (no data is permanently lost)

## 📦 Environment Variables

### Backend (`apps/backend/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hms_db"
JWT_ACCESS_SECRET="your-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```
