# Security Requirements Document: MegaMart

---

## 1. Authentication Security

MegaMart implements multiple layers of protection to secure user authentication:
* **Password Complexity Rules:** Enforce a minimum password length of 8 characters, requiring at least one uppercase letter, one lowercase letter, one numeric digit, and one special character (e.g., `@`, `#`, `$`). Passwords must be validated against the "HaveIBeenPwned" API to prevent compromised credentials from being registered.
* **Cryptographic Hashing:** Plain-text passwords must never be stored. The system must hash passwords using `bcryptjs` with a cost factor of 12 (minimum) before saving them to the database.
* **Account Lockout Policy:** To prevent brute-force attacks, accounts must be temporarily locked for 15 minutes after 5 consecutive failed login attempts. An exponential backoff delay must be applied to login responses after 3 failed attempts.
* **Secure Password Reset:** Reset requests generate a single-use, cryptographically secure token (using Node's `crypto.randomBytes(32)`). The token has a 1-hour expiration time and is sent via HTTPS-only email.
* **Email Verification:** Account creation triggers a verification token. Users cannot log in or checkout until they verify their email.
* **Session Fixation Prevention:** The backend must destroy existing session identifiers and generate new ones upon successful user login.

---

## 2. JWT Security Specification

Authentication is managed statelessly using JSON Web Tokens (JWT) with the following security practices:
* **Access Tokens:** Short-lived (15 minutes), signed using HMAC-SHA256 (`HS256`) with a 256-bit key. The payload is restricted to minimal claims: `userId`, `role`, `iat`, and `exp`.
* **Refresh Tokens:** Long-lived (7 days), stored in an HTTP-only cookie with the following security flags:
  * `Secure=true` (forces transmission only over encrypted HTTPS connections).
  * `HttpOnly=true` (prevents access from client-side JavaScript, protecting against XSS-based token theft).
  * `SameSite=Strict` (prevents the cookie from being sent on cross-site requests, mitigating CSRF attacks).
  * `Path=/api/v1/auth` (restricts cookie transmission to the authentication endpoint).
* **Refresh Token Rotation (RTR):** When a refresh token is used to obtain a new access token, the backend invalidates the old refresh token and issues a new one. If an invalidated refresh token is reused, the system assumes token theft has occurred, revokes all active tokens for that user, and forces a logout.
* **Token Revocation Blacklist:** Revoked refresh tokens are stored in a Redis blacklist with a Time-To-Live (TTL) set to their remaining expiration time.

---

## 3. Role-Based Access Control (RBAC)

The system enforces three user roles: `CUSTOMER`, `ADMIN`, and `SUPER_ADMIN`. The table below outlines the endpoint permissions matrix:

| Endpoint Pattern | Http Method | Permitted Roles | Authentication Guard |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/register` | `POST` | `ANY` | None |
| `/api/v1/auth/login` | `POST` | `ANY` | None |
| `/api/v1/products` | `GET` | `ANY` | None |
| `/api/v1/users/profile` | `GET`, `PUT` | `CUSTOMER`, `ADMIN`, `SUPER_ADMIN` | Required |
| `/api/v1/cart/**` | `GET`, `POST`, `DELETE` | `CUSTOMER`, `ADMIN`, `SUPER_ADMIN` | Required |
| `/api/v1/orders/checkout` | `POST` | `CUSTOMER`, `ADMIN`, `SUPER_ADMIN` | Required |
| `/api/v1/admin/products/**` | `POST`, `PUT`, `DELETE` | `ADMIN`, `SUPER_ADMIN` | Required + Admin Role check |
| `/api/v1/admin/users/**` | `PUT`, `DELETE` | `SUPER_ADMIN` | Required + Super Admin check |

---

## 4. Input Validation & Injection Prevention

* **SQL Injection (SQLi) Prevention:** Prisma ORM parameterized queries are used for all database operations. Raw query executions (`prisma.$queryRaw`) are restricted; where necessary, input values must be bound using template literals:
  ```typescript
  // Correct Parameterized Raw Query
  await prisma.$queryRaw`SELECT * FROM "Product" WHERE id = ${userInputId}`;
  ```
* **Cross-Site Scripting (XSS) Prevention:**
  * **Client-Side:** React's default JSX engine automatically escapes values before rendering. The use of `dangerouslySetInnerHTML` is prohibited unless the content is explicitly sanitized using `DOMPurify`.
  * **Server-Side:** Use the `xss` library to sanitize user-submitted HTML input (e.g., product descriptions, reviews).
* **Command Injection Prevention:** The use of system execution commands (`child_process.exec`, `eval`) with user-supplied arguments is prohibited.

---

## 5. CSRF Protection

* **SameSite Cookie Protections:** Enforcing `SameSite=Strict` on session and refresh cookies provides default protection against CSRF attacks in modern browsers.
* **Webhook Signature Validations:**
  * **Razorpay:** Webhooks must verify the HMAC-SHA256 signature generated using the webhook secret:
    ```typescript
    import crypto from 'crypto';
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(JSON.stringify(req.body))
      .digest('hex');
    ```
  * **Stripe:** Stripe webhooks must verify the header signature using the Stripe SDK:
    ```typescript
    const event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    ```

---

## 6. Rate Limiting Configuration

To prevent Denial of Service (DoS) and brute-force attacks, rate limits are managed using Redis:

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL!);

// 1. Auth Endpoint Limiter
export const authLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redisClient.call(args[0], ...args.slice(1)) }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Please try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Standard API Limiter
export const apiLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redisClient.call(args[0], ...args.slice(1)) }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded.' } },
});
```

---

## 7. HTTP Security Headers (Helmet.js)

The Express backend must configure standard security headers using `helmet`:
```typescript
import helmet from 'helmet';
import { Express } from 'express';

export const configureHeaders = (app: Express) => {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "https://api.stripe.com", "https://api.razorpay.com"],
        frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: true },
    frameguard: { action: "deny" }, // Prevents clickjacking
    hidePoweredBy: true, // Removes X-Powered-By header
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // Enforces HTTPS
    ieNoOpen: true,
    noSniff: true, // Prevents MIME-type sniffing
    referrerPolicy: { policy: "no-referrer-when-downgrade" },
  }));
};
```

---

## 8. Data Protection Standards

* **PII Encryption at Rest:** Personally Identifiable Information (PII), such as shipping addresses and phone numbers, must be encrypted before database insertion using AES-256-GCM.
* **PCI DSS Compliance Scope Reduction:** MegaMart does not store or process cardholder data. All checkout interactions must use Razorpay payment overlays or Stripe hosted checkouts.
* **GDPR & DPDP Act Compliance:**
  * **Consent:** Users must explicitly accept terms and privacy policies upon registration.
  * **Right to Erasure (Right to Be Forgotten):** The backend must provide an endpoint to anonymize customer records (orders, user details) upon request.
  * **Data Minimization:** Store only the information required to fulfill and invoice orders.
