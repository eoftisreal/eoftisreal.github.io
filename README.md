# Ecommerce Platform

Production-ready monorepo with:

- `backend/` Node.js + Express + MongoDB API
- `frontend/` Vite, React, TypeScript, React Router UI
- `docker-compose.yml` local development stack

## Features

- **Frontend:** Built with Vite, React, TypeScript, React Router, Tailwind CSS, and Zustand for state management. Uses Three.js for 3D visual elements, and libraries like `xlsx` and `html2canvas` for exports.
- **Authentication:** JWT authentication with access & refresh tokens (bcryptjs for passwords).
- **Payments:** Manual UPI QR Payment system with admin verification of UTRs/screenshots.
- **Emails:** Handled via Resend.
- **File Storage:** Image uploads handled via Multer, optimized (resized/WebP) using Sharp, and stored in Cloudflare R2 via AWS SDK.
- **Product Management:** Product CRUD, search, filtering, pagination. Admin panel uses `react-quill` and Markdown libraries for rich text editing.
- **Cart & Wishlist:** Cart APIs with Zustand persisted localStorage UX.
- **Order Tracking:** Timeline events, guest tracking endpoint.
- **Admin:** Analytics, product/order management endpoints.
- **Security:** Helmet, rate limiting, centralized error handling.

## Quick Start

1. Copy env template:
   ```bash
   cp .env.example .env
   ```
   *Note: Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set for authentication to work.*

2. Local MongoDB (via Docker):
   ```bash
   docker compose up -d mongo
   ```

3. Backend (Runs on port 5000):
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. Frontend (Runs on port 3000):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Testing

Backend uses Jest for testing. You will need the environment variables set.
```bash
cd backend
JWT_ACCESS_SECRET=123 JWT_REFRESH_SECRET=123 npm run test
```

## Docker

```bash
docker compose up --build
```

## Deployment Notes

- Backend and frontend are containerized for DigitalOcean App Platform style deployments.
- Configure production secrets via environment variables.
