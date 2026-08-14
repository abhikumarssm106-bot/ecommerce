# User Flow & Wireframe Document: MegaMart

---

## 1. Core User Flows

### Flow 1: User Checkout Flow (Conversion Optimized)
This is the most critical conversion path on the platform. It is designed to minimize friction and prevent cart abandonment.

```
 [ Cart Drawer ] ──► [ Auth Guard ] ──► ( Already logged in? )
                                                 │
                             ┌───────────────────┴───────────────────┐
                             ▼ Yes                                   ▼ No
                   [ Select Saved Address ]                  [ Guest Checkout / Login ]
                             │                                       │
                             ▼                                       ▼
                   [ Confirm Details ] ◄───────── Input Info ────────┘
                             │
                             ▼
                   [ Payment Method Selector ] ──► ( Razorpay / Stripe Modal )
                                                           │
                                   ┌───────────────────────┴───────────────────────┐
                                   ▼ Success                                       ▼ Failure
                       [ Order Confirmation Page ]                        [ Payment Retry Page ]
```

---

## 2. ASCII Wireframe Specifications

### 2.1 Desktop Homepage Layout
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [MEGAMART]     [ Search products, categories...             ]    [❤ Wishlist]  [🛒 Cart (2)] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Browse Categories ▼  |  Fresh Produce  |  Snacks  |  Drinks  |  Household  |  Hot Deals %     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                  HERO BANNER                                   │   │
│   │               Fresh Essentials Delivered to Your Door in 10 Mins               │   │
│   │               [ Shop Now ]                                                     │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│   Popular Categories                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │   Produce    │  │    Snacks    │  │    Drinks    │  │   Detergent  │  │   Personal   │   │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                                        │
│   Trending Grocery Aisles                                                              │
│   ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐          │
│   │ Product Card   │ │ Product Card   │ │ Product Card   │ │ Product Card   │          │
│   │ [Image]        │ │ [Image]        │ │ [Image]        │ │ [Image]        │          │
│   │ Title          │ │ Title          │ │ Title          │ │ Title          │          │
│   │ ₹120 [Add +]   │ │ ₹85  [Add +]   │ │ ₹190 [Add +]   │ │ ₹45  [Add +]   │          │
│   └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Product Detail Page (PDP) Layout
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [MEGAMART]     [ Search products, categories...             ]    [❤ Wishlist]  [🛒 Cart (2)] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Home > Drinks > Juices > Organic Orange Juice                                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   ┌──────────────────────────────┐    ┌────────────────────────────────────────────┐   │
│   │                              │    │ Organic Orange Juice (1L)                  │   │
│   │                              │    │ Brand: FreshFarm  |  ★ 4.8 (124 reviews)   │   │
│   │         PRODUCT              │    ├────────────────────────────────────────────┤   │
│   │         PRIMARY              │    │ Price: ₹180.00   |  MRP: ₹220.00 (18% Off) │   │
│   │          IMAGE               │    ├────────────────────────────────────────────┤   │
│   │         (ZOOM)               │    │ Select Pack Size:                          │   │
│   │                              │    │ [ ( ) 500mL ]   [ (●) 1L ]   [ ( ) 2L ]    │   │
│   │                              │    ├────────────────────────────────────────────┤   │
│   ├──────────────────────────────┤    │ Quantity: [ - ]  [ 1 ]  [ + ]   (In Stock) │   │
│   │ [Thumb 1] [Thumb 2] [Thumb 3]│    │                                            │   │
│   └──────────────────────────────┘    │ [ Buy Now ]   [ Add to Cart ]   [❤ Wish]   │   │
│                                       └────────────────────────────────────────────┘   │
│                                                                                        │
│   Product Description                                                                  │
│   This premium organic orange juice is pressed from locally sourced oranges, with      │
│   no added sugar or preservatives. High in Vitamin C.                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Slide-Out Cart Drawer Layout (Desktop & Mobile)
```
┌──────────────────────────────────────────────┐
│                  SHOPPING CART           [X] │
├──────────────────────────────────────────────┤
│  Items in Cart (2)                           │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Organic Orange Juice (1L)              │  │
│  │ Price: ₹180.00                         │  │
│  │ Qty: [ - ] [ 1 ] [ + ]        [Remove] │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ Crunchy Potato Chips (150g)            │  │
│  │ Price: ₹60.00                          │  │
│  │ Qty: [ - ] [ 2 ] [ + ]        [Remove] │  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  Apply Coupon: [ ENTER CODE ]   [ Apply ]    │
├──────────────────────────────────────────────┤
│  Order Summary:                              │
│  Subtotal:                          ₹300.00  │
│  Shipping:                           ₹40.00  │
│  Coupon Discount:                    -₹30.00 │
│  Estimated Tax (GST):                ₹18.00  │
│  ------------------------------------------  │
│  Total Amount:                      ₹328.00  │
├──────────────────────────────────────────────┤
│  [ Proceed to Checkout                  ]    │
└──────────────────────────────────────────────┘
```

---

## 3. UX & Conversion Best Practices Applied

* **One-Click Add to Cart:** Users can add items directly from the product grids without opening the details page. A loading indicator replaces the CTA during network processing.
* **Persistent Order Summary:** The cart drawer and checkout screens display clear, itemized order summaries. This prevents cart abandonment by ensuring there are no unexpected fees at the final step.
* **Inline Error Notifications:** Forms display validation errors inline as the user types (e.g., "Invalid card format") rather than displaying error alerts on submit.
* **Optimistic UI Updates:** The shopping cart count updates instantly when an item is added, rolling back the state only if the API returns a failure response.
* **Secure Badging:** The payment selection panel displays security trust badges (e.g., "SSL Secured", "Razorpay Verified Partner") to build consumer trust.
