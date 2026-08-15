# SEO Requirements Document: MegaMart

---

## 1. SEO Architecture Decision (React SPA Optimization)

As a Single Page Application (SPA), React relies on client-side rendering (CSR). This can present challenges for search engine crawlers that do not execute JavaScript immediately. To ensure all products and categories are indexed:
* **Pre-rendering / Server-Side Rendering (SSR):** Build pre-rendering into the build pipeline using a tool like Prerender.io, or migrate the application routing structure to Vite SSR. This serves fully rendered static HTML files to crawlers, while users receive the standard hydrated SPA.
* **Metadata Management:** Use `react-helmet-async` on the client side to inject custom, dynamic header metadata for each route.
* **Dynamic Sitemap Generation:** Configure a backend service that runs daily to query all database product slugs and build an updated XML sitemap.

---

## 2. Canonical URL Structure

All paths must use clean, search-engine-friendly URLs:
* **Homepage:** `https://megamart.com/`
* **Category Page:** `https://megamart.com/category/[category-slug]` (e.g., `/category/drinks`)
* **Product Detail Page:** `https://megamart.com/products/[product-slug]` (e.g., `/products/organic-almond-milk`)
* **URL Formatting Rules:**
  * All URLs must use lowercase letters.
  * Spaces must be replaced by hyphens. Special characters must be removed.
  * Enforce a single URL structure. Strip trailing slashes (`/products/almond-milk/` must redirect to `/products/almond-milk` via a 301 redirect).

---

## 3. Meta Tag Specifications

### 3.1 Product Detail Page Meta Tags
For every product page, metadata must be dynamically generated based on DB records:
```html
<title>[Product Name] - Buy Online at MegaMart</title>
<meta name="description" content="Buy [Product Name] online for ₹[Price]. [Description Snapshot] | Free express delivery available at MegaMart." />
<link rel="canonical" href="https://megamart.com/products/[product-slug]" />
```

### 3.2 Indexing Exclusions
To prevent search engines from index thin or duplicate content, apply `noindex` headers to the following pages:
* Search Results Page: `/search?q=...` (`<meta name="robots" content="noindex, follow" />`)
* Checkout & Cart pages: `/cart`, `/checkout` (`<meta name="robots" content="noindex, nofollow" />`)
* User Account & Administration: `/users/**`, `/admin/**` (`<meta name="robots" content="noindex, nofollow" />`)

---

## 4. Structured Data / Schema.org (JSON-LD)

To display rich snippets in search results, inject the following JSON-LD schemas into the page:

### 4.1 Product Page Schema
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Organic Almond Milk",
  "image": [
    "https://res.cloudinary.com/megamart/almond-milk-primary.webp"
  ],
  "description": "100% organic, unsweetened almond milk.",
  "sku": "ALM-1L",
  "mpn": "92011",
  "brand": {
    "@type": "Brand",
    "name": "FreshFarm"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://megamart.com/products/organic-almond-milk",
    "priceCurrency": "INR",
    "price": "180.00",
    "priceValidUntil": "2027-01-01",
    "itemCondition": "https://schema.org/NewCondition",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "MegaMart Kirana Hub"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "124"
  }
}
</script>
```

---

## 5. Robots.txt Specification

Create a `robots.txt` file in the root of the project to control search engine indexing:
```
User-agent: *
Allow: /
Allow: /products/*
Allow: /category/*
Disallow: /api/
Disallow: /admin/
Disallow: /checkout/
Disallow: /cart/
Disallow: /users/
Disallow: /*?q=   # Blocks search queries from index crawl

Sitemap: https://megamart.com/sitemap.xml
```

---

## 6. Core Web Vitals & Image SEO

* **Preloading LCP Image Assets:** To improve Largest Contentful Paint (LCP), preload the primary product image on product pages using header link relations:
  ```html
  <link rel="preload" as="image" href="https://res.cloudinary.com/megamart/almond-primary.webp" />
  ```
* **Image Alt Attributes:** All images must have an automated, descriptive alt attribute:
  * Formula: `alt="[Product Name] - [Variant Description] | MegaMart"`
* **Cumulative Layout Shift (CLS) Prevention:** Always specify explicit `width` and `height` dimensions on image tags to allow the browser to allocate layout space before the image loads.
* **Modern Formats:** Serve all product images in Next-Gen `WebP` or `AVIF` formats, utilizing Cloudinary URL compression tags:
  ```
  https://res.cloudinary.com/megamart/image/upload/f_auto,q_auto/v1/almond.jpg
  ```
