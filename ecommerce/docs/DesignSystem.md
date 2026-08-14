# UI/UX Design System Document: MegaMart

---

## 1. Brand Identity

* **Brand Personality:**
  1. **Trustworthy:** Safe checkouts, authentic product quality, transparent policies.
  2. **Modern:** Clean interfaces, smooth micro-interactions, responsive grids.
  3. **Accessible:** Inclusive color contrast, screen reader compatibility, intuitive controls.
* **Voice & Tone:** Helpful, friendly, and direct. Avoid technical jargon or marketing hype. Focus on clarity, such as "Your order has been dispatched" instead of "Good news! Your awesome package is on its way."

---

## 2. Color Palette (Tailwind CSS Configuration)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e', // Primary Green (Kirana/Organic brand cue)
          600: '#16a34a',
          900: '#14532d',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b', // Secondary Gold (Ratings, Sale highlights)
          600: '#d97706',
        },
        neutral: {
          50: '#f9fafb',   // App Background
          100: '#f3f4f6',  // Card Background, Dividers
          200: '#e5e7eb',  // Borders
          500: '#6b7280',  // Muted Body Text
          900: '#111827',  // Heading Titles
        },
        semantic: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        }
      }
    }
  }
}
```

---

## 3. Typography System

* **Heading Font Stack:** **Outfit** (Google Font). A modern, friendly sans-serif that gives the platform a clean and approachable feel.
* **Body Font Stack:** **Inter** (Google Font). Designed for maximum legibility on mobile screens at small sizes.

### Type Scale Hierarchy

| Tailwind Class | Font Size | Line Height | Weight Options | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-xs` | 12px (0.75rem) | 16px | Regular (400), Medium (500) | Captions, small badges |
| `text-sm` | 14px (0.875rem)| 20px | Regular, Medium, Semibold (600)| Body descriptions, form labels |
| `text-base` | 16px (1rem) | 24px | Regular, Medium | Standard body copy |
| `text-lg` | 18px (1.125rem)| 28px | Semibold, Bold (700) | Sub-section headers |
| `text-xl` | 20px (1.25rem) | 28px | Bold | Product card titles |
| `text-3xl` | 30px (1.875rem)| 36px | Bold | Category page headers |
| `text-5xl` | 48px (3rem) | 48px | Bold | Homepage hero titles |

---

## 4. Spacing System

MegaMart uses a **4px base unit grid** to align page elements:
* **`p-1` / `m-1` (4px):** Micro-padding (e.g., badges, star icons).
* **`p-2` / `m-2` (8px):** Tight spaces (e.g., gaps between title and price).
* **`p-4` / `m-4` (16px):** Standard spacing for mobile panels, buttons, and card containers.
* **`p-6` / `m-6` (24px):** Standard spacing for desktop cards and grids.
* **`p-12` / `m-12` (48px):** Section-level spacing (e.g., gaps between carousel blocks).

---

## 5. Component Specifications

### 5.1 Buttons

```html
<!-- Primary Button -->
<button class="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors focus:ring-4 focus:ring-brand-100 disabled:bg-neutral-200 disabled:text-neutral-500">
  Add to Cart
</button>

<!-- Secondary Button -->
<button class="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold px-4 py-2 rounded-lg transition-colors focus:ring-4 focus:ring-neutral-200">
  Save to Wishlist
</button>

<!-- Ghost Button -->
<button class="bg-transparent hover:bg-neutral-100 text-neutral-600 font-medium px-3 py-1.5 rounded-lg transition-colors">
  Cancel
</button>
```

### 5.2 Form Inputs

```html
<!-- Standard Text Input -->
<div class="flex flex-col gap-1">
  <label for="email" class="text-sm font-medium text-neutral-900">Email Address</label>
  <input 
    type="email" 
    id="email" 
    placeholder="you@example.com"
    class="border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none rounded-lg px-3 py-2 text-base transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
  />
  <span class="text-xs text-semantic-error hidden">Please enter a valid email address.</span>
</div>
```

### 5.3 Product Card Component

```html
<div class="bg-white border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
  <!-- Image Container -->
  <div class="relative bg-neutral-50 aspect-square flex items-center justify-center p-4">
    <img src="/assets/product.webp" alt="Product Title" class="object-contain max-h-full max-w-full" />
    <span class="absolute top-3 left-3 bg-semantic-error text-white text-xs font-bold px-2 py-1 rounded-full">SALE -20%</span>
  </div>
  
  <!-- Info Body -->
  <div class="p-4 flex flex-col flex-grow gap-2">
    <span class="text-xs text-neutral-500 uppercase tracking-wider">Brand Name</span>
    <h3 class="text-base font-semibold text-neutral-900 line-clamp-2">Product Title Here</h3>
    
    <!-- Star Rating -->
    <div class="flex items-center gap-1">
      <span class="text-accent-500 text-sm">★ ★ ★ ★ ☆</span>
      <span class="text-xs text-neutral-500">(14)</span>
    </div>
    
    <!-- Price & Button -->
    <div class="flex items-center justify-between mt-auto pt-2">
      <div class="flex flex-col">
        <span class="text-lg font-bold text-neutral-900">₹180.00</span>
        <span class="text-xs text-neutral-500 line-through">₹220.00</span>
      </div>
      <button class="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-full transition-colors">
        <!-- SVG Plus Icon -->
      </button>
    </div>
  </div>
</div>
```

---

## 6. Accessibility & Interactivity (WCAG 2.1 AA)

* **Contrast Ratio:** Text colors must meet a minimum contrast ratio of 4.5:1 against their background (verified using Lighthouse contrast audits).
* **Focus States:** Avoid hiding default browser outlines. All focusable elements must display a distinct ring (e.g., `focus:ring-2 focus:ring-brand-500`).
* **ARIA Labels:** Interactive elements without visible text (such as icon-only close buttons) must include descriptive ARIA labels:
  ```html
  <button aria-label="Close Cart Drawer">✕</button>
  ```
* **Micro-interactions:** Interactive elements should animate with a standard transition duration of 150ms to 250ms using CSS transitions (`transition-all duration-200 ease-out`).
* **Skeleton Loaders:** Display matching content placeholders to reduce perceived page load times:
  ```html
  <div class="animate-pulse bg-neutral-100 rounded-xl h-48 w-full"></div>
  ```
