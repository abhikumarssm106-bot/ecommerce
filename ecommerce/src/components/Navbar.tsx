import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Search, User, ShoppingBag, Menu, X, Heart, Shield, LogOut } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onCartToggle: () => void;
  onWishlistToggle: () => void;
  onAuthToggle: () => void;
  onAdminToggle: () => void;
  onNavigateTab?: (tab: 'home' | 'categories' | 'wishlist' | 'offers') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  onCartToggle,
  onWishlistToggle,
  onAuthToggle,
  onAdminToggle,
  onNavigateTab,
}) => {
  const { cart, wishlist } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalCartQty = cart.reduce((sum, item) => sum + item.qty, 0);

  // Track scroll position to apply solid opaque background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen to open search event
  useEffect(() => {
    const openSearchHandler = () => {
      setIsSearchOpen(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    };
    window.addEventListener('open-search-bar', openSearchHandler);
    return () => window.removeEventListener('open-search-bar', openSearchHandler);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onNavigateTab?.('home');
    const productsSec = document.getElementById('products');
    if (productsSec) {
      productsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUserClick = () => {
    if (isAuthenticated) {
      setUserMenuOpen(!userMenuOpen);
    } else {
      onAuthToggle();
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(prev => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return next;
    });
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const first = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const last = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}` || 'U';
  };

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} id="navbar">
        <div className="container nav-inner">
          
          {/* Brand Logo */}
          <a
            href="#home"
            className="logo"
            id="logoLink"
            onClick={(e) => {
              e.preventDefault();
              onNavigateTab?.('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 9.5C17 6.5 14.5 4 11.5 4C8.5 4 6 6.5 6 9.5C6 12.5 8.5 15 11.5 15H17V9.5H12" />
                <path d="M17 4C17 4 19.5 2 21 3.5C22.5 5 20.5 7.5 20.5 7.5" stroke="#10B981" strokeWidth="2.5" />
              </svg>
            </div>
            <span>G Mart</span>
          </a>

          {/* Desktop Navigation Links (Laptop Only) */}
          <div className="nav-desktop-links">
            <a
              href="#home"
              className="desktop-nav-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigateTab?.('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Home
            </a>
            <a
              href="#categories"
              className="desktop-nav-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigateTab?.('categories');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Categories
            </a>
            <a
              href="#products"
              className="desktop-nav-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigateTab?.('home');
                const el = document.getElementById('products');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Products
            </a>
            <a
              href="#promo"
              className="desktop-nav-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigateTab?.('offers');
                const el = document.getElementById('promo');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Offers & Deals
            </a>
          </div>

          {/* Right Action Icons (Desktop & Mobile) */}
          <div className="nav-actions">
            
            {/* Search Trigger */}
            <button
              className="nav-action-btn search-btn"
              onClick={toggleSearch}
              aria-label="Search"
              title="Search store"
            >
              {isSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            {/* Wishlist Button */}
            <button
              className="nav-action-btn wishlist-btn"
              onClick={onWishlistToggle}
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart
                size={20}
                fill={wishlist.length > 0 ? '#ef4444' : 'none'}
                stroke={wishlist.length > 0 ? '#ef4444' : 'currentColor'}
              />
              {wishlist.length > 0 && (
                <span className="nav-badge-pill">{wishlist.length}</span>
              )}
            </button>

            {/* User Profile Avatar / Sign In */}
            <div className="nav-user-wrapper">
              <button
                className={`nav-user-avatar-btn ${isAuthenticated ? 'logged-in' : ''}`}
                onClick={handleUserClick}
                aria-label="Account"
                title={isAuthenticated && user ? `${user.firstName} ${user.lastName}` : "Sign In"}
              >
                {isAuthenticated && user ? (
                  <span className="avatar-initials-text">{getUserInitials()}</span>
                ) : (
                  <User size={20} />
                )}
              </button>

              {/* User Dropdown Card */}
              {userMenuOpen && isAuthenticated && user && (
                <div className="nav-user-dropdown-box">
                  <div className="user-dropdown-header">
                    <strong className="user-dropdown-name">{user.firstName} {user.lastName}</strong>
                    <span className="user-dropdown-email">{user.email}</span>
                    <span className="user-dropdown-role">{user.role}</span>
                  </div>

                  {isAdmin && (
                    <button
                      className="user-dropdown-item admin"
                      onClick={() => {
                        onAdminToggle();
                        setUserMenuOpen(false);
                      }}
                    >
                      <Shield size={16} /> Admin Dashboard
                    </button>
                  )}

                  <button
                    className="user-dropdown-item logout"
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Cart Trigger */}
            <button
              className="nav-action-btn cart-btn"
              onClick={onCartToggle}
              aria-label="Cart"
              title="Cart"
            >
              <ShoppingBag size={20} />
              {totalCartQty > 0 && (
                <span className="nav-badge-pill cart-count">{totalCartQty}</span>
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              className="nav-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

          </div>
        </div>

        {/* Expandable Top Search Bar */}
        {isSearchOpen && (
          <div className="nav-search-expanded-bar">
            <div className="container nav-search-expanded-inner">
              <Search size={18} className="search-bar-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search groceries, fruits, snacks, essentials..."
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
              />
              {searchQuery && (
                <button
                  className="search-bar-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear"
                >
                  <X size={16} />
                </button>
              )}
              <button
                className="search-bar-close"
                onClick={() => setIsSearchOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── MOBILE MENU DRAWER (Only when hamburger open) ── */}
      {mobileMenuOpen && (
        <>
          <div
            className="mobile-nav-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="mobile-nav-drawer-card">
            <div className="mobile-nav-drawer-header">
              <div className="drawer-header-brand">
                <div className="drawer-logo-icon">G</div>
                <strong>G Mart Navigation</strong>
              </div>
              <button
                className="drawer-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-nav-drawer-links">
              <a
                href="#home"
                className="mobile-drawer-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab?.('home');
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <span className="drawer-link-emoji">🏠</span>
                <div className="drawer-link-text">
                  <strong>Home Page</strong>
                  <span>Main store feed & deals</span>
                </div>
              </a>

              <a
                href="#categories"
                className="mobile-drawer-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab?.('categories');
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <span className="drawer-link-emoji">🗂️</span>
                <div className="drawer-link-text">
                  <strong>Categories & Aisles</strong>
                  <span>Explore 900+ farm items</span>
                </div>
              </a>

              <a
                href="#products"
                className="mobile-drawer-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab?.('home');
                  setMobileMenuOpen(false);
                  const el = document.getElementById('products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span className="drawer-link-emoji">🛍️</span>
                <div className="drawer-link-text">
                  <strong>All Products</strong>
                  <span>Full grocery store catalog</span>
                </div>
              </a>

              <a
                href="#promo"
                className="mobile-drawer-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab?.('offers');
                  setMobileMenuOpen(false);
                  const el = document.getElementById('promo');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span className="drawer-link-emoji">🔥</span>
                <div className="drawer-link-text">
                  <strong>Offers & Discounts</strong>
                  <span>Super saver combo deals</span>
                </div>
              </a>

              <a
                href="#wishlist"
                className="mobile-drawer-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab?.('wishlist');
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <span className="drawer-link-emoji">❤️</span>
                <div className="drawer-link-text">
                  <strong>My Wishlist</strong>
                  <span>{wishlist.length} saved items</span>
                </div>
              </a>
            </div>

            {/* Bottom Drawer User Status */}
            <div className="mobile-drawer-footer">
              {isAuthenticated && user ? (
                <div className="drawer-user-info-box">
                  <div className="drawer-user-avatar">{getUserInitials()}</div>
                  <div className="drawer-user-details">
                    <strong>{user.firstName} {user.lastName}</strong>
                    <span>{user.email}</span>
                  </div>
                  <button
                    className="drawer-logout-btn"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    title="Sign Out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button
                  className="drawer-login-btn"
                  onClick={() => {
                    onAuthToggle();
                    setMobileMenuOpen(false);
                  }}
                >
                  <User size={18} /> Sign In / Create Account
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
