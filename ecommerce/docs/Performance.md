# Performance Optimization Document: MegaMart

---

## 1. Performance Targets & Budgets

To deliver a fast and responsive user experience, the system enforces the following performance targets:

* **Largest Contentful Paint (LCP):** < 2.5 seconds (on 3G/4G connections)
* **Interaction to Next Paint (INP):** < 200 milliseconds
* **Cumulative Layout Shift (CLS):** < 0.1
* **Time to First Byte (TTFB):** < 200 milliseconds
* **Initial JavaScript Bundle Size:** < 250 KB (gzipped)
* **Initial CSS Bundle Size:** < 50 KB (gzipped)
* **API Response Latency (P95):** < 200 milliseconds
* **Database Query Execution Time:** < 50 milliseconds

---

## 2. Frontend Performance Optimizations

### 2.1 Bundling & Code Splitting (Vite)
* **Route-Based Code Splitting:** Code splitting is applied to all pages using `React.lazy` and `React.Suspense` to prevent loading unused assets on initial load.
* **Manual Chunk Splitting:** Customize the Vite build configuration to split third-party vendor dependencies into distinct, cacheable bundles:
  ```typescript
  // vite.config.ts
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('lucide-react')) return 'vendor-lucide';
              return 'vendor-libs';
            }
          }
        }
      },
      chunkSizeWarningLimit: 500,
    }
  });
  ```

### 2.2 Server State Caching (React Query)
React Query (TanStack Query) caches API data on the client side to minimize redundant network requests:
* **Product Lists:** `staleTime: 300000` (5 minutes). Re-fetching occurs only if the user navigates away and back after 5 minutes.
* **Product Details:** `staleTime: 600000` (10 minutes).
* **Categories Tree:** `staleTime: 3600000` (1 hour).
* **Cart Details:** `staleTime: 0`. The cart must query the server on every mount to ensure accurate pricing and stock availability.

### 2.3 Image Optimization & Delivery
* **Lazy Loading:** Apply native browser lazy loading (`loading="lazy"`) to all images below the fold.
* **Responsive Images:** Use `srcset` attributes to serve appropriately sized images based on the user's viewport width.
* **Cloudinary Auto-Format:** Request images in modern formats (such as WebP or AVIF) by appending format parameter hooks (`f_auto,q_auto`) to Cloudinary URLs.

---

## 3. Backend & Database Optimization

### 3.1 Avoiding N+1 Query Loops
Ensure relational database queries are optimized. For example, fetching products alongside their category details using a single SQL JOIN:
```typescript
// Correct: Single JOIN query
const products = await prisma.product.findMany({
  include: {
    category: true
  }
});
```

### 3.2 Database Indexing
Create explicit indexes in the PostgreSQL database for frequently queried fields:
* **Composite Filter Index:**
  ```sql
  CREATE INDEX idx_products_active_featured ON "Product"("isActive", "isFeatured");
  ```
* **Full-Text Search Index:** Create a Generalized Inverted Index (GIN) on the name and description fields to speed up search queries:
  ```sql
  CREATE INDEX idx_products_search_vector ON "Product" USING gin(to_tsvector('english', name || ' ' || description));
  ```

### 3.3 HTTP Compression (Brotli / Gzip)
The Express backend compresses all API response payloads before transmission:
```typescript
import compression from 'compression';
import express from 'express';

const app = express();
// Enable Brotli compression where supported, falling back to Gzip
app.use(compression({
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
```

---

## 4. Monitoring & Measurement

* **Real User Monitoring (RUM):** Capture Core Web Vitals directly from users' browsers using the `web-vitals` library and report the data to Sentry.
* **Lighthouse CI Audits:** Run automated Lighthouse checks on every pull request within the GitHub Actions pipeline. Pull requests must fail if any Lighthouse score falls below 90.
* **PostgreSQL Slow Query Logging:** Configure the database to log any queries with execution times exceeding 100ms:
  ```ini
  log_min_duration_statement = 100
  ```
