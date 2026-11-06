# Grid Motors API

[![CI](https://github.com/PabloTosati/motors-api/actions/workflows/ci.yml/badge.svg)](https://github.com/PabloTosati/motors-api/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

REST API for a car rental system: users, JWT authentication, cars with accessories and reservations with overlap rules.

🇧🇷 [Leia em português](README.pt-BR.md) (includes all technical decisions in detail)

## Highlights

- **Modular, layered architecture**: each module has routes → controller → service → repository → mapper
- **JWT authentication** with hashed passwords (bcrypt)
- **Real business rules**: no overlapping reservations for the same car or user, only qualified users can rent, rental price calculated from the number of days
- **Validation with Zod**, including official CPF check-digit validation (Brazilian tax ID)
- **ViaCEP integration**: the user's address is filled in automatically from the postal code
- **Interactive API docs** with Swagger / OpenAPI 3.0
- **153 automated tests** (unit + HTTP integration), ~82% line coverage
- **Docker Compose** with PostgreSQL; migrations run automatically
- **Code quality**: ESLint + Prettier, GitHub Actions CI

## Tech stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| HTTP framework | Express 5 |
| Database | PostgreSQL |
| Data access | Knex.js (query builder + migrations) |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod |
| Documentation | Swagger / OpenAPI 3.0 |
| Tests | Jest + Supertest + jest-mock-extended |
| Code quality | ESLint + Prettier |
| Containers | Docker + Docker Compose |
| CI | GitHub Actions |

## Getting started

### With Docker (recommended)

```bash
git clone https://github.com/PabloTosati/motors-api.git
cd motors-api
docker compose up --build
```

This starts PostgreSQL and the API. Migrations run automatically before the server starts.

- API: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/api/v1/api-docs`

### Without Docker

Requirements: Node.js 18+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env      # adjust DATABASE_URL and JWT_SECRET if needed
npm run db:migrate
npm run dev
```

### Tests and code quality

```bash
npm test               # run the test suite (no database needed)
npm run test:coverage  # with coverage report
npm run lint           # ESLint
npm run format:check   # Prettier
```

The tests mock the data layer, so they run without a database.

## Endpoints

All routes are prefixed with `/api/v1`. Full payloads and responses are in Swagger.

| Module | Method | Endpoint | Auth |
| --- | --- | --- | --- |
| Auth | POST | `/auth/login` | – |
| Users | POST | `/users` | – |
| Users | GET | `/users`, `/users/:id` | – |
| Users | PUT / DELETE | `/users/:id` | – |
| Cars | POST | `/cars` | Bearer token |
| Cars | GET | `/cars`, `/cars/:id` | Bearer token |
| Cars | PUT / DELETE | `/cars/:id` | Bearer token |
| Cars | PATCH | `/cars/:id/accessories` | Bearer token |
| Reservations | POST | `/reservations` | Bearer token |
| Reservations | GET | `/reservations`, `/reservations/:id` | Bearer token |
| Reservations | PUT / DELETE | `/reservations/:id` | Bearer token |

List endpoints support pagination (`limit` = items per page, `offset` = page number) and filters.

User routes are public because the original challenge required it. In a production system, updating and deleting users would require authentication.

## Business rules

| Area | Rule |
| --- | --- |
| Users | CPF and email must be unique; CPF validated by its check digits; address filled from the CEP via ViaCEP |
| Cars | Year between 1950 and 2023, at least one accessory, no duplicated accessories (case-insensitive) |
| Accessories | The accessories route toggles an item: adds it if missing, removes it if present |
| Reservations | Only qualified users can rent; a car cannot have two reservations in the same period; a user cannot have overlapping reservations |
| Price | `final_value` = daily price × number of days between start and end date |

## Project structure

```
src/
├── app.ts            # Express setup (middlewares, routes, Swagger)
├── server.ts         # Entry point
├── config/           # Environment variables
├── database/         # Knex connection
├── middlewares/      # Auth (Bearer), error handling, async handler
├── utils/            # CPF, dates, pagination, ViaCEP, IDs, currency
└── modules/
    ├── auth/         # Login (JWT)
    ├── users/        # Users + ViaCEP
    ├── cars/         # Cars + accessories
    └── reservations/ # Reservations + overlap rules
migrations/           # Knex migrations
docs/                 # OpenAPI spec
tests/                # Unit and integration tests
```

## Configuration

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign tokens (required in production) |
| `JWT_EXPIRES_IN` | Token lifetime (default `1d`) |

## Author

**Pablo Tosati**: backend developer (Node.js, TypeScript)
[GitHub](https://github.com/PabloTosati)
