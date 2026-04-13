# KIIT Washing Machine Management System

A full-stack web application designed for hostel/living-campus operations to streamline washing machine usage through authenticated booking, time-slot control, and QR-based machine start flow.

This project demonstrates practical product thinking, clean UI/UX, and real-world backend rule enforcement for shared resource management.

---

## Project Overview

The KIIT Washing Machine Management System helps students:

- Register and sign in securely
- View available washing machines
- Book machines in valid time slots
- Start sessions by scanning machine QR codes
- Track active bookings and remaining wash credits
- Reset passwords via secure email flow

For operations, it reduces conflicts and manual coordination by enforcing booking policies at the API layer.

---

## Key Highlights (HR-Friendly)

- **Real-world problem solving:** Handles scheduling conflicts for shared resources
- **Full-stack ownership:** Built with modern frontend + backend architecture
- **Authentication-first design:** JWT and Google OAuth (KIIT domain restricted)
- **Business rules implementation:** Floor-wise allowed booking days and fixed wash duration enforcement
- **Production-minded setup:** Environment-based config, MySQL integration, SSL-ready database support

---

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- NextAuth (Google sign-in)

### Backend
- Node.js + Express
- Sequelize ORM
- MySQL (Aiven-compatible)
- JWT authentication
- Nodemailer (password reset email)

---

## Repository Structure

```text
KIIT-WASHING-MACHINE/
├── frontend/   # Next.js client application
└── backend/    # Express + Sequelize API server
```

---

## Core Features

### 1) Authentication & User Management
- Email/password registration and login
- Google sign-in restricted to `@kiit.ac.in`
- Current user profile fetch
- Password reset request + reset completion

### 2) Machine Booking Workflow
- Fetch machine availability/status
- Book slot with policy validation:
  - Allowed booking window: 10 AM to 6 PM (IST)
  - Fixed slot duration: 55 minutes (45 wash + 10 buffer)
  - Floor-based allowed booking days
  - Previous-day timing restriction handling
- Prevents overlapping bookings on same machine

### 3) Session Start & Tracking
- Start machine by scanning QR flow (`/scan/[machineId]`)
- Active booking retrieval for dashboard
- Wash credit deduction per successful booking

---

## Local Setup

### Prerequisites
- Node.js (LTS recommended)
- npm
- MySQL database (or Aiven MySQL)

### 1) Clone & Install

```bash
# frontend
cd frontend
npm install

# backend
cd ../backend
npm install
```

### 2) Backend Environment (`backend/.env`)

```env
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_SSL=true

JWT_SECRET=your-jwt-secret
PORT=5000
NODE_ENV=development

FRONTEND_URL=http://localhost:3000

EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-app-password
```

### 3) Frontend Environment (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### 4) Initialize Database (optional but recommended first run)

```bash
cd backend
npm run init-db
```

### 5) Run the App

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

Frontend: `http://localhost:3000`  
Backend health check: `http://localhost:5000/api/health`

---

## Available Scripts

### Backend
- `npm run dev` – start backend with nodemon
- `npm start` – start backend in normal mode
- `npm run init-db` – initialize database tables and seed defaults

### Frontend
- `npm run dev` – start Next.js dev server
- `npm run build` – production build
- `npm run start` – run production build
- `npm run lint` – run linter
- `npm run type-check` – TypeScript check

---

## API Surface (High-Level)

Base: `/api/users`

- `POST /register`
- `POST /login`
- `POST /check-email`
- `GET /me`
- `GET /washes-left`
- `POST /book`
- `GET /bookings/active`
- `POST /start/:machineId`

Global:
- `GET /api/health`

---

## Notes

- Backend includes an Aiven setup guide at:
  - `backend/AIVEN_SETUP.md`
- CORS is configured via `FRONTEND_URL`
- SSL support is configurable through `DB_SSL`

---

## Author

Developed as a practical full-stack system for campus resource management use cases.
