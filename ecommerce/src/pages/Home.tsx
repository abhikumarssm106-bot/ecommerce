import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { productsData } from '../data/products';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { PromoBanner } from '../components/PromoBanner';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ProductDetails } from '../components/ProductDetails';
import { AuthModal } from '../components/AuthModal';
import { AdminDashboard } from './AdminDashboard';
import { Search } from 'lucide-react';
import api from '../services/api';
import type { Product } from '../types';

interface Toast {
  id: number;
  message: string;
  isSuccess: boolean;
}

const getSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const Home: React.FC = () => {
  const { wishlist, recentlyViewed } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'popular' | 'bestsellers' | 'recommended'>('popular');
  const [showOnlyWishlist, setShowOnlyWishlist] = useState<boolean>(false);

  // Modal / Drawer states
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  
  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, isSuccess: boolean = true) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, isSuccess }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data } = await api.get('/products?limit=100');
      const dbProducts = data.data;

      const enrichedProducts = dbProducts.map((dbProd: any) => {
        const staticProd = productsData.find(p => p.id === dbProd.id || getSlug(p.name) === dbProd.slug);
        
        const basePrice = dbProd.price;
        const variants = dbProd.variants.map((v: any) => ({
          id: v.id, // Store DB variant ID
          name: v.size || 'Standard',
          priceOffset: Number(v.price) - basePrice,
          weight: v.size || 'Standard',
        }));

        return {
          id: dbProd.id,
          name: dbProd.name,
          brand: staticProd?.brand || 'G Mart Farms',
          category: dbProd.category?.slug || 'groceries',
          price: basePrice,
          oldPrice: staticProd?.oldPrice || (basePrice * 1.25),
          image: dbProd.imageUrl || staticProd?.image || 'images/prod_bananas.png',
          imageStyle: staticProd?.imageStyle || '',
          weight: dbProd.variants?.[0]?.size || staticProd?.weight || '1 unit',
          badge: dbProd.isFeatured ? 'Featured' : staticProd?.badge || '',
          badgeClass: staticProd?.badgeClass || '',
          stock: dbProd.variants?.[0]?.stock > 0 ? `In Stock` : `Out of Stock`,
          stockClass: dbProd.variants?.[0]?.stock <= 5 ? 'low' : '',
          description: dbProd.description || staticProd?.description || '',
          features: staticProd?.features || [
            '100% Quality Guaranteed',
            'Sourced sustainably',
            'Inspected for maximum freshness'
          ],
          usage: staticProd?.usage || 'Consume fresh or cook as desired.',
          origin: staticProd?.origin || 'Local Farms',
          storage: staticProd?.storage || 'Store in a cool, dry place.',
          mfgDate: staticProd?.mfgDate || new Date().toLocaleDateString(),
          expDate: staticProd?.expDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          ingredients: staticProd?.ingredients || '',
          nutrition: staticProd?.nutrition || null,
          variants,
          reviews: staticProd?.reviews || [],
          related: staticProd?.related || [],
          bundle: staticProd?.bundle || undefined
        };
      });

      setProducts(enrichedProducts);
    } catch (err) {
      console.error('Failed to load products from DB:', err);
      // Fallback to static productsData
      setProducts(productsData);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Listen to custom dispatch events from PDP/Cart details
  useEffect(() => {
    const openCart = () => setIsCartOpen(true);
    const openCheckout = () => {
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
    };
    const openAuth = () => setIsAuthOpen(true);

    window.addEventListener('open-cart-drawer', openCart);
    window.addEventListener('open-checkout-modal', openCheckout);
    window.addEventListener('open-auth-modal', openAuth);

    return () => {
      window.removeEventListener('open-cart-drawer', openCart);
      window.removeEventListener('open-checkout-modal', openCheckout);
      window.removeEventListener('open-auth-modal', openAuth);
    };
  }, []);

  const handleProductSelect = (id: string) => {
    window.location.hash = `#product/${id}`;
  };

  const handleCategoryCardClick = (categoryFilter: string) => {
    setActiveCategory(categoryFilter);
    setShowOnlyWishlist(false);
    const shopSection = document.getElementById('products');
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getCategoryCount = (catSlug: string) => {
    return products.filter(p => p.category === catSlug).length;
  };

  // Filter grid products (excluding weekly basket p9)
  const filteredProducts = products.filter(product => {
    if (product.id === 'p9') return false;

    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    
    let matchesTab = false;
    if (activeTab === 'popular') {
      matchesTab = product.badgeClass === 'new' || !product.badgeClass || product.id === 'p1' || product.id === 'p2' || product.id === 'p3' || product.id === 'p4';
    } else if (activeTab === 'bestsellers') {
      matchesTab = product.badgeClass === 'sale' || product.id === 'p5' || product.id === 'p6';
    } else if (activeTab === 'recommended') {
      matchesTab = product.id === 'p7' || product.id === 'p8';
    }

    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWishlist = !showOnlyWishlist || wishlist.includes(product.id);

    return matchesCategory && matchesTab && matchesSearch && matchesWishlist;
  });

  return (
    <div className="app-layout">
      {/* Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          setShowOnlyWishlist(false);
        }}
        onCartToggle={() => setIsCartOpen(!isCartOpen)}
        onWishlistToggle={() => {
          setShowOnlyWishlist(!showOnlyWishlist);
          const shopSection = document.getElementById('products');
          if (shopSection) {
            shopSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
        onAuthToggle={() => setIsAuthOpen(true)}
        onAdminToggle={() => setIsAdminOpen(true)}
      />

      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="hero-bg">
          <img src="images/grocery_hero.png" alt="Fresh Organic Groceries Banner" />
        </div>
        <div className="container">
          <div className="hero-content">
            <span className="hero-tag" style={{ color: 'var(--clr-accent)' }}>Fresh Essentials</span>
            <h1 className="hero-title">Fresh Groceries <br />Delivered to <span className="accent">Your Doorstep</span></h1>
            <p className="hero-desc">Groceries, Snacks, Drinks, and Daily Essentials Delivered Fast. Get quality ingredients on demand.</p>
            <div className="hero-actions">
              <a href="#products" className="btn-primary" style={{ color: '#ffffff' }}>
                Shop Now
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </a>
              <a href="#categories" className="btn-ghost">Browse Categories</a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <h4>15k+</h4>
                <p>Daily Deliveries</p>
              </div>
              <div className="hero-stat">
                <h4>10-Min</h4>
                <p>Average Speed</p>
              </div>
              <div className="hero-stat">
                <h4>Free</h4>
                <p>Delivery over $30</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Sticky Search Bar */}
      <div className="mobile-search-sticky" id="mobileSearchSticky">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search groceries, snacks, drinks..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowOnlyWishlist(false);
            }}
          />
        </div>
      </div>

      {/* Marquee running text */}
      <section className="marquee-section">
        <div className="marquee-track">
          <div className="marquee-item"><span className="dot"></span> Freshness Guaranteed</div>
          <div className="marquee-item"><span className="dot"></span> 10-Min Express Local Delivery</div>
          <div className="marquee-item"><span className="dot"></span> Free Shipping on Orders Over $30</div>
          <div className="marquee-item"><span className="dot"></span> Secure Encrypted Payment Systems</div>
          
          <div className="marquee-item"><span className="dot"></span> Freshness Guaranteed</div>
          <div className="marquee-item"><span className="dot"></span> 10-Min Express Local Delivery</div>
          <div className="marquee-item"><span className="dot"></span> Free Shipping on Orders Over $30</div>
          <div className="marquee-item"><span className="dot"></span> Secure Encrypted Payment Systems</div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="categories-section reveal visible" id="categories">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Explore Store</span>
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Click to filter products instantly. Discover snacks, fresh fruits, household essentials, and drinks.</p>
          </div>

          <div className="categories-grid">
            <div className="category-card" onClick={() => handleCategoryCardClick('snacks')}>
              <div className="category-card-bg">🥨</div>
              <div className="category-card-overlay"></div>
              <div className="category-card-content">
                <h3>Snacks</h3>
                <p>{getCategoryCount('snacks')} Item{getCategoryCount('snacks') !== 1 ? 's' : ''}</p>
              </div>
              <div className="category-arrow">
                <svg viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
              </div>
            </div>

            <div className="category-card" onClick={() => handleCategoryCardClick('groceries')}>
              <div className="category-card-bg">🛒</div>
              <div className="category-card-overlay"></div>
              <div className="category-card-content">
                <h3>Groceries</h3>
                <p>{getCategoryCount('groceries')} Item{getCategoryCount('groceries') !== 1 ? 's' : ''}</p>
              </div>
              <div className="category-arrow">
                <svg viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
              </div>
            </div>

            <div className="category-card" onClick={() => handleCategoryCardClick('laundry')}>
              <div className="category-card-bg">🧺</div>
              <div className="category-card-overlay"></div>
              <div className="category-card-content">
                <h3>Laundry Essentials</h3>
                <p>{getCategoryCount('laundry')} Item{getCategoryCount('laundry') !== 1 ? 's' : ''}</p>
              </div>
              <div className="category-arrow">
                <svg viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
              </div>
            </div>

            <div className="category-card" onClick={() => handleCategoryCardClick('drinks')}>
              <div className="category-card-bg">🥤</div>
              <div className="category-card-overlay"></div>
              <div className="category-card-content">
                <h3>Drinks</h3>
                <p>{getCategoryCount('drinks')} Item{getCategoryCount('drinks') !== 1 ? 's' : ''}</p>
              </div>
              <div className="category-arrow">
                <svg viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlight features */}
      <section className="reveal visible" style={{ padding: 'var(--space-4xl) 0', backgroundColor: 'var(--clr-bg-secondary)', borderTop: '1px solid var(--clr-border)', borderBottom: '1px solid var(--clr-border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2xl)', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🥦</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Fresh Products</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-secondary)' }}>Direct from organic local farms to your home daily.</p>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>⚡</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Fast Delivery</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-secondary)' }}>Average delivery time of just 10 minutes locally.</p>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🛡️</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Secure Payments</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-secondary)' }}>100% secure payment checkout verified processes.</p>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🔄</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Easy Returns</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-secondary)' }}>Hassle-free refunds if items don't meet your standards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="products-section reveal visible" id="products">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">
              {showOnlyWishlist ? 'Your Collection' : 'G Mart Aisles'}
            </span>
            <h2 className="section-title" id="aisleTitle">
              {showOnlyWishlist ? 'Wishlisted Products' : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Products`}
            </h2>
            <p className="section-subtitle">Reach any product in less than 3 clicks using our interactive tab filters below.</p>
          </div>

          {/* Filter Tabs */}
          {!showOnlyWishlist && (
            <>
              <div className="filter-tabs">
                <button className={`filter-tab ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All Items</button>
                <button className={`filter-tab ${activeCategory === 'groceries' ? 'active' : ''}`} onClick={() => setActiveCategory('groceries')}>Groceries</button>
                <button className={`filter-tab ${activeCategory === 'snacks' ? 'active' : ''}`} onClick={() => setActiveCategory('snacks')}>Snacks</button>
                <button className={`filter-tab ${activeCategory === 'drinks' ? 'active' : ''}`} onClick={() => setActiveCategory('drinks')}>Drinks</button>
                <button className={`filter-tab ${activeCategory === 'laundry' ? 'active' : ''}`} onClick={() => setActiveCategory('laundry')}>Laundry</button>
              </div>

              {/* Secondary app tabs (Popular, Bestsellers, Recommended) */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)', marginTop: 'calc(var(--space-md) * -1)', marginBottom: 'var(--space-2xl)' }}>
                <button
                  className={`filter-tab ${activeTab === 'popular' ? 'active' : ''}`}
                  onClick={() => setActiveTab('popular')}
                  style={{ fontSize: '0.75rem', padding: '6px 14px', border: 'none', background: activeTab === 'popular' ? '' : 'transparent' }}
                >
                  🔥 Popular
                </button>
                <button
                  className={`filter-tab ${activeTab === 'bestsellers' ? 'active' : ''}`}
                  onClick={() => setActiveTab('bestsellers')}
                  style={{ fontSize: '0.75rem', padding: '6px 14px', border: 'none', background: activeTab === 'bestsellers' ? '' : 'transparent' }}
                >
                  ⭐ Bestsellers
                </button>
                <button
                  className={`filter-tab ${activeTab === 'recommended' ? 'active' : ''}`}
                  onClick={() => setActiveTab('recommended')}
                  style={{ fontSize: '0.75rem', padding: '6px 14px', border: 'none', background: activeTab === 'recommended' ? '' : 'transparent' }}
                >
                  💡 Recommended
                </button>
              </div>
            </>
          )}

          {showOnlyWishlist && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-xl)' }}>
              <button
                className="btn-ghost"
                onClick={() => setShowOnlyWishlist(false)}
                style={{ fontSize: '0.85rem', padding: '8px 20px' }}
              >
                Back to Store Browser
              </button>
            </div>
          )}

          {/* Products Grid list */}
          <div className="products-grid">
            {loadingProducts ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-4xl) 0', color: 'var(--clr-text-secondary)' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading dynamic store catalog...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-4xl) 0', color: 'var(--clr-text-secondary)' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>No products found matching filters</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)', marginTop: '6px' }}>Try typing another search term or resetting your filter tabs.</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={() => handleProductSelect(product.id)}
                  showToast={(msg) => showToast(msg, true)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="reveal visible" style={{ padding: 'var(--space-4xl) 0', backgroundColor: 'var(--clr-bg)', borderTop: '1px solid var(--clr-border)' }}>
          <div className="container">
            <div className="section-header" style={{ marginBottom: 'var(--space-xl)', textAlign: 'left' }}>
              <span className="section-tag" style={{ marginBottom: 'var(--space-sm)' }}>Based on your visits</span>
              <h2 className="section-title" style={{ fontSize: '1.5rem', textAlign: 'left', margin: 0 }}>Recently Viewed</h2>
            </div>
            <div className="horizontal-carousel">
              {recentlyViewed.map(id => {
                const found = products.find(p => p.id === id);
                if (!found) return null;
                return (
                  <ProductCard
                    key={found.id}
                    product={found}
                    onSelect={() => handleProductSelect(found.id)}
                    showToast={(msg) => showToast(msg, true)}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Weekly Deal Banner Countdown */}
      <PromoBanner showToast={(msg) => showToast(msg, true)} />

      {/* Customer testimonials */}
      <section className="testimonials-section reveal visible" id="testimonials">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Reviews</span>
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">Real feedback from local patrons about product quality, delivery speed, and customer care.</p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="testimonial-text">"The organic bananas and red apples arrived perfectly fresh. The 10-minute delivery is an absolute lifesaver when you are in the middle of preparing dinner!"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg, var(--clr-accent), #3b82f6)' }}>AM</div>
                <div className="testimonial-author-info">
                  <h4>Alexander Mercer</h4>
                  <p>Verified Buyer • London, UK</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="testimonial-text">"I order our family's weekly milk, fresh juices, and laundry detergent here. Everything comes packed safely in eco-friendly, plastic-free bags. Wonderful service!"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg, var(--clr-accent), #3b82f6)' }}>ES</div>
                <div className="testimonial-author-info">
                  <h4>Eleanor Sterling</h4>
                  <p>Verified Buyer • Paris, France</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="testimonial-text">"Best selection of organic snacks and fresh juices. Everything arrives crispy, cold, and exactly on time. Highly recommend their secure, fast delivery options."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg, var(--clr-accent), #3b82f6)' }}>TK</div>
                <div className="testimonial-author-info">
                  <h4>Takeshi Kenzo</h4>
                  <p>Verified Buyer • Tokyo, Japan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section reveal visible">
        <div className="container">
          <div className="newsletter-card">
            <h2 className="newsletter-title">Get Fresh Deals in Your Inbox</h2>
            <p className="newsletter-desc">Subscribe to receive weekly coupon codes, notifications on fresh farm arrivals, and cooking recipes.</p>
            <form className="newsletter-form" onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements[0] as HTMLInputElement);
              if (input.value.trim()) {
                showToast(`Thank you! ${input.value} has been added to G Mart inner circle.`, true);
                input.value = '';
              }
            }}>
              <input type="email" placeholder="Enter your email address" required aria-label="Email for newsletter" />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Drawer & Modal Overlays */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)} />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <ProductDetails products={products} />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        showToast={showToast}
      />

      {isAdminOpen && (
        <AdminDashboard
          onClose={() => {
            setIsAdminOpen(false);
            loadProducts();
          }}
          showToast={showToast}
        />
      )}

      {/* Toast Notifications Box */}
      <div id="toastContainer" style={{ position: 'fixed', bottom: '32px', left: '32px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.isSuccess ? 'success' : 'error'} show`} style={{ pointerEvents: 'auto' }}>
            <div className="toast-icon">{t.isSuccess ? '✓' : '⚠️'}</div>
            <div className="toast-message">{t.message}</div>
          </div>
        ))}
      </div>

      {/* Mobile Bottom Navigation Bar (Flipkart/Blinkit Style) */}
      <div className="mobile-bottom-nav">
        <div
          className={`mobile-bottom-nav-item ${activeCategory === 'all' && !showOnlyWishlist ? 'active' : ''}`}
          onClick={() => {
            setActiveCategory('all');
            setShowOnlyWishlist(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span>Home</span>
        </div>
        <div
          className="mobile-bottom-nav-item"
          onClick={() => {
            const input = document.getElementById('mobileSearchInput');
            if (input) {
              input.focus();
            }
            const stickySearch = document.getElementById('mobileSearchSticky');
            if (stickySearch) {
              stickySearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        >
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>Search</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${activeCategory !== 'all' && !showOnlyWishlist ? 'active' : ''}`}
          onClick={() => {
            const catSec = document.getElementById('categories');
            if (catSec) {
              catSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        >
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Categories</span>
        </div>
        <div
          className="mobile-bottom-nav-item"
          onClick={() => setIsCartOpen(true)}
        >
          <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          <span>Cart</span>
        </div>
      </div>
    </div>
  );
};
