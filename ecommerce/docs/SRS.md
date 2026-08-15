# Software Requirements Specification (SRS): MegaMart

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the production-ready e-commerce platform **MegaMart**. It outlines both the functional and non-functional requirements to ensure alignment between the product management team, engineering team, QA testers, and external stakeholders.

### 1.2 Scope of the System
MegaMart is a full-stack e-commerce platform consisting of:
1. A client-side Single Page Application (SPA) built using React 18, Vite, and Tailwind CSS.
2. A server-side REST API built using Node.js and Express.js.
3. A PostgreSQL database layer accessed via Prisma ORM.
4. Caching and rate-limiting powered by Redis.
5. Integration with external systems (Razorpay, Stripe, and email delivery services like Resend or SendGrid).

The system supports user registration, catalog discovery, shopping carts, order creation, transaction verification, and store admin panels.

### 1.3 Definitions, Acronyms, and Abbreviations
* **JWT:** JSON Web Token (used for stateless user authentication).
* **PRISMA:** A modern database toolkit (ORM) for TypeScript/Node.js.
* **NFR:** Non-Functional Requirement.
* **FR:** Functional Requirement.
* **UPI:** Unified Payments Interface (instant real-time payment system in India).
* **Idempotency:** A property of API endpoints where making multiple identical requests has the same effect as making a single request.
* **CORS:** Cross-Origin Resource Sharing.

---

## 2. Overall Description

### 2.1 Product Perspective (System Context Diagram)
```
          ┌────────────────────────────────────────────────────────┐
          │                    MEGAMART SYSTEM                     │
          │                                                        │
          │   ┌──────────────┐          ┌──────────────────────┐   │
          │   │  React SPA   │◄──HTTPS──►  Express Node API    │   │
          │   │  (Frontend)  │          │      (Backend)       │   │
          │   └──────────────┘          └──────────┬───────────┘   │
          │                                  ▲     │     ▲         │
          └──────────────────────────────────┼─────┼─────┼─────────┘
                                             │     │     │
                                           JSON  Query  REST
                                             │     │     │
                                             ▼     ▼     ▼
                                        ┌────┴─┐ ┌─┴──┐ ┌┴──────────────────┐
                                        │Redis │ │Post│ │External APIs      │
                                        │Cache │ │gres│ │(Razorpay, Stripe, │
                                        └──────┘ └────┘ │SendGrid, Resend)  │
                                                        └───────────────────┘
```

### 2.2 Product Functions
* Account registration and profile maintenance.
* Fuzzy-searchable catalog with filtering parameters.
* Real-time cart calculations and persistent state.
* Multi-channel checkout with Razorpay and Stripe gateways.
* Real-time automated transaction confirmation via webhooks.
* Admin panel with inventory management and order flow controls.

### 2.3 Operating Environment
* **Server OS:** Ubuntu Linux 22.04 LTS (or containerized in Docker Alpine images).
* **Client Environment:** Chrome 90+, Safari 14+, Firefox 88+, Edge 90+ (desktop/mobile layout).
* **Database:** PostgreSQL 15+.
* **Cache System:** Redis 7.0+.

---

## 3. Functional Requirements

All functional requirements are organized using the `FR-[MODULE]-[ID]` taxonomy. Priority levels are designated as **High**, **Medium**, or **Low**.

### 3.1 Authentication & Authorization (FR-AUTH)
* **FR-AUTH-1: Account Creation** (Priority: High)
  * *Description:* Visitors must be able to sign up using email, password, first name, last name, and phone number.
  * *Input:* User registration form data.
  * *Output:* Database user record, verification email trigger.
* **FR-AUTH-2: Account Verification** (Priority: High)
  * *Description:* Newly registered accounts must be marked inactive until verified via an email activation token.
  * *Input:* Verification token from email link.
  * *Output:* User status changed to `active` in the database.
* **FR-AUTH-3: User Login** (Priority: High)
  * *Description:* Users must authenticate with email and password to receive a JWT access token (15-min expiry) and a refresh token (7-day expiry).
  * *Input:* Email and password credentials.
  * *Output:* Access token (payload) and HTTP-only refresh token (cookie).
* **FR-AUTH-4: Token Refresh** (Priority: High)
  * *Description:* The client app must automatically request a new access token using the refresh token before the current access token expires.
  * *Input:* Cookie-based refresh token.
  * *Output:* New JWT access token.
* **FR-AUTH-5: Password Hashing** (Priority: High)
  * *Description:* User passwords must never be stored in plain text. They must be hashed using bcrypt (cost factor 12) before DB write.
  * *Input:* Plain text password.
  * *Output:* 60-character bcrypt hash string.
* **FR-AUTH-6: Session Revocation (Logout)** (Priority: High)
  * *Description:* Logging out must clear the client-side token store and add the refresh token to a Redis blacklist.
  * *Input:* Logout action trigger.
  * *Output:* Cleared HTTP-only cookies, updated Redis blacklist table.
* **FR-AUTH-7: Forgot Password Initiation** (Priority: Medium)
  * *Description:* Users can request a password reset link by entering their registered email address.
  * *Input:* Email address.
  * *Output:* Generated single-use, time-bound reset token (1 hour TTL) sent via email.
* **FR-AUTH-8: Password Reset Completion** (Priority: Medium)
  * *Description:* Users must submit a new password using the token sent to their email.
  * *Input:* Reset token and new password.
  * *Output:* Updated password hash in user record; invalidation of the token.
* **FR-AUTH-9: Account Lockout** (Priority: High)
  * *Description:* The backend must lock an account for 15 minutes after 5 consecutive failed login attempts.
  * *Input:* Repeated incorrect credential submissions.
  * *Output:* Account status locked; log entry created; error response returned.
* **FR-AUTH-10: Role-Based Authorization Guards** (Priority: High)
  * *Description:* Routes must check the claims inside the JWT to permit or deny access based on user roles (`CUSTOMER`, `ADMIN`, `SUPER_ADMIN`).
  * *Input:* User request token.
  * *Output:* Allowed access or 403 Forbidden response.

### 3.2 Product Catalog & Management (FR-PRODUCT)
* **FR-PRODUCT-1: Product Retrieval** (Priority: High)
  * *Description:* Anyone must be able to view active product lists.
  * *Output:* JSON list of active products.
* **FR-PRODUCT-2: Product Slugs** (Priority: High)
  * *Description:* Every product must have a unique URL slug derived from its title.
  * *Output:* Unique slug field in PostgreSQL.
* **FR-PRODUCT-3: Category Hierarchy** (Priority: High)
  * *Description:* Products must belong to a category, supporting nested categories (e.g., Electronics > Phones).
* **FR-PRODUCT-4: Variant Management** (Priority: High)
  * *Description:* Products can have variants defining unique size, color, material, SKU, price, and stock levels.
* **FR-PRODUCT-5: Image Galleries** (Priority: High)
  * *Description:* Products must support multiple images, with one marked as `isPrimary`.
* **FR-PRODUCT-6: Admin Product Creation (CRUD)** (Priority: High)
  * *Description:* Admins must be able to create new products with fields for description, price, base SKU, and category.
* **FR-PRODUCT-7: Admin Product Edit** (Priority: High)
  * *Description:* Admins must be able to modify any field of a product, triggering cache invalidation.
* **FR-PRODUCT-8: Admin Product Delete** (Priority: High)
  * *Description:* Admins can soft-delete products by setting `isActive` to false (preserving order history references).
* **FR-PRODUCT-9: Real-Time Inventory Checks** (Priority: High)
  * *Description:* Product listings and detail pages must show stock levels ("In Stock", "Only 3 Left", "Out of Stock").
* **FR-PRODUCT-10: Bulk Inventory Updates** (Priority: Medium)
  * *Description:* Admins can upload CSV files to bulk update stock numbers.

### 3.3 Search & Discovery (FR-SEARCH)
* **FR-SEARCH-1: Full-Text Search** (Priority: High)
  * *Description:* Search query string matches against title, description, and tags using PostgreSQL tsvector indexing.
* **FR-SEARCH-2: Search Auto-complete** (Priority: Medium)
  * *Description:* The input bar shows matching keywords as the user types (throttled/debounced at 300ms).
* **FR-SEARCH-3: Price Filter** (Priority: High)
  * *Description:* Filter listings dynamically by price ranges.
* **FR-SEARCH-4: Rating Filter** (Priority: High)
  * *Description:* Filter listings by minimum average customer ratings (e.g., 4 stars and above).
* **FR-SEARCH-5: Category Filter** (Priority: High)
  * *Description:* Filter listings to show only items matching specific category IDs.
* **FR-SEARCH-6: Sorting Mechanics** (Priority: High)
  * *Description:* Sort listings by price (asc/desc), ratings, or newest creation date.
* **FR-SEARCH-7: Paginated Results** (Priority: High)
  * *Description:* Product list endpoints must return paginated records (default: 20 per page).
* **FR-SEARCH-8: Zero-Results Suggestion** (Priority: Medium)
  * *Description:* Show popular products when a search yields zero results.

### 3.4 Shopping Cart (FR-CART)
* **FR-CART-1: Add Item** (Priority: High)
  * *Description:* Users can add a product variant to the cart.
* **FR-CART-2: Quantity Adjustments** (Priority: High)
  * *Description:* Users can increment/decrement items in their cart, validating against available stock.
* **FR-CART-3: Remove Item** (Priority: High)
  * *Description:* Users can delete items from their cart.
* **FR-CART-4: Item Calculations** (Priority: High)
  * *Description:* The cart must calculate subtotal, estimated shipping, discount reductions, and final total.
* **FR-CART-5: Cart Database Persistence** (Priority: High)
  * *Description:* Cart contents must sync to the database for logged-in users.
* **FR-CART-6: Guest Cart Storage** (Priority: High)
  * *Description:* For anonymous browsers, the cart is saved in `localStorage`.
* **FR-CART-7: Cart Merge on Login** (Priority: High)
  * *Description:* Upon login, local storage cart items must merge with any existing database cart items.
* **FR-CART-8: Cart Clear** (Priority: High)
  * *Description:* Clear all items from the cart upon successful order creation.

### 3.5 Checkout Flow (FR-CHECKOUT)
* **FR-CHECKOUT-1: Address Selector** (Priority: High)
  * *Description:* Users select a shipping and billing address from their saved lists or add a new one.
* **FR-CHECKOUT-2: Review Summary** (Priority: High)
  * *Description:* Display a final review screen showing addresses, items, and tax-inclusive prices.
* **FR-CHECKOUT-3: Inventory Locking** (Priority: High)
  * *Description:* Verify variant stock before allowing payment initiation.
* **FR-CHECKOUT-4: Order Submissions** (Priority: High)
  * *Description:* Create a database Order record with status `PENDING` before launching the payment gateway.
* **FR-CHECKOUT-5: Coupon Validation** (Priority: Medium)
  * *Description:* Verify if a discount coupon code is active, within expiry limits, and satisfies minimum spend.
* **FR-CHECKOUT-6: Shipping Fees Engine** (Priority: Medium)
  * *Description:* Apply flat-rate shipping or free shipping (e.g., orders above ₹1,000).
* **FR-CHECKOUT-7: Guest Checkout** (Priority: Medium)
  * *Description:* Allow users to buy items without registration, prompting for email and address at checkout.
* **FR-CHECKOUT-8: Checkout Session Expiry** (Priority: High)
  * *Description:* Release temporary stock reservations if checkout is not completed in 15 minutes.
* **FR-CHECKOUT-9: Order Notes** (Priority: Low)
  * *Description:* Allow users to add delivery instructions during checkout.
* **FR-CHECKOUT-10: Cart Redirection Protection** (Priority: High)
  * *Description:* Prevent checkout page load if the cart is empty.

### 3.6 Payment Processing (FR-PAYMENT)
* **FR-PAYMENT-1: Razorpay Order Creation** (Priority: High)
  * *Description:* Call Razorpay API to generate a gateway transaction ID.
* **FR-PAYMENT-2: Stripe PaymentIntent** (Priority: High)
  * *Description:* Call Stripe API to create a payment intent.
* **FR-PAYMENT-3: Signature Verification** (Priority: High)
  * *Description:* Verify webhook payment signatures (HMAC SHA256) before updating order statuses.
* **FR-PAYMENT-4: Payment State Updates** (Priority: High)
  * *Description:* Transition order status to `PAID` upon successful payment verification.
* **FR-PAYMENT-5: Payment Fail Handling** (Priority: High)
  * *Description:* Handle failed transactions by redirecting to a retry screen.
* **FR-PAYMENT-6: Refund Dispatch** (Priority: Medium)
  * *Description:* Admins can trigger partial or full refunds through the dashboard via Razorpay/Stripe APIs.
* **FR-PAYMENT-7: Currency Restriction** (Priority: High)
  * *Description:* Enforce all Razorpay payments in Indian Rupees (INR) and Stripe in USD.
* **FR-PAYMENT-8: Idempotency Keys** (Priority: High)
  * *Description:* Require an idempotency key for checkout transactions to prevent double charging.

### 3.7 Order Management & Tracking (FR-ORDER)
* **FR-ORDER-1: Order History** (Priority: High)
  * *Description:* Display a paginated list of past orders for logged-in users.
* **FR-ORDER-2: Order Details** (Priority: High)
  * *Description:* Display details of a specific order, including a snapshot of the products' names and prices at purchase.
* **FR-ORDER-3: Order Timelines** (Priority: High)
  * *Description:* Show a timeline tracking the order: `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
* **FR-ORDER-4: Order Cancellations** (Priority: High)
  * *Description:* Allow users to cancel orders before they are marked as `SHIPPED`.
* **FR-ORDER-5: Stock Restoring on Cancel** (Priority: High)
  * *Description:* Restock variant quantities in the database when an order is cancelled.
* **FR-ORDER-6: Invoice Generation** (Priority: Medium)
  * *Description:* Users can download a PDF invoice for completed orders.
* **FR-ORDER-7: Shipping Tracking Numbers** (Priority: Medium)
  * *Description:* Display courier tracking numbers provided by admins.
* **FR-ORDER-8: Admin Order Management** (Priority: High)
  * *Description:* Admins can view all orders, search by customer name, and update shipping statuses.

### 3.8 Reviews & Ratings (FR-REVIEW)
* **FR-REVIEW-1: Rating Submissions** (Priority: Medium)
  * *Description:* Customers can submit a 1-5 star rating and review for purchased products.
* **FR-REVIEW-2: Review Verification** (Priority: Medium)
  * *Description:* The system must display a "Verified Purchase" badge if the customer has a matching, completed order for the product.
* **FR-REVIEW-3: Review Approvals** (Priority: Medium)
  * *Description:* New reviews are held in a moderation queue and must be approved by an admin before appearing on the product page.
* **FR-REVIEW-4: Average Score Aggregates** (Priority: High)
  * *Description:* Automatically recalculate product review counts and average ratings when a review is approved.
* **FR-REVIEW-5: Edit/Delete Review** (Priority: Medium)
  * *Description:* Users can delete their own reviews; admins can delete any review.
* **FR-REVIEW-6: Helpful Vote** (Priority: Low)
  * *Description:* Users can upvote reviews as "Helpful".

### 3.9 Admin Dashboard (FR-ADMIN)
* **FR-ADMIN-1: Stats Dashboard** (Priority: High)
  * *Description:* Display real-time sales overview: total sales, daily order counts, and new user registrations.
* **FR-ADMIN-2: Low Stock Alerts** (Priority: Medium)
  * *Description:* Highlight product variants with stock levels below a set threshold.
* **FR-ADMIN-3: Customer Directory** (Priority: High)
  * *Description:* List all registered users, including their contact info and registration dates.
* **FR-ADMIN-4: Coupon CRUD** (Priority: Medium)
  * *Description:* Create discount codes with percentage or flat values, expiration dates, and usage limits.
* **FR-ADMIN-5: Sales Export** (Priority: Medium)
  * *Description:* Admins can export sales reports as CSV files.
* **FR-ADMIN-6: User Role Updates** (Priority: High)
  * *Description:* Super Admins can change user roles (e.g., promote `CUSTOMER` to `ADMIN`).
* **FR-ADMIN-7: Category CRUD** (Priority: High)
  * *Description:* Create, edit, and delete categories and manage category hierarchies.
* **FR-ADMIN-8: Image Upload to CDN** (Priority: High)
  * *Description:* Automatically optimize and upload images to Cloudinary.
* **FR-ADMIN-9: Order Status Updates** (Priority: High)
  * *Description:* Update order statuses to trigger email notifications.
* **FR-ADMIN-10: Refund Initiator** (Priority: High)
  * *Description:* Initiate refunds for cancelled orders, communicating with payment gateways.
* **FR-ADMIN-11: Revenue Charts** (Priority: Low)
  * *Description:* Display interactive sales charts showing revenue trends over custom timeframes.
* **FR-ADMIN-12: System Activity Logs** (Priority: Medium)
  * *Description:* Track admin activities, such as product updates and order cancellations, for audit purposes.

### 3.10 Notifications (FR-NOTIF)
* **FR-NOTIF-1: Order Confirmation Email** (Priority: High)
  * *Description:* Send an email confirmation containing the invoice upon order creation.
* **FR-NOTIF-2: Shipping Updates Email** (Priority: Medium)
  * *Description:* Send an email with tracking details when an order status is updated to `SHIPPED`.
* **FR-NOTIF-3: Welcome Registration Email** (Priority: High)
  * *Description:* Send a welcome email containing a verification link when a new account is registered.
* **FR-NOTIF-4: Password Change Confirmation** (Priority: Medium)
  * *Description:* Send an alert email when a password reset is completed.
* **FR-NOTIF-5: Refund Issued Email** (Priority: Medium)
  * *Description:* Send an email notifying the user when a refund is processed.
* **FR-NOTIF-6: Admin Stock Warning Emails** (Priority: Low)
  * *Description:* Email alerts to admins when critical items fall below stock limits.

---

## 4. Non-Functional Requirements

### 4.1 Performance (NFR-PERF)
* **NFR-PERF-1:** API endpoints must respond in < 200ms (P95) under standard loads.
* **NFR-PERF-2:** The frontend application must load critical elements in < 2.5s (LCP) on a mobile 3G/4G connection.
* **NFR-PERF-3:** Database queries must utilize indexes to run in < 50ms for search and filter lookups.
* **NFR-PERF-4:** Support up to 1,000 concurrent active shopping sessions without database connection exhaustion.

### 4.2 Security (NFR-SEC)
* **NFR-SEC-1:** All traffic must be encrypted using TLS 1.3 in transit and HTTPS protocols.
* **NFR-SEC-2:** JWT refresh tokens must be stored in HTTP-only cookies with `Secure`, `SameSite=Strict`, and `Path=/api/v1/auth` flags enabled.
* **NFR-SEC-3:** All database writes must use parameterized queries (managed by Prisma ORM) to prevent SQL injection.
* **NFR-SEC-4:** Input sanitization must run on both frontend and backend to protect against Cross-Site Scripting (XSS).
* **NFR-SEC-5:** Rate-limiting policies must enforce limits on login endpoints (e.g., max 5 attempts per IP per 15 minutes).

### 4.3 Scalability (NFR-SCALE)
* **NFR-SCALE-1:** The backend server must be stateless to support horizontal scaling behind a load balancer.
* **NFR-SCALE-2:** Connection pooling must be configured using PgBouncer to manage database connections.
* **NFR-SCALE-3:** Product listings, categories, and review aggregates must be cached in Redis with short TTLs.

### 4.4 Reliability & Availability (NFR-REL)
* **NFR-REL-1:** Ensure 99.9% system availability, excluding planned maintenance windows.
* **NFR-REL-2:** Set up automatic daily database backups, retaining data for 30 days.
* **NFR-REL-3:** Ensure graceful degradation; if the primary payment gateway fails, display the fallback payment option.

### 4.5 Usability (NFR-USE)
* **NFR-USE-1:** The interface must achieve WCAG 2.1 AA accessibility guidelines, including contrast ratios and focus states.
* **NFR-USE-2:** Ensure touch targets on mobile devices are at least 44x44px.

### 4.6 Maintainability (NFR-MAINT)
* **NFR-MAINT-1:** Maintain a minimum of 80% test coverage for core business logic.
* **NFR-MAINT-2:** Route and capture runtime exceptions using Sentry.

---

## 5. System Constraints
* Transactions are restricted to INR currency for Razorpay and USD for Stripe.
* The system is a web-only application; native iOS and Android packages are excluded from this release.
* User data must be stored and processed in compliance with the Digital Personal Data Protection (DPDP) Act 2023.

---

## 6. External Interface Requirements

### 6.1 User Interfaces
A responsive, single-page web app built with React. Key screens include:
* **Storefront Home:** Banner sliders, category carousels, and product grids.
* **PDP:** Image gallery, product variants, and stock indicators.
* **Cart & Checkout Drawer:** Item summary, address forms, and payment options.
* **Admin Dashboard:** Order logs, product lists, and sales reports.

### 6.2 Software Interfaces
* **Database Engine:** PostgreSQL 15.
* **Payment Gateways:** Razorpay API v1, Stripe API (Node.js SDK).
* **Mail Dispatch:** Resend or SendGrid API via HTTP protocol.
* **Storage Provider:** Cloudinary API for image processing and CDN assets.

### 6.3 Communication Interfaces
* REST APIs communicating via HTTPS, returning JSON objects.
* SSE (Server-Sent Events) or WebSockets to push real-time order status updates.

---

## 7. Appendices

### 7.1 Glossary
* ** kirana:** A small, local mom-and-pop grocery store in India.
* **Bcrypt:** A key derivation function for passwords.
* **JWT Access Token:** A temporary cryptographic token proving user authentication.

### 7.2 Use Case Diagram (Textual Representation)
```
[Visitor] ──────► (Browse Catalog / Search Products)
[Customer] ─────► (Add to Cart) ──► (Proceed to Checkout) ──► (Pay Razorpay/Stripe)
[Admin] ────────► (Add/Edit Products) & (Manage Orders)
[Super Admin] ──► (Assign Roles)
```
