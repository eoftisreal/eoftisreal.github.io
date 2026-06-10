# Ecommerce Platform

Production-ready monorepo with:

- `backend/` Node.js + Express + MongoDB API
- `frontend/` Next.js marketplace UI
- `docker-compose.yml` local development stack

## Features

- Passwordless magic-link authentication (SendGrid)
- Product CRUD, search, filtering, pagination
- Cart APIs + localStorage cart UX
- Multi-step checkout with Razorpay order + signature verification
- Order tracking, timeline events, guest tracking endpoint
- Admin analytics, product/order management endpoints
- Security middleware: Helmet, rate limiting, JWT auth, centralized error handling

## Quick Start

1. Copy env template:
   ```bash
   cp .env.example .env
   ```
2. Backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## API Health Check

- `GET /api/health`

## Docker

```bash
docker compose up --build
```

## Deployment Notes

- Backend and frontend are containerized for DigitalOcean App Platform style deployments.
- Configure production secrets via environment variables.
