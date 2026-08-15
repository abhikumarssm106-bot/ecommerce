# API Specification Document: MegaMart

---

## 1. Global Standards

* **Base URL:** `https://api.megamart.com/api/v1`
* **Content Type:** `application/json` (Requests and Responses)
* **Date Format:** ISO 8601 (e.g., `YYYY-MM-DDTHH:mm:ss.sssZ`)
* **Authentication:** Bearer Token in `Authorization` header:
  `Authorization: Bearer <JWT_ACCESS_TOKEN>`

### 1.1 Standard Response Envelopes

#### Success Envelope
```json
{
  "success": true,
  "data": {},
  "message": "Action completed successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password provided",
    "details": [
      {
        "field": "password",
        "issue": "Password must contain at least 1 number"
      }
    ]
  }
}
```

### 1.2 Error Code Taxonomy

| Module | Code | Description |
| :--- | :--- | :--- |
| **AUTH** | `AUTH_001` | Token missing or malformed |
| | `AUTH_002` | Token expired |
| | `AUTH_003` | Invalid credentials |
| | `AUTH_004` | Email already registered |
| | `AUTH_005` | Account not verified |
| **PRODUCT** | `PROD_001` | Product not found |
| | `PROD_002` | Out of stock |
| **ORDER** | `ORD_001` | Order creation failed |
| | `ORD_002` | Order not found |
| | `ORD_003` | Status transition not allowed |
| **PAYMENT** | `PAY_001` | Payment signature mismatch |
| | `PAY_002` | Razorpay order generation failed |

---

## 2. API Endpoints

### 2.1 Authentication Module

#### `POST /auth/register`
* **Summary:** Registers a new customer account.
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "email": "customer@email.com",
    "password": "SecurePassword1!",
    "firstName": "Arjun",
    "lastName": "Mehta",
    "phone": "+919876543210"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "userId": "usr_789f2a4",
      "email": "customer@email.com",
      "isEmailVerified": false
    },
    "message": "User registered successfully. Please verify your email."
  }
  ```
* **Error Responses:**
  * `400 Bad Request` (`AUTH_004`): Email already exists.

#### `POST /auth/login`
* **Summary:** Logs in a user, returning a JWT token and setting a refresh cookie.
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "email": "customer@email.com",
    "password": "SecurePassword1!"
  }
  ```
* **Success Response (200 OK):**
  * *Headers:* `Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800`
  * *Body:*
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": "usr_789f2a4",
          "email": "customer@email.com",
          "role": "CUSTOMER"
        }
      },
      "message": "Login successful"
    }
    ```

#### `POST /auth/refresh-token`
* **Summary:** Rotates the refresh token and issues a new access token.
* **Auth Required:** Yes (via refresh cookie)
* **Success Response (200 OK):**
  * *Headers:* `Set-Cookie: refreshToken=<new_token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
  * *Body:*
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      },
      "message": "Token refreshed successfully"
    }
    ```

---

### 2.2 Products Module

#### `GET /products`
* **Summary:** Returns a paginated list of active products based on query filters.
* **Auth Required:** No
* **Query Parameters:**
  * `category` (string, optional)
  * `minPrice` (decimal, optional)
  * `maxPrice` (decimal, optional)
  * `search` (string, optional)
  * `sort` (string, optional: `price_asc`, `price_desc`, `newest`)
  * `page` (integer, default: 1)
  * `limit` (integer, default: 20)
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "prod_456a",
        "name": "Organic Almond Milk",
        "slug": "organic-almond-milk",
        "price": 180.00,
        "imageUrl": "https://res.cloudinary.com/megamart/almond.webp"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
  ```
* **Caching:** Cached in Redis for 5 minutes. Query params form part of the cache key.

#### `GET /products/:slug`
* **Summary:** Returns detailed product information, including variants and images.
* **Auth Required:** No
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "prod_456a",
      "name": "Organic Almond Milk",
      "slug": "organic-almond-milk",
      "description": "100% organic, unsweetened almond milk.",
      "category": { "name": "Drinks" },
      "images": [
        { "url": "https://res.cloudinary.com/megamart/almond.webp", "isPrimary": true }
      ],
      "variants": [
        { "id": "var_123", "size": "1L", "price": 180.00, "stock": 50, "sku": "ALM-1L" }
      ]
    }
  }
  ```
* **Caching:** Cached in Redis for 15 minutes. Cache is invalidated if an admin updates the product.

---

### 2.3 Shopping Cart Module

#### `GET /cart`
* **Summary:** Retrieves the authenticated user's cart contents.
* **Auth Required:** Yes | Role: `CUSTOMER`
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "cartId": "crt_9901",
      "items": [
        {
          "itemId": "cit_112",
          "productId": "prod_456a",
          "variantId": "var_123",
          "name": "Organic Almond Milk",
          "quantity": 2,
          "price": 180.00,
          "subtotal": 360.00
        }
      ],
      "totals": {
        "subtotal": 360.00,
        "tax": 18.00,
        "shipping": 40.00,
        "total": 418.00
      }
    }
  }
  ```

#### `POST /cart/items`
* **Summary:** Adds a product variant to the cart.
* **Auth Required:** Yes | Role: `CUSTOMER`
* **Request Body:**
  ```json
  {
    "variantId": "var_123",
    "quantity": 1
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "itemId": "cit_112",
      "quantity": 3
    },
    "message": "Cart updated successfully"
  }
  ```
* **Error Responses:**
  * `400 Bad Request` (`PROD_002`): Requested quantity exceeds available stock.

---

### 2.4 Payments Module

#### `POST /payments/razorpay/create-order`
* **Summary:** Generates a transaction order ID through Razorpay.
* **Auth Required:** Yes | Role: `CUSTOMER`
* **Request Body:**
  ```json
  {
    "orderId": "ord_88291"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "razorpayOrderId": "order_EK921oPz201",
      "amount": 41800,
      "currency": "INR"
    }
  }
  ```

#### `POST /payments/razorpay/verify`
* **Summary:** Verifies the cryptographic signature returned by the Razorpay SDK checkout.
* **Auth Required:** Yes | Role: `CUSTOMER`
* **Request Body:**
  ```json
  {
    "razorpayOrderId": "order_EK921oPz201",
    "razorpayPaymentId": "pay_FN91oPz",
    "razorpaySignature": "9201f92a0129f123049102c91a..."
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "orderStatus": "PAID"
    },
    "message": "Payment verified and order confirmed."
  }
  ```
* **Error Responses:**
  * `400 Bad Request` (`PAY_001`): Signature verification failed.

---

## 3. Webhook Event Catalog

Webhooks do not require authorization, but their payloads must be validated using HMAC signatures.

### 3.1 `order.paid` (Razorpay Webhook)
* **Payload Format:**
  ```json
  {
    "entity": "event",
    "event": "order.paid",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_FN91oPz",
          "amount": 41800,
          "order_id": "order_EK921oPz201",
          "status": "captured"
        }
      }
    }
  }
  ```
* **Action:** Transitions the corresponding order status to `PAID` in the database if the verification signature matches.
