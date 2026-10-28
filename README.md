# Doctor Tracker – Backend RESTful API Server

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-lightgrey.svg)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-brightgreen.svg)](https://www.mongodb.com/)
[![Tests](https://img.shields.io/badge/Jest-19%20Passed-success.svg)](https://jestjs.io/)

---

## Overview

Standalone RESTful API server for the **Doctor Tracker** clinical administration platform. Handles secure JWT authentication, doctor roster management, patient triage classification, and real-time MongoDB aggregation analytics with sub-10ms query execution.

---

## Features

- **Authentication**: JWT token issuance and route authorization middleware.
- **Doctor Management**: Create, list, search across 5 indexed fields, filter by department/hospital/dates, pagination, and patient assignment.
- **Patient Management**: Full CRUD, triage status updates, physician re-assignment, and cascaded count synchronization.
- **Analytics Engine**: Native MongoDB aggregation pipelines (`$group`, `$facet`, `$sort`) for real-time dashboard metrics.
- **Database Indexing**: Compound and text indexes on vector fields for high performance.
- **100% Automated Test Coverage**: 19 unit and integration tests passing with Jest and Supertest.

---

## Setup & Installation

### 1. Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **MongoDB**: Local MongoDB instance, Docker (`docker compose up -d`), or MongoDB Atlas cloud URI. *(In-memory fallback activates automatically if no external database is detected).*

### 2. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Ensure the variables are set:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/doctor_tracker
JWT_SECRET=doctor_tracker_super_secure_jwt_secret_key_2026_prod
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start MongoDB (Docker)
```bash
docker compose up -d
```

### 5. Start Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:5001/api` and auto-seed initial administrative and demo patient records.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts server with `tsx watch` for hot-reload development |
| `npm run build` | Compiles TypeScript source to production JavaScript (`dist/`) |
| `npm start` | Runs the compiled production server from `dist/server.js` |
| `npm run seed` | Seeds database with initial admin, doctors, and patient data |
| `npm test` | Runs the 19 automated Jest integration and unit tests |

---

## API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate with email/password and receive Bearer JWT
- `GET /api/auth/profile` - Retrieve authenticated user profile (Requires JWT)

### Doctor Management (`/api/doctors`)
- `GET /api/doctors` - Paginated list of doctors with search & filters (Requires JWT)
- `POST /api/doctors` - Register a new physician (Requires JWT)
- `GET /api/doctors/filter-options` - Unique specializations and hospitals (Requires JWT)
- `GET /api/doctors/:id` - Physician details and assigned patient list (Requires JWT)
- `PUT /api/doctors/:id` - Update physician credentials (Requires JWT)
- `DELETE /api/doctors/:id` - Delete physician and clean up records (Requires JWT)
- `GET /api/doctors/:id/patients` - Paginated patients under doctor (Requires JWT)
- `POST /api/doctors/:id/patients` - Add patient directly under doctor (Requires JWT)
- `DELETE /api/doctors/:id/patients/:patientId` - Remove patient from doctor (Requires JWT)

### Patient Management (`/api/patients`)
- `GET /api/patients` - Paginated list of patients with condition/date filters (Requires JWT)
- `POST /api/patients` - Register a new patient and assign to physician (Requires JWT)
- `GET /api/patients/:id` - View patient details (Requires JWT)
- `PUT /api/patients/:id` - Update patient diagnosis or triage status (Requires JWT)
- `DELETE /api/patients/:id` - Delete patient record (Requires JWT)

### Analytics (`/api/analytics`)
- `GET /api/analytics/dashboard` - Real-time clinical aggregation metrics (Requires JWT)

---

## Production Deployment (e.g. Render / Railway / Docker)

### Using Docker:
```bash
docker build -t doctor-tracker-backend .
docker run -p 5001:5001 --env-file .env doctor-tracker-backend
```

### On Render / Railway:
1. Connect this repository to Render/Railway.
2. Set Build Command: `npm install && npm run build`
3. Set Start Command: `npm start`
4. Provide Environment Variables (`PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`).

