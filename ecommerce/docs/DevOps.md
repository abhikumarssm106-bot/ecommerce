# DevOps & CI/CD Strategy Document: MegaMart

---

## 1. CI/CD Pipeline (GitHub Actions)

MegaMart utilizes GitHub Actions to automate linting, testing, and deployment verification. The pipeline is split into a **Continuous Integration (CI)** workflow that runs on every pull request, and a **Continuous Deployment (CD)** workflow that triggers on merges to the `main` branch.

### 1.1 CI Pipeline Configuration (`.github/workflows/ci.yml`)
```yaml
name: Continuous Integration

on:
  pull_request:
    branches: [ main, develop ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: megamart_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prisma Validate & DB Migrations
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/megamart_test
        run: |
          npx prisma validate
          npx prisma migrate reset --force

      - name: Run Tests (Vitest + Supertest)
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/megamart_test
          REDIS_URL: redis://localhost:6379
          JWT_ACCESS_SECRET: test_secret_key
        run: npm run test

      - name: Build Application Verify
        run: npm run build
```

---

## 2. Containerization (Docker)

### 2.1 Backend Dockerfile (`backend.Dockerfile`)
An optimized multi-stage build is configured to minimize final production container sizes:
```dockerfile
# Stage 1: Build Layer
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Execution
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]
```

### 2.2 Docker Compose local Setup (`docker-compose.yml`)
The compose configuration mounts local databases and cache stores to replicate production environments locally:
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres_pwd@postgres_db:5432/megamart_dev?schema=public
      - REDIS_URL=redis://redis_cache:6379
      - NODE_ENV=development
    depends_on:
      - postgres_db
      - redis_cache

  postgres_db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres_pwd
      - POSTGRES_DB=megamart_dev
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis_cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

---

## 3. Environment Variables Strategy

Environment variables must be categorized by environment and managed securely:
* **Local Development (`.env`):** Created locally and added to `.gitignore` to prevent committing sensitive keys to repository.
* **Production Secret Vaults (Vercel & Render Dashboard):** Variables must be injected at the infrastructure level rather than being baked into Docker images or deployment builds.

### 3.1 Environment Variables Matrix

| Key | Example / Description | Required Environment |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:password@host:5432/db?pgbouncer=true` | All (Dev, Staging, Prod) |
| `REDIS_URL` | `redis://default:password@redis-host:6379` | All |
| `JWT_ACCESS_SECRET` | `439a2c1f...` (Minimum 256-bit key) | Staging, Production |
| `RAZORPAY_KEY_ID` | `rzp_live_...` | Production |
| `RAZORPAY_KEY_SECRET` | `secret_signature_string` | Production |
| `CLOUDINARY_URL` | `cloudinary://key:secret@cloudname` | All |

---

## 4. Deployment Configurations

### 4.1 Frontend (Vercel Build Configurations)
Create a `vercel.json` file in the frontend root to handle routing and caching headers:
```json
{
  "version": 2,
  "cleanUrls": true,
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 4.2 Backend (Render Blueprints)
Create a Render blueprint spec (`render.yaml`) to enable infrastructure-as-code deployments:
```yaml
services:
  - type: web
    name: megamart-api
    env: node
    plan: starter
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: megamart-postgres
          property: connectionString
```

---

## 5. Backup, Monitoring, & Rollbacks

* **Daily Database Backups:** Enforce automated pg_dump snapshot captures every 24 hours, stored securely in an AWS S3 bucket with a 30-day retention policy.
* **Monitoring & Alerts (Sentry):** Configure Sentry in both the React client and Express backend. Alert rules trigger Slack notifications if the API error rate exceeds 1% in a 5-minute window.
* **Rollback Procedure:** If a production deployment fails health checks:
  1. Trigger Vercel CLI rollback command to restore the previous stable build deployment instantly.
  2. For the backend, redeploy the last tagged stable Docker image from the registry.
  3. If database migrations have already run, execute database rollbacks via:
     ```bash
     npx prisma db push --force-reset # Or custom migration rollback SQL scripts
     ```
