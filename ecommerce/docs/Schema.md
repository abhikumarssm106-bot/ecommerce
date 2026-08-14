# Database Schema & ERD Document: MegaMart

---

## 1. Database Entities & Estimated Growth (Year 1)

| Table Name | Description | Access Type | Estimated Rows (Year 1) | Primary Keys / Indexes |
| :--- | :--- | :--- | :--- | :--- |
| **User** | Store accounts for buyers and administrators | Read-Heavy | 50,000 | `id`, `email` (unique) |
| **Address** | User shipping/billing physical destinations | Read-Heavy | 80,000 | `id`, `userId` |
| **Category** | Hierarchical categories (e.g. Grocery > Produce) | Read-Heavy | 100 | `id`, `slug` (unique) |
| **Product** | Base details of items sold | Read-Heavy | 5,000 | `id`, `slug` (unique) |
| **ProductVariant** | Specific item listings (size, color, stock) | Read-Heavy | 20,000 | `id`, `sku` (unique) |
| **ProductImage** | Photo assets pointing to Cloudinary URLs | Read-Heavy | 15,000 | `id`, `productId` |
| **Cart** | Shopping basket configurations (one per user) | Write-Heavy | 10,000 | `id`, `userId` (unique) |
| **CartItem** | Individual lines in cart matching a variant | Write-Heavy | 30,000 | `id`, `cartId`, `variantId` |
| **Order** | Header detail for completed transactions | Write-Heavy | 25,000 | `id`, `userId`, `status` |
| **OrderItem** | Frozen snapshots of items at check out | Write-Heavy | 75,000 | `id`, `orderId`, `productId` |
| **Payment** | Transaction logging (Razorpay / Stripe) | Write-Heavy | 25,000 | `id`, `orderId` (unique) |
| **Review** | Verified or standard star rating submissions | Read-Heavy | 10,000 | `id`, `productId` |
| **Coupon** | Promotional discount code entries | Read-Heavy | 500 | `id`, `code` (unique) |
| **RefreshToken** | JWT session rotation and revocation checks | Write-Heavy | 100,000 | `id`, `token` (unique) |

---

## 2. Complete Prisma Schema (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CUSTOMER
  ADMIN
  SUPER_ADMIN
}

enum AddressType {
  SHIPPING
  BILLING
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentProvider {
  RAZORPAY
  STRIPE
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

enum CouponType {
  PERCENTAGE
  FIXED
}

model User {
  id              String         @id @default(uuid())
  email           String         @unique
  password        String
  firstName       String
  lastName        String
  phone           String?
  role            Role           @default(CUSTOMER)
  isEmailVerified Boolean        @default(false)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  addresses       Address[]
  orders          Order[]
  reviews         Review[]
  cart            Cart?
  refreshTokens   RefreshToken[]

  @@index([email])
  @@index([role])
}

model Address {
  id         String      @id @default(uuid())
  userId     String
  type       AddressType @default(SHIPPING)
  firstName  String
  lastName   String
  line1      String
  line2      String?
  city       String
  state      String
  pincode    String
  country    String
  isDefault  Boolean     @default(false)
  createdAt  DateTime    @default(now())
  
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Category {
  id          String     @id @default(uuid())
  name        String
  slug        String     @unique
  description String?
  imageUrl    String?
  parentId    String?
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  
  parent      Category?  @relation("SubCategories", fields: [parentId], references: [id])
  subCategories Category[] @relation("SubCategories")
  products    Product[]

  @@index([parentId])
  @@index([slug])
}

model Product {
  id             String           @id @default(uuid())
  name           String
  slug           String           @unique
  description    String
  categoryId     String
  isActive       Boolean          @default(true)
  isFeatured     Boolean          @default(false)
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  
  category       Category         @relation(fields: [categoryId], references: [id])
  variants       ProductVariant[]
  images         ProductImage[]
  reviews        Review[]

  @@index([categoryId])
  @@index([slug])
  @@index([isActive, isFeatured])
}

model ProductVariant {
  id        String   @id @default(uuid())
  productId String
  size      String?
  color     String?
  sku       String   @unique
  price     Decimal  @db.Decimal(10, 2)
  stock     Int      @default(0)
  
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  cartItems CartItem[]

  @@index([productId])
  @@index([sku])
}

model ProductImage {
  id        String   @id @default(uuid())
  productId String
  url       String
  altText   String?
  position  Int      @default(0)
  isPrimary Boolean  @default(false)
  
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
}

model Cart {
  id        String     @id @default(uuid())
  userId    String     @unique
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
}

model CartItem {
  id        String         @id @default(uuid())
  cartId    String
  productId String
  variantId String
  quantity  Int            @default(1)
  createdAt DateTime       @default(now())
  
  cart      Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variant   ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)

  @@unique([cartId, variantId])
  @@index([cartId])
}

model Order {
  id                String       @id @default(uuid())
  userId            String
  status            OrderStatus  @default(PENDING)
  shippingAddressId String
  subtotal          Decimal      @db.Decimal(10, 2)
  shippingCost      Decimal      @db.Decimal(10, 2)
  discount          Decimal      @default(0.00) @db.Decimal(10, 2)
  tax               Decimal      @db.Decimal(10, 2)
  total             Decimal      @db.Decimal(10, 2)
  couponId          String?
  notes             String?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  user              User         @relation(fields: [userId], references: [id])
  orderItems        OrderItem[]
  payment           Payment?
  coupon            Coupon?      @relation(fields: [couponId], references: [id])

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model OrderItem {
  id             String         @id @default(uuid())
  orderId        String
  productId      String
  variantId      String
  productName    String
  variantDetails Json
  quantity       Int
  unitPrice      Decimal        @db.Decimal(10, 2)
  totalPrice     Decimal        @db.Decimal(10, 2)
  
  order          Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
}

model Payment {
  id                String          @id @default(uuid())
  orderId           String          @unique
  provider          PaymentProvider
  providerOrderId   String
  providerPaymentId String?
  providerSignature String?
  amount            Decimal         @db.Decimal(10, 2)
  currency          String          @default("INR")
  status            PaymentStatus   @default(PENDING)
  metadata          Json?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  order             Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

model Review {
  id                 String   @id @default(uuid())
  userId             String
  productId          String
  rating             Int
  title              String?
  body               String
  isVerifiedPurchase Boolean  @default(false)
  isApproved         Boolean  @default(false)
  helpfulCount       Int      @default(0)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product            Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([userId])
}

model Coupon {
  id                String     @id @default(uuid())
  code              String     @unique
  type              CouponType
  value             Decimal    @db.Decimal(10, 2)
  minOrderAmount    Decimal    @db.Decimal(10, 2)
  maxUsageCount     Int
  currentUsageCount Int        @default(0)
  isActive          Boolean    @default(true)
  expiresAt         DateTime
  createdAt         DateTime   @default(now())
  
  orders            Order[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId, expiresAt])
}
```

---

## 3. Entity Relationships Overview

* **User (1) ──► Address (N):** A user can have multiple addresses. Deleting a user cascade-deletes their addresses.
* **User (1) ──► Cart (1):** One active shopping cart per user. Deleting a user deletes their cart.
* **Cart (1) ──► CartItem (N):** A cart has multiple items. Deleting a cart cascade-deletes the items.
* **Product (1) ──► ProductVariant (N):** A product has multiple variants (e.g., sizes, colors). Variants are cascade-deleted if the parent product is deleted.
* **Order (1) ──► OrderItem (N):** Cascade delete order items if an order is dropped.
* **Order (1) ──► Payment (1):** One payment record per order.
* **Category (1) ──► Category (N):** Hierarchical parent-to-child self-relation (on delete restrict to preserve hierarchy).

---

## 4. Normalization Analysis

### Third Normal Form (3NF) Compliance
All tables conform to 3NF standards:
1. **1NF:** Every column contains atomic values, and there are no repeating groups.
2. **2NF:** All non-key attributes are fully functionally dependent on the primary key.
3. **3NF:** There are no transitive dependencies; every non-key column depends only on the primary key.

### Intentional Denormalization (Justifications)
* **OrderItem.productName & OrderItem.variantDetails:** The name of a product or details of a variant (color, size) can change over time. By taking a JSON snapshot of these values at checkout, we prevent changes to the catalog from modifying historical invoices.
* **OrderItem.unitPrice & totalPrice:** Similar to name snapshots, historical purchase prices must remain locked even if the variant's active listing price changes.

---

## 5. Check Constraints

Prisma does not natively support check constraints. During database migrations, raw SQL check constraints must be appended:
* **ProductVariant Price Check:** `ALTER TABLE "ProductVariant" ADD CONSTRAINT "price_positive" CHECK (price > 0);`
* **ProductVariant Stock Check:** `ALTER TABLE "ProductVariant" ADD CONSTRAINT "stock_non_negative" CHECK (stock >= 0);`
* **Review Rating Range Check:** `ALTER TABLE "Review" ADD CONSTRAINT "rating_range" CHECK (rating BETWEEN 1 AND 5);`
* **Coupon Value Check:** `ALTER TABLE "Coupon" ADD CONSTRAINT "value_positive" CHECK (value > 0);`
