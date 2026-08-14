# Testing Strategy Document: MegaMart

---

## 1. Testing Hierarchy & Coverage Targets

To ensure the reliability and stability of the platform, the testing pipeline enforces these minimum code coverage standards:

* **Unit Tests (Vitest):** > 85% coverage for backend services, repositories, and helper utilities.
* **Component UI Tests (React Testing Library):** > 80% coverage for core components (e.g., product cards, cart drawer).
* **API Integration Tests (Supertest):** 100% endpoint accessibility verification.
* **End-to-End Tests (Playwright):** Full verification of the critical checkout and payment journeys.

---

## 2. Unit Testing Strategy (Vitest)

Unit tests focus on validating isolated business logic, database formatting, helper utilities, and calculations.

### 2.1 Sample Backend Service Test (`cart.service.test.ts`)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateCartTotals } from '../../services/cart.service';

describe('Cart Calculation Utility', () => {
  it('correctly calculates subtotal, taxes, and final price', () => {
    const items = [
      { price: 100, quantity: 2 }, // 200.00
      { price: 50, quantity: 1 }   // 50.00
    ];
    const taxRate = 0.18; // 18% GST

    const results = calculateCartTotals(items, taxRate, 40); // 40.00 shipping

    expect(results.subtotal).toBe(250);
    expect(results.tax).toBe(45); // 18% of 250
    expect(results.total).toBe(335); // 250 + 45 + 40
  });

  it('applies flat rate shipping discount on order values above 1000', () => {
    const items = [{ price: 1200, quantity: 1 }];
    const results = calculateCartTotals(items, 0, 40); // Free shipping limit breached

    expect(results.shipping).toBe(0);
    expect(results.total).toBe(1200);
  });
});
```

---

## 3. Component Testing (React Testing Library)

Component tests verify UI behavior, render states, state bindings, and user events (clicks, input).

### 3.1 Sample Product Card Test (`ProductCard.test.tsx`)
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from './ProductCard';

const mockProduct = {
  id: 'p1',
  name: 'Organic Almond Milk',
  price: 180,
  imageUrl: '/almond.jpg',
  brand: 'FreshFarm',
  stock: 10,
};

describe('ProductCard UI Component', () => {
  it('renders product details correctly', () => {
    render(<ProductCard product={mockProduct} onSelect={() => {}} showToast={() => {}} />);
    
    expect(screen.getByText('Organic Almond Milk')).toBeInTheDocument();
    expect(screen.getByText('₹180')).toBeInTheDocument();
    expect(screen.getByText('FreshFarm')).toBeInTheDocument();
  });

  it('triggers onSelect callback when clicking the product card body', () => {
    const onSelectMock = vi.fn();
    render(<ProductCard product={mockProduct} onSelect={onSelectMock} showToast={() => {}} />);
    
    fireEvent.click(screen.getByRole('heading', { name: /Organic Almond Milk/i }));
    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });
});
```

---

## 4. API Integration Testing (Supertest)

Integration tests verify the communication between Express routes, controller layers, database schemas, and cache states:

### 4.1 Sample Auth Login Integration Test (`auth.api.test.ts`)
```typescript
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../app';
import prisma from '../config/db';

describe('Auth API Endpoint Integration', () => {
  beforeAll(async () => {
    // Seed test database user
    await prisma.user.create({
      data: {
        email: 'testlogin@email.com',
        password: '$2a$12$hashedPasswordPlaceholder...', // pre-hashed credential
        firstName: 'Test',
        lastName: 'User',
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

  it('returns a valid 200 OK and JWT access token on correct login credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testlogin@email.com',
        password: 'correctPassword'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.headers['set-cookie'][0]).toContain('refreshToken');
  });
});
```

---

## 5. End-to-End (E2E) Testing (Playwright)

E2E testing simulates real-world customer interactions across different browser engines (Chromium, Firefox, WebKit):

### 5.1 Playwright Checkout Flow Script (`checkout.spec.ts`)
```typescript
import { test, expect } from '@playwright/test';

test.describe('MegaMart Cart & Checkout Journey', () => {
  test('should allow users to search a product, add it to cart, and proceed to checkout', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('https://megamart.com/');
    await expect(page).toHaveTitle(/MegaMart/);

    // 2. Search for product
    const searchBar = page.locator('input[placeholder*="Search products"]');
    await searchBar.fill('Almond Milk');
    await searchBar.press('Enter');

    // 3. Verify results & add item to cart
    const productCard = page.locator('.product-card').first();
    await expect(productCard).toContainText('Almond Milk');
    await productCard.locator('button:has-text("Add")').click();

    // 4. Open cart drawer & verify count
    const cartButton = page.locator('button[aria-label*="Cart"]');
    await cartButton.click();
    await expect(page.locator('.cart-drawer')).toBeVisible();
    await expect(page.locator('.cart-item-title')).toHaveText('Organic Almond Milk');

    // 5. Click checkout & complete forms
    await page.click('button:has-text("Checkout")');
    await expect(page).toHaveURL(/.*checkout/);
  });
});
```

---

## 6. Security Testing Checklist

Prior to each production release, the application must pass these security checks:

- [ ] **SQL Injection Audit:** Scan backend queries using OWASP ZAP to verify that no input values are concatenated directly into SQL strings.
- [ ] **XSS Validation:** Test forms with payloads like `<script>alert('xss')</script>` to confirm inputs are properly escaped on rendering.
- [ ] **Rate Limiting Checks:** Verify that brute-force attempts on the login endpoint return a `429 Too Many Requests` status code.
- [ ] **CSRF Verification:** Confirm that POST/PUT requests lack the SameSite session cookies validation if the origin headers change.
- [ ] **Secret Exposures Audit:** Scan Git commits for exposed API keys using `gitleaks`.

---

## 7. Performance & Load Testing (k6)

Load tests verify that the system remains stable and responsive under high traffic:

### 7.1 Sample k6 Load Testing Script (`load-test.js`)
```javascript
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 }, // Ramp-up: 0 to 100 virtual users in 1 minute
    { duration: '3m', target: 100 }, // Plateau: sustain 100 users for 3 minutes
    { duration: '1m', target: 0 },   // Ramp-down: 100 to 0 users in 1 minute
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must respond in less than 300ms
  },
};

export default function () {
  const res = http.get('https://api.megamart.com/api/v1/products');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time is healthy': (r) => r.timings.duration < 300,
  });
  sleep(1);
}
```
To run the load test:
```bash
k6 run load-test.js
```
