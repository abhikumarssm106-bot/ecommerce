import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Search, User, ShoppingBag, Menu, X, Heart } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onCartToggle: () => void;
  onWishlistToggle: () => void;
  onAuthToggle: () => void;
  onAdminToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  onCartToggle,
  onWishlistToggle,
  onAuthToggle,
  onAdminToggle,
}) => {
  const { cart, wishlist } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const totalCartQty = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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

  return (
    <nav className="navbar" id="navbar">
      <div className="container nav-inner">
        <a href="#hero" className="logo" id="logoLink">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 9.5C17 6.5 14.5 4 11.5 4C8.5 4 6 6.5 6 9.5C6 12.5 8.5 15 11.5 15H17V9.5H12" />
              <path d="M17 4C17 4 19.5 2 21 3.5C22.5 5 20.5 7.5 20.5 7.5" stroke="#10B981" strokeWidth="2.5" />
            </svg>
          </div>
          G Mart
        </a>

        {/* Desktop Inline Search Bar */}
        <div className="nav-search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search fresh vegetables, drinks, snacks..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* Desktop Navigation Links */}
        <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`} id="navLinks">
          <a href="#hero" onClick={() => setMobileMenuOpen(false)}>Home</a>
          <a href="#categories" onClick={() => setMobileMenuOpen(false)}>Categories</a>
          <a href="#products" onClick={() => setMobileMenuOpen(false)}>Products</a>
          <a href="#promo" onClick={() => setMobileMenuOpen(false)}>Offers</a>
          <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Reviews</a>
        </div>

        {/* Action Buttons */}
        <div className="nav-actions">
          {/* Wishlist Button */}
          <button
            className="nav-wishlist-btn"
            onClick={onWishlistToggle}
            aria-label="Open Wishlist"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'var(--clr-bg-secondary)', borderRadius: 'var(--radius-full)', color: 'var(--clr-text)', transition: 'all var(--transition)' }}
          >
            <Heart size={20} fill={wishlist.length > 0 ? 'var(--clr-accent)' : 'none'} stroke={wishlist.length > 0 ? 'var(--clr-accent)' : 'currentColor'} />
            {wishlist.length > 0 && (
              <span className="cart-badge" style={{ background: 'var(--clr-accent)' }}>{wishlist.length}</span>
            )}
          </button>

          {/* Account/User Button Wrapper */}
          <div style={{ position: 'relative' }} onMouseLeave={() => setUserMenuOpen(false)}>
            <button
              className="nav-user-btn"
              onClick={handleUserClick}
              aria-label="Account Account"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isAuthenticated ? '0 12px' : '0' }}
            >
              <User size={20} />
              {isAuthenticated && user && (
                <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'inline-block', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.firstName}
                </span>
              )}
            </button>
            {userMenuOpen && isAuthenticated && user && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'var(--clr-bg)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px',
                  minWidth: '180px',
                  zIndex: 99999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ padding: '6px 8px', fontSize: '0.75rem', color: 'var(--clr-text-secondary)', borderBottom: '1px solid var(--clr-border)', marginBottom: '4px', textAlign: 'left', wordBreak: 'break-all' }}>
                  Logged in as: <br /><strong>{user.email}</strong>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      onAdminToggle();
                      setUserMenuOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--clr-accent)',
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%'
                    }}
                  >
                    ⚙️ Admin Panel
                  </button>
                )}
                <button
                  onClick={async () => {
                    await logout();
                    setUserMenuOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--clr-danger)',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%'
                  }}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Cart Trigger Button */}
          <button className="nav-cart-btn" onClick={onCartToggle} aria-label="Open Cart">
            <ShoppingBag size={20} />
            <span className={`cart-badge ${totalCartQty > 0 ? 'show' : ''}`} id="cartBadge">
              {totalCartQty}
            </span>
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            className="nav-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};
