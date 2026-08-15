import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { productsData } from '../data/products';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { BentoCategories } from '../components/BentoCategories';
import { BannerCarousel } from '../components/BannerCarousel';
import { PromoBanner } from '../components/PromoBanner';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ProductDetails } from '../components/ProductDetails';
import { AuthModal } from '../components/AuthModal';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { AdminDashboard } from './AdminDashboard';
import { useAuth } from '../context/AuthContext';
import { MapPin, ChevronDown, Search, User } from 'lucide-react';
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

const categoryNavItems = [
  { id: 'all', name: 'Smart Buys', icon: '🛒' },
  { id: 'popular', name: 'Hot Deals', icon: '🔥' },
  { id: 'groceries', name: 'Groceries', icon: '🥬' },
  { id: 'snacks', name: 'Snacks', icon: '🥨' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
  { id: 'laundry', name: 'Daily Needs', icon: '🧺' },
  { id: 'electronics', name: 'Electronics', icon: '🎧' },
  { id: 'explore', name: 'Explore All', icon: '🔲' },
];

const storyHighlights = [
  { title: 'Daily Essentials', priceText: 'Up to 70% off', image: 'images/grocery_hero.png', category: 'groceries' },
  { title: 'The Crunch Edit', priceText: 'From ₹120', image: 'images/prod_bananas.png', category: 'snacks' },
  { title: 'Realme P4R', priceText: 'From ₹17,599*', image: 'images/grocery_hero.png', category: 'all' },
  { title: '32" Smart OLED', priceText: 'From ₹12,490*', image: 'images/grocery_hero.png', category: 'all' },
  { title: 'Cold Beverages', priceText: 'From ₹35', image: 'images/prod_bananas.png', category: 'drinks' },
  { title: 'Laundry Packs', priceText: 'From ₹99', image: 'images/grocery_hero.png', category: 'laundry' },
];

export const Home: React.FC = () => {
  const { wishlist, recentlyViewed } = useCart();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showOnlyWishlist, setShowOnlyWishlist] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'categories' | 'wishlist' | 'offers'>('home');

  // Modal / Drawer states
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    return !sessionStorage.getItem('hostel_welcome_seen');
  });
  
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
          id: v.id,
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
          expDate: staticProd?.expDate || new Date(Date.now() + 7 * 86400000).toLocaleDateString(),
          ingredients: staticProd?.ingredients || 'Natural & farm-sourced ingredients.',
          nutrition: staticProd?.nutrition || null,
          variants: variants.length > 0 ? variants : [{ name: 'Standard (500g)', priceOffset: 0, weight: '500g' }],
          reviews: staticProd?.reviews || [],
          related: staticProd?.related || ['p1', 'p2'],
          bundle: staticProd?.bundle || undefined
        };
      });

      const dbSlugs = new Set(dbProducts.map((p: any) => p.slug || getSlug(p.name)));
      const missingStaticProducts = productsData.filter(p => !dbSlugs.has(getSlug(p.name)) && !dbSlugs.has(p.id));
      setProducts([...enrichedProducts, ...missingStaticProducts]);
    } catch {
      setProducts(productsData);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleProductSelect = (productId: string) => {
    window.dispatchEvent(new CustomEvent('open-product-details', { detail: { productId } }));
  };

  // Filter products for Home catalog
  const filteredProducts = products.filter(product => {
    let matchesCategory = true;
    if (activeCategory !== 'all' && activeCategory !== 'popular' && activeCategory !== 'explore') {
      matchesCategory = (product.category || '').toLowerCase() === activeCategory.toLowerCase();
    }

    let matchesTab = true;
    if (activeCategory === 'popular') {
      matchesTab = product.badgeClass === 'new' || !product.badgeClass || product.id === 'p1' || product.id === 'p2' || product.id === 'p3' || product.id === 'p4';
    }

    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWishlist = !showOnlyWishlist || wishlist.includes(product.id);

    return matchesCategory && matchesTab && matchesSearch && matchesWishlist;
  });

  const nuttyDealsProducts = products.filter(p => p.id !== 'p9' && (p.category === 'groceries' || p.badgeClass === 'new'));
  const groceryProducts = products.filter(p => p.id !== 'p9' && p.category === 'groceries');
  const snackProducts = products.filter(p => p.id !== 'p9' && (p.category === 'snacks' || p.category === 'drinks'));

  if (showWelcome) {
    return (
      <WelcomeScreen
        onGetStarted={() => {
          setShowWelcome(false);
          sessionStorage.setItem('hostel_welcome_seen', 'true');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="app-layout">
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          setShowOnlyWishlist(false);
          if (q.trim()) {
            setCurrentTab('home');
          }
        }}
        onCartToggle={() => setIsCartOpen(!isCartOpen)}
        onWishlistToggle={() => {
          setShowOnlyWishlist(true);
          setCurrentTab('wishlist');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAuthToggle={() => setIsAuthOpen(true)}
        onAdminToggle={() => setIsAdminOpen(true)}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'wishlist') setShowOnlyWishlist(true);
          else setShowOnlyWishlist(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {currentTab === 'categories' ? (
        <div style={{ marginTop: 'var(--nav-height)' }}>
          <BentoCategories
            products={products}
            onSelectProduct={handleProductSelect}
            showToast={(msg: string) => showToast(msg, true)}
            initialCategoryId={activeCategory !== 'all' ? activeCategory : null}
            onNavigateHome={() => setCurrentTab('home')}
          />
        </div>
      ) : currentTab === 'wishlist' ? (
        <section className="grocery-store-section" style={{ marginTop: 'var(--nav-height)', minHeight: '60vh' }}>
          <div className="container">
            <div className="shelf-header-row" style={{ marginBottom: 'var(--space-md)' }}>
              <h2 className="shelf-section-title">My Wishlist Products</h2>
              <span className="grocery-item-count">
                {wishlist.length} item{wishlist.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowOnlyWishlist(false);
                  setCurrentTab('home');
                }}
                style={{ fontSize: '0.85rem', padding: '6px 16px' }}
              >
                ← Back to Home
              </button>
            </div>

            <div className="grocery-products-grid">
              {wishlist.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-4xl) 0', color: 'var(--clr-text-secondary)' }}>
                  <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>Your Wishlist is Empty</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginTop: '6px' }}>Tap the heart icon on any product to save it here.</p>
                  <button
                    className="btn-ghost"
                    style={{ marginTop: '14px' }}
                    onClick={() => setCurrentTab('home')}
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                products
                  .filter(p => wishlist.includes(p.id))
                  .map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      compact={true}
                      onSelect={() => handleProductSelect(product.id)}
                      showToast={(msg) => showToast(msg, true)}
                    />
                  ))
              )}
            </div>
          </div>
        </section>
      ) : currentTab === 'offers' ? (
        <div style={{ marginTop: 'var(--nav-height)' }}>
          <div className="container" style={{ paddingTop: '20px' }}>
            <h2 className="shelf-section-title" style={{ fontSize: '1.4rem', marginBottom: '16px' }}>🔥 Special Grand Offers & Discounts</h2>
          </div>
          <PromoBanner showToast={(msg) => showToast(msg, true)} />
          <section className="mobile-shelf-section">
            <div className="container">
              <div className="shelf-header-row">
                <h2 className="shelf-section-title">Top Value Combos</h2>
              </div>
              <div className="shelf-products-horizontal-scroll">
                {products.map(prod => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    compact={true}
                    onSelect={() => handleProductSelect(prod.id)}
                    showToast={(msg) => showToast(msg, true)}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <>
          <header className="mobile-app-top-header">
            <div className="container">
              <div className="mobile-location-row">
                <div className="location-pin-pill">
                  <MapPin size={16} className="location-pin-icon" />
                  <div className="location-info-text">
                    <span className="location-label">Location</span>
                    <span className="location-address">Talwandi Sabo, Punjab, 151302, India</span>
                  </div>
                  <ChevronDown size={14} className="location-chevron" />
                </div>
              </div>

              <div className="mobile-header-search-row">
                <div className="mobile-search-input-pill">
                  <Search size={18} className="search-pill-icon" />
                  <input
                    type="text"
                    placeholder="Search for 'Mobiles', 'Groceries', 'Snacks'..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowOnlyWishlist(false);
                    }}
                  />
                </div>
                
                <div className="mobile-profile-wrap" style={{ position: 'relative' }}>
                  <button
                    className="mobile-profile-avatar-btn"
                    onClick={() => {
                      if (isAuthenticated) {
                        setIsMobileUserMenuOpen(!isMobileUserMenuOpen);
                      } else {
                        setIsAuthOpen(true);
                      }
                    }}
                    aria-label="Account"
                  >
                    {isAuthenticated && user ? (
                      <span className="mobile-avatar-initials">
                        {`${user.firstName ? user.firstName.charAt(0) : ''}${user.lastName ? user.lastName.charAt(0) : ''}` || 'U'}
                      </span>
                    ) : (
                      <User size={20} />
                    )}
                  </button>

                  {isMobileUserMenuOpen && isAuthenticated && user && (
                    <div className="mobile-user-dropdown-card">
                      <div className="mobile-user-dropdown-header">
                        <strong style={{ fontSize: '0.92rem' }}>{user.firstName} {user.lastName}</strong>
                        <span className="mobile-user-email">{user.email}</span>
                        <span className="mobile-user-role-badge">{user.role}</span>
                      </div>
                      {isAdmin && (
                        <button
                          className="mobile-user-dropdown-item"
                          onClick={() => {
                            setIsAdminOpen(true);
                            setIsMobileUserMenuOpen(false);
                          }}
                        >
                          ⚙️ Admin Dashboard
                        </button>
                      )}
                      <button
                        className="mobile-user-dropdown-item logout"
                        onClick={() => {
                          logout();
                          setIsMobileUserMenuOpen(false);
                          showToast('Logged out successfully');
                        }}
                      >
                        🚪 Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mobile-top-categories-strip">
                {categoryNavItems.map((cat) => (
                  <button
                    key={cat.id}
                    className={`mobile-cat-tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => {
                      if (cat.id === 'explore') {
                        setCurrentTab('categories');
                        setActiveCategory('all');
                      } else {
                        setActiveCategory(cat.id);
                        setCurrentTab('categories');
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <span className="mobile-cat-tab-icon">{cat.icon}</span>
                    <span className="mobile-cat-tab-name">{cat.name}</span>
                    {activeCategory === cat.id && <span className="cat-active-line" />}
                  </button>
                ))}
              </div>

              <div className="mobile-story-cards-scroll">
                {storyHighlights.map((story, idx) => (
                  <div
                    key={idx}
                    className="mobile-story-card"
                    onClick={() => {
                      setActiveCategory(story.category);
                      setCurrentTab('categories');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <span className="story-title-tag">{story.title}</span>
                    <div className="story-card-img-wrap">
                      <img src={story.image} alt={story.title} />
                    </div>
                    <span className="story-bottom-price-pill">{story.priceText}</span>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <section className="mobile-banner-section">
            <div className="container">
              <BannerCarousel
                onSelectCategory={(cat) => {
                  setActiveCategory(cat);
                  setCurrentTab('categories');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </section>

          <section className="mobile-shelf-section">
            <div className="container">
              <div className="shelf-header-row">
                <h2 className="shelf-section-title">Nutty Deals</h2>
                <button
                  className="shelf-view-all-btn"
                  onClick={() => {
                    setActiveCategory('groceries');
                    setCurrentTab('categories');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  View all
                </button>
              </div>
              <div className="shelf-products-horizontal-scroll">
                {nuttyDealsProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    compact={true}
                    onSelect={() => handleProductSelect(prod.id)}
                    showToast={(msg) => showToast(msg, true)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="mobile-shelf-section">
            <div className="container">
              <div className="shelf-header-row">
                <h2 className="shelf-section-title">Daily Fresh Groceries</h2>
                <button
                  className="shelf-view-all-btn"
                  onClick={() => {
                    setActiveCategory('groceries');
                    setCurrentTab('categories');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  View all
                </button>
              </div>
              <div className="shelf-products-horizontal-scroll">
                {groceryProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    compact={true}
                    onSelect={() => handleProductSelect(prod.id)}
                    showToast={(msg) => showToast(msg, true)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="mobile-shelf-section">
            <div className="container">
              <div className="shelf-header-row">
                <h2 className="shelf-section-title">Crunchy Snacks & Drinks</h2>
                <button
                  className="shelf-view-all-btn"
                  onClick={() => {
                    setActiveCategory('snacks');
                    setCurrentTab('categories');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  View all
                </button>
              </div>
              <div className="shelf-products-horizontal-scroll">
                {snackProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    compact={true}
                    onSelect={() => handleProductSelect(prod.id)}
                    showToast={(msg) => showToast(msg, true)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="grocery-store-section" id="products">
            <div className="container">
              <div className="shelf-header-row" style={{ marginBottom: 'var(--space-md)' }}>
                <h2 className="shelf-section-title">
                  {searchQuery.trim() ? `Search Results for "${searchQuery}"` : 'All Store Products'}
                </h2>
                <span className="grocery-item-count">
                  {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grocery-products-grid">
                {loadingProducts ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-4xl) 0', color: 'var(--clr-text-secondary)' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading store catalog...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-4xl) 0', color: 'var(--clr-text-secondary)' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No products found</p>
                    <button
                      className="btn-ghost"
                      style={{ marginTop: '12px' }}
                      onClick={() => {
                        setActiveCategory('all');
                        setSearchQuery('');
                      }}
                    >
                      Reset Search
                    </button>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      compact={true}
                      onSelect={() => handleProductSelect(product.id)}
                      showToast={(msg) => showToast(msg, true)}
                    />
                  ))
                )}
              </div>
            </div>
          </section>

          {recentlyViewed.length > 0 && (
            <section className="mobile-shelf-section" style={{ borderTop: '1px solid var(--clr-border)', background: 'var(--clr-bg)' }}>
              <div className="container">
                <div className="shelf-header-row">
                  <h2 className="shelf-section-title">Recently Viewed Products</h2>
                </div>
                <div className="shelf-products-horizontal-scroll">
                  {recentlyViewed.map(id => {
                    const found = products.find(p => p.id === id);
                    if (!found) return null;
                    return (
                      <ProductCard
                        key={found.id}
                        product={found}
                        compact={true}
                        onSelect={() => handleProductSelect(found.id)}
                        showToast={(msg) => showToast(msg, true)}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <div id="promo">
            <PromoBanner showToast={(msg) => showToast(msg, true)} />
          </div>
        </>
      )}

      <Footer />

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

      {showWelcome && (
        <WelcomeScreen
          onGetStarted={() => {
            setShowWelcome(false);
            sessionStorage.setItem('hostel_welcome_seen', 'true');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      <div id="toastContainer" style={{ position: 'fixed', bottom: '70px', left: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.isSuccess ? 'success' : 'error'} show`} style={{ pointerEvents: 'auto' }}>
            <div className="toast-icon">{t.isSuccess ? '✓' : '⚠️'}</div>
            <div className="toast-message">{t.message}</div>
          </div>
        ))}
      </div>

      <div className="mobile-bottom-nav">
        <div
          className={`mobile-bottom-nav-item ${currentTab === 'home' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('home');
            setShowOnlyWishlist(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span>Home</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${currentTab === 'categories' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('categories');
            setShowOnlyWishlist(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Categories</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${currentTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('wishlist');
            setShowOnlyWishlist(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <span>Wishlist</span>
        </div>
        <div
          className={`mobile-bottom-nav-item ${currentTab === 'offers' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('offers');
            setShowOnlyWishlist(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <svg viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
          <span>Offers</span>
        </div>
      </div>
    </div>
  );
};
