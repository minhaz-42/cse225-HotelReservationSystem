# Hotel Reservation System — AI-Powered Full-Stack Web Application

> **From console prototype to research-grade web platform.**  
> A modern, LLM-integrated hotel reservation system built with Node.js, Express, SQLite, and vanilla JavaScript — featuring natural-language booking, demand-based dynamic pricing, and vision-language model (VLM) support via Ollama.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![SQLite](https://img.shields.io/badge/Database-SQLite%20(sql.js)-blue)
![Ollama](https://img.shields.io/badge/LLM-Ollama%20(llama3)-purple)
![Tests](https://img.shields.io/badge/Tests-28%20passing-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [API Reference](#api-reference)
8. [LLM / VLM Integration](#llm--vlm-integration)
9. [Dynamic Pricing Engine](#dynamic-pricing-engine)
10. [Security](#security)
11. [Testing](#testing)
12. [Original C++ Prototype](#original-c-prototype)
13. [Research Context](#research-context)
14. [License](#license)

---

## Overview

This project evolves a CSE 225 C++ console-based Hotel Reservation System into a **full-stack web application** with AI capabilities. The original prototype handled user registration, room booking, and admin management via terminal I/O and flat files. The new system preserves every original feature while adding:

- **RESTful API** with role-based access control (JWT + bcrypt)
- **7-page responsive frontend** with Tailwind CSS
- **Local LLM integration** (Ollama) for natural-language booking, room recommendations, and analytics report generation
- **Vision-Language Model support** for room image analysis
- **Demand-based dynamic pricing** engine
- **SQLite database** (sql.js — pure WASM, zero native dependencies)
- **28 automated integration tests** (Jest + Supertest)

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend (public/)                    │
│  index.html · login · register · dashboard · booking     │
│  admin · chat-assistant                                  │
│  Tailwind CSS (CDN) · Vanilla JS modules                 │
└────────────────────────┬─────────────────────────────────┘
                         │ fetch()
┌────────────────────────▼─────────────────────────────────┐
│                  Express.js REST API                      │
│                                                          │
│  Middleware: JWT auth · rate-limit · helmet · CORS        │
│                                                          │
│  Routes                                                  │
│    /api/auth      → register, login, profile, password   │
│    /api/rooms     → list, availability, search            │
│    /api/reservations → book, cancel, history              │
│    /api/admin     → stats, manage reservations            │
│    /api/llm       → chat, book-intent, recommend,        │
│                     analytics-report, analyse-image       │
│                                                          │
│  Services                                                │
│    authService · roomService · reservationService         │
│    pricingService · analyticsService · ollamaService      │
│                                                          │
│  Models                                                  │
│    User · Room · Reservation                              │
└────────────┬───────────────────────────┬─────────────────┘
             │                           │
     ┌───────▼───────┐          ┌────────▼────────┐
     │  SQLite (WASM) │          │  Ollama API      │
     │  sql.js        │          │  localhost:11434  │
     │  5 tables      │          │  llama3 · llava   │
     └───────────────┘          └─────────────────┘
```

---

## Features

### Guest Features
- **Register & Login** — secure account creation with email, name, contact
- **Browse Rooms** — view all room types with amenities, ratings, capacity, pricing
- **Check Availability** — real-time availability for date ranges
- **Book Rooms** — create, view, and cancel reservations
- **AI Chat Assistant** — natural-language concierge powered by LLM
- **AI Quick-Book** — describe your needs in plain English, get instant booking suggestions
- **Upload Room Images** — VLM analyses photos and provides descriptions

### Admin Features
- **Dashboard** — occupancy & revenue statistics, recent reservations
- **Manage Reservations** — confirm, cancel, view all guest bookings
- **AI Analytics Reports** — LLM-generated natural-language business reports
- **Activity Logging** — all admin actions logged to `activity_log` table

### System Features
- **Dynamic Pricing** — prices adjust based on demand (1.0× / 1.15× / 1.35× multipliers)
- **Pricing History** — every price change recorded with timestamps and reasons
- **Rate Limiting** — configurable request throttling per IP
- **Health Check** — `GET /api/health` endpoint for uptime monitoring

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js |
| **Database** | SQLite via sql.js (pure WASM) |
| **Auth** | bcryptjs (12 rounds) + JSON Web Tokens |
| **LLM** | Ollama (llama3, llava) |
| **Frontend** | HTML5, Tailwind CSS (CDN), vanilla JS |
| **Testing** | Jest + Supertest |
| **Security** | Helmet, CORS, express-rate-limit |

---

## Project Structure

```
├── server/
│   ├── config/
│   │   ├── database.js          # sql.js wrapper (better-sqlite3 compatible API)
│   │   └── env.js               # centralised environment config
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── llmController.js
│   │   ├── reservationController.js
│   │   └── roomController.js
│   ├── database/
│   │   ├── schema.sql           # DDL for 5 tables + indexes
│   │   └── seed.js              # admin user + 5 room types
│   ├── middleware/
│   │   ├── auth.js              # JWT verify + role authorisation
│   │   ├── logger.js            # activity-log writer
│   │   └── validation.js        # field / email / date validators
│   ├── models/
│   │   ├── Reservation.js
│   │   ├── Room.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── llm.js
│   │   ├── reservations.js
│   │   └── rooms.js
│   ├── services/
│   │   ├── analyticsService.js
│   │   ├── authService.js
│   │   ├── ollamaService.js     # 5 LLM capabilities
│   │   ├── pricingService.js    # demand-based engine
│   │   ├── reservationService.js
│   │   └── roomService.js
│   └── index.js                 # Express entry point
├── public/
│   ├── css/styles.css
│   ├── js/
│   │   ├── admin.js
│   │   ├── api.js               # fetch() wrapper
│   │   ├── auth.js              # localStorage token mgmt
│   │   ├── booking.js
│   │   ├── chat.js              # VLM image-upload support
│   │   └── dashboard.js
│   ├── index.html               # landing page
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── booking.html
│   ├── admin.html
│   └── chat-assistant.html
├── tests/
│   ├── api.test.js              # 28 integration tests
│   └── postman_collection.json  # 13 sample API requests
├── cse 225 project/             # original C++ prototype (preserved)
│   ├── main.cpp
│   ├── Account.h
│   ├── HRS.h
│   ├── ReservationSystem.h
│   └── Sorted_roomprice.h
├── .env / .env.example
├── jest.config.js
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 (tested on v24)
- **Ollama** (optional — AI features degrade gracefully without it)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/cse225-project-HotelReservationSystem-using-c-.git
cd cse225-project-HotelReservationSystem-using-c-

# Install dependencies
npm install

# Copy environment template
cp .env.example .env        # edit .env if needed

# Seed the database (creates admin user + 5 room types)
npm run seed

# Start the server
npm start
```

Open **http://localhost:3000** in your browser.

### Default Admin Credentials

| Username | Password |
|----------|----------|
| `admin` | `hrsadmin2024!` |

### Ollama Setup (for AI features)

```bash
# Install Ollama (macOS)
brew install ollama

# Pull the text model
ollama pull llama3

# Pull the vision model (for image analysis)
ollama pull llava

# Ollama runs on http://localhost:11434 by default
```

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, get JWT |
| `GET`  | `/api/auth/profile` | JWT | Get current user |
| `PATCH`| `/api/auth/password` | JWT | Change password |

### Rooms

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`  | `/api/rooms` | — | List all room types |
| `GET`  | `/api/rooms/:id` | — | Room details |
| `GET`  | `/api/rooms/:id/availability` | — | Availability for date range |
| `GET`  | `/api/rooms/search` | — | Filter by capacity, price, dates |

### Reservations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/reservations` | JWT | Create reservation |
| `GET`  | `/api/reservations` | JWT | User's reservations |
| `GET`  | `/api/reservations/:id` | JWT | Reservation detail |
| `PATCH`| `/api/reservations/:id/cancel` | JWT | Cancel reservation |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`  | `/api/admin/reservations` | Admin | All reservations |
| `PATCH`| `/api/admin/reservations/:id/confirm` | Admin | Confirm reservation |
| `PATCH`| `/api/admin/reservations/:id/cancel` | Admin | Cancel reservation |
| `GET`  | `/api/admin/stats` | Admin | Dashboard statistics |

### LLM / AI

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/llm/chat` | JWT | Chat with AI concierge |
| `POST` | `/api/llm/book-intent` | JWT | Parse natural-language booking |
| `POST` | `/api/llm/recommend` | JWT | Room recommendation |
| `POST` | `/api/llm/analytics-report` | Admin | AI-generated business report |
| `POST` | `/api/llm/analyse-image` | JWT | VLM room image analysis |

### Utility

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`  | `/api/health` | — | Server health + uptime |

---

## LLM / VLM Integration

The system integrates with **Ollama** running locally to provide five AI capabilities:

### 1. Chat Concierge (`/api/llm/chat`)
General-purpose hotel assistant. Users can ask about amenities, policies, local attractions, etc. The system prompt includes the full room catalogue for context-aware answers.

### 2. Booking Intent Parser (`/api/llm/book-intent`)
Accepts free-text like *"I need a room for 3 people from March 5 to March 8"* and returns structured JSON:
```json
{ "room_type": "Deluxe Room", "check_in": "2025-03-05", "check_out": "2025-03-08", "guests": 3 }
```

### 3. Room Recommender (`/api/llm/recommend`)
Given guest preferences (budget, group size, occasion), returns personalised room suggestions with explanations.

### 4. Analytics Report Generator (`/api/llm/analytics-report`)
Admin-only. Feeds occupancy, revenue, and booking data to the LLM and receives a natural-language executive summary.

### 5. Vision-Language Room Analysis (`/api/llm/analyse-image`)
Upload a room photo (base64). The **llava** VLM analyses the image and provides a description of the room, detected amenities, and quality assessment.

> **Graceful degradation:** When Ollama is not running, LLM endpoints return a clear error message. All non-AI features continue working normally.

---

## Dynamic Pricing Engine

The `pricingService` implements demand-based pricing with three tiers:

| Occupancy Rate | Multiplier | Label |
|---------------|------------|-------|
| < 50% | 1.00× | Standard |
| 50% – 79% | 1.15× | High demand |
| ≥ 80% | 1.35× | Peak demand |

Every price adjustment is recorded in the `pricing_history` table with:
- Previous and new price
- Occupancy rate at the time
- Reason for the change
- Timestamp

---

## Security

| Measure | Implementation |
|---------|---------------|
| **Password hashing** | bcryptjs with 12 salt rounds |
| **Authentication** | JWT tokens (24h expiry) |
| **Authorisation** | Role-based (guest / admin) middleware |
| **HTTP headers** | Helmet.js (CSP, HSTS, X-Frame, etc.) |
| **Rate limiting** | express-rate-limit (configurable per-IP) |
| **Input validation** | Server-side field, email, and date validators |
| **SQL injection** | Parameterised queries (prepared statements) |
| **CORS** | Configurable origin whitelist |

---

## Testing

```bash
# Run all 28 tests
npm test

# With verbose output
npx jest --verbose --forceExit
```

### Test Coverage

| Suite | Tests | Description |
|-------|-------|-------------|
| Auth | 9 | Register, login, profile, password change, validation, duplicates |
| Rooms | 4 | List, detail, search, availability |
| Reservations | 7 | Book, list, detail, cancel, overlap, past dates, bad room |
| Admin | 4 | List all, confirm, admin-only access, statistics |
| Security | 3 | SQL injection, invalid JWT, health check |

Tests use an **in-memory SQLite** database — no disk I/O, full isolation, fast.

---

## Original C++ Prototype

The original CSE 225 project is preserved in `cse 225 project/`. It provides:

- Console-based user registration and login with file-backed credentials
- Room browsing sorted by price (linked-list implementation)
- Reservation scheduling with calendar-based date selection
- Admin reservation management (view, confirm, delete)

### Building the Original

```bash
g++ -std=c++17 "cse 225 project/main.cpp" -o HRS
./HRS
```

> **Note:** The original code uses Windows-specific APIs (`conio.h`, `system("cls")`). For macOS/Linux, replace `system("cls")` with `system("clear")` and `_getch()` with a portable alternative.

---

## Research Context

This project demonstrates the transformation of a traditional software prototype into a modern, AI-augmented web application. Key research contributions:

### 1. LLM-Augmented Domain Applications
Integration of local large language models (Ollama/llama3) into a domain-specific application, showing how LLMs can serve as natural-language interfaces for structured operations (booking, analytics).

### 2. Vision-Language Models in Hospitality
Use of VLMs (llava) for room image analysis — a practical application of multimodal AI in the hospitality domain.

### 3. Demand-Based Dynamic Pricing
Implementation of a rule-based dynamic pricing engine that adjusts room rates based on real-time occupancy, with full audit trail.

### 4. Legacy System Modernisation
A documented case study of evolving a C++ console application to a full-stack web platform while preserving domain logic and feature parity.

### Conference Positioning
Suitable for workshops/conferences in:
- **Software Engineering** — legacy modernisation, architecture evolution
- **Applied AI** — LLM/VLM integration in vertical domains
- **Information Systems** — hotel management system design
- **HCI** — natural-language interfaces for non-technical users

---

## Scripts

```bash
npm start          # Start production server (port 3000)
npm run dev        # Start with nodemon (auto-reload)
npm run seed       # Seed database with admin + room types
npm test           # Run Jest test suite
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | `hrs-secret-...` | JWT signing key |
| `DB_PATH` | `./data/hotel.db` | SQLite file path |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API URL |
| `OLLAMA_MODEL` | `llama3` | Text LLM model |
| `OLLAMA_VISION_MODEL` | `llava` | Vision LLM model |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `ADMIN_USERNAME` | `admin` | Default admin username |
| `ADMIN_PASSWORD` | `hrsadmin2024!` | Default admin password |
| `ADMIN_EMAIL` | `admin@hotel.local` | Default admin email |

---

## License

MIT — free to use, modify, and distribute for educational and research purposes.