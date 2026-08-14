# Technical Architecture Document: MegaMart

---

## 1. System Overview

### 1.1 High-Level Architecture Topology
MegaMart is built on a decoupled Client-Server architecture. The client-side application communicates with the backend REST APIs via secure HTTPS connections. The database is accessed through a layered repository model, with Redis acting as the primary caching and rate-limiting store.

```
                  ┌────────────────────────┐
                  │      Vercel CDN        │
                  │   ┌────────────────┐   │
                  │   │   React client │   │
                  │   └──────┬─────────┘   │
                  └──────────┼─────────────┘
                             │ HTTPS (JSON API)
                             ▼
                  ┌────────────────────────┐
                  │    Render (Backend)    │
                  │   ┌────────────────┐   │
                  │   │ Express App    │   │
                  │   └──────┬─────────┘   │
                  └──────────┼─────────────┘
                  ┌──────────┴──────────┐
                  ▼                     ▼
           ┌──────────────┐      ┌──────────────┐
           │ Redis Server │      │ PostgreSQL 15│
           │ (Cache/Rate) │      │ (Supabase/Ry)│
           └──────────────┘      └──────────────┘
```

### 1.2 Technology Selection Rationale
* **React 18 + Vite:** Highly responsive virtual DOM and hot-module reloading (HMR) for fast development and execution.
* **Tailwind CSS:** Utility-first utility classes, ensuring clean, performant styles without bloating CSS files.
* **Express.js:** Lightweight and fast backend framework with customizable middleware.
* **Prisma ORM:** Strong type-safety with auto-generated queries, minimizing SQL injection risks.
* **PostgreSQL 15:** ACID-compliant, reliable relational store for transactional ordering data.
* **Redis:** In-memory key-value engine with fast lookups for cache hits, active sessions, and rate-limiting.

---

## 2. Frontend Architecture

### 2.1 Project Directory Structure
```
src/
├── assets/          # Static icons, local graphics, fonts
├── components/      # UI components organized by feature
│   ├── ui/          # Generic atomic components (Button, Input, Badge)
│   ├── cart/        # CartDrawer, CartItemCard components
│   ├── checkout/    # ShippingForm, OrderSummary components
│   ├── product/     # ProductCard, ImageGallery components
│   └── admin/       # Sidebar, DataTables components
├── context/         # React Context stores (e.g., ThemeContext)
├── hooks/           # Custom reusable hooks (useAuth, useLocalStorage)
├── layouts/         # Layout wraps (AuthLayout, AdminLayout, MainLayout)
├── pages/           # Route-level page components
│   ├── Home.tsx     # Landing page
│   ├── Product.tsx  # Product Detail Page
│   └── Checkout.tsx # Checkout Flow Page
├── services/        # Axios API instances with interceptors
│   ├── api.ts       # Base axios configurations
│   └── auth.ts      # Authentication API endpoints
├── store/           # Zustand state management slices
│   ├── useCartStore.ts
│   └── useUserStore.ts
├── types/           # Type declarations and interfaces
│   └── index.ts
└── utils/           # Formatters, validator functions, and regexes
```

### 2.2 State Management Strategy
MegaMart splits state into three distinct buckets:
1. **Local State:** Component-level states (e.g., input values, toggle states) using standard React `useState`.
2. **Global Client State (Zustand):** Lightweight, stateless, and direct global stores for cart counters, local preferences, and active drawers.
3. **Server State (React Query / TanStack Query):** Caching, mutations, stale time settings, and automated background syncs for API-fetched data (like product details, user addresses, and orders list).

### 2.3 Routing Architecture
Routing is managed by `react-router-dom` v6. Routes are grouped into three categories:
* **Public Routes:** Product listings, categories, cart, search (accessible by anyone).
* **Protected Routes:** User dashboard, addresses, order history, checkout page (require valid JWT access token; redirects to login on failure).
* **Admin Routes:** Admin dashboards, product catalogs, customer list (require both JWT and `role === 'ADMIN'` or `'SUPER_ADMIN'`).

### 2.4 Code Splitting & Dynamic Bundling
To maintain a < 250KB initial bundle size, all route pages are lazily loaded using `React.lazy` and wrapped in a `<Suspense>` boundary containing skeleton loaders:
```typescript
const Home = React.lazy(() => import('./pages/Home'));
const ProductDetails = React.lazy(() => import('./pages/Product'));
const AdminDashboard = React.lazy(() => import('./pages/Admin'));
```

### 2.5 API Communication Interceptor Layer
The Axios client automatically appends authorization tokens to requests and handles expiration flows:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true, // Send HTTP-only refresh cookies
});

// Inject Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle Token Renewal on 401 response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post('/api/v1/auth/refresh-token', {}, { withCredentials: true });
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 3. Backend Architecture

### 3.1 Project Directory Structure
```
src/
├── config/             # Database connection, env configs, constant parameters
├── controllers/        # Request handlers (processes inputs, returns responses)
├── middleware/         # Auth guards, validation pipelines, error handling
├── repositories/       # Database access layer using Prisma client queries
├── routes/             # Express route mappings
├── services/           # Business logic layer (computations, API communications)
├── utils/              # Custom logger (Winston), email templates, helpers
├── validators/         # Input validations using Zod schemas
├── app.ts              # Express application configuration
└── server.ts           # Server runner listening to ports
```

### 3.2 Layered Architectural Pattern
The backend enforces a strict **Controller-Service-Repository** design pattern:
1. **Routes Layer:** Intercepts path triggers, runs middleware (rate-limiting, auth), and delegates execution to Controllers.
2. **Controllers Layer:** Parses inputs, executes Zod schemas, delegates business logic to Services, and returns standardized JSON response envelopes.
3. **Services Layer:** Business rules (e.g., checks stock, calculates coupon codes, triggers email notifications).
4. **Repositories Layer:** Accesses database tables via Prisma.
5. **Prisma DB Wrapper:** Executes queries against PostgreSQL.

```
Client ──► Routes ──► Controller ──► Service ──► Repository ──► PostgreSQL
```

### 3.3 Global Error Handling Pipeline
All route errors are forwarded to a centralized error handler, ensuring database leaks are never exposed:
```typescript
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(public statusCode: number, public message: string, public details: any[] = []) {
    super(message);
    Object.setPrototypeOf(this, new Target.prototype);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'SYSTEM_ERROR',
      message,
      details: err.details || [],
    },
  });
};
```

---

## 4. Database Architecture

### 4.1 PostgreSQL Schema Mapping
Prisma schemas use explicit indexing and foreign key cascade instructions:
* **User & RefreshToken:** One-to-many. Revoking a user cascade deletes all active tokens.
* **Product, Variant, & Image:** One-to-many. Deleting a product removes its gallery images and inventory listings.
* **Order & OrderItems:** One-to-many. Deleting an order removes its associated items.
* **Category Self-Relation:** One-to-many mapping parent categories to subcategories.

### 4.2 Connection Pooling Strategy
To avoid exceeding the maximum database connection limit under high loads, PgBouncer is configured:
* Development string accesses the database directly.
* Production connection string appends `?pgbouncer=true&connection_limit=15` to route requests through the PgBouncer pool.

---

## 5. API Design Architecture

### 5.1 Standards
* All paths are prefixed with `/api/v1/`.
* Responses follow a standard envelope:
  ```json
  {
    "success": true,
    "data": {},
    "message": "Resource retrieved successfully",
    "meta": { "page": 1, "totalPages": 10 }
  }
  ```
* Error formats use descriptive codes:
  ```json
  {
    "success": false,
    "error": {
      "code": "AUTH_EXPIRED_TOKEN",
      "message": "Access token has expired",
      "details": []
    }
  }
  ```

---

## 6. Authentication & Session Architecture

### 6.1 JWT Verification Pipeline
Authentication is managed statelessly.
1. The server issues a short-lived Access Token (15-min TTL) and a long-lived Refresh Token (7-day TTL).
2. The refresh token is saved in a secure, HTTP-only, SameSite=Strict cookie.
3. Access tokens are passed in the `Authorization: Bearer <token>` header.
4. When a user requests a route requiring authentication, the `authGuard` middleware validates the signature:
```typescript
export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authorization token missing'));
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string; role: string };
    req.user = decoded;
    next();
  } catch (err) {
    next(new AppError(401, 'Invalid or expired token'));
  }
};
```

---

## 7. Payment Integration Architecture

### 7.1 Razorpay Payment State Flow
```
 ┌──────────────┐         ┌──────────────┐         ┌───────────────────┐
 │ Client app   ├────────►│ Backend API  ├────────►│ Razorpay API      │
 │ (Cart checkout)        │ (CreateOrder)│         │ (Initialize order)│
 └──────────────┘         └──────┬───────┘         └─────────┬─────────┘
        ▲                        │                           │
        │                        ▼                           ▼
        │                 ┌──────────────┐            Order ID token
        │                 │ Database     │                   │
        │                 │ (PENDING Order)                  │
        │                 └──────────────┘                   │
        │                                                    │
        └───────────────── Receives order token ◄────────────┘
        │
        ▼
 ┌──────────────┐         ┌──────────────┐         ┌───────────────────┐
 │ Razorpay SDK │         │ Backend API  │         │ Razorpay Webhook  │
 │ (Payment)    ├────────►│ (VerifySign) ├────────►│ (Signature audit) │
 └──────────────┘         └──────┬───────┘         └─────────┬─────────┘
                                 │                           │
                                 ▼                           ▼
                          ┌──────────────┐            ┌──────────────┐
                          │ Database     │            │ Database     │
                          │ (PAID Order) │            │ (Backup sync)│
                          └──────────────┘            └──────────────┘
```

---

## 8. Caching Architecture

### 8.1 Redis Caching & Expiry Matrix
Caching is configured to maximize read performance and minimize database query overhead:

| Cached Content | Redis Key Structure | TTL Duration | Invalidation Strategy |
| :--- | :--- | :--- | :--- |
| Category tree list | `categories:tree` | 24 Hours | Invalidates on category write. |
| Featured products | `products:featured` | 1 Hour | Invalidates on featured flag update. |
| Product detail | `product:slug:<slug>` | 15 Minutes | Invalidates on product update. |
| User Shopping Cart | `cart:userId:<id>` | 7 Days | Syncs to DB on checkout, updates on add/remove. |
| API Rate Limiter | `rate:ip:<ip_address>` | 1 Minute | Automatically expires via TTL. |

---

## 9. Scalability Considerations

* **Stateless Backend Servers:** The Node.js application maintains no local user sessions, enabling container instances to be auto-scaled horizontally behind an AWS ALB or Render Load Balancer.
* **PgBouncer Proxying:** Prevents database connection pool starvation as backend instances scale out.
* **Message Queues:** Offload long-running tasks (e.g., transactional emails, PDF invoice generation) to a background worker queue using BullMQ and Redis.
