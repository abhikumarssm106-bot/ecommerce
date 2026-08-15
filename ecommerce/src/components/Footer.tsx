import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer horizontal-pro-footer" id="footer">
      <div className="container">
        
        {/* Row 1: Brand Logo + Category Horizontal Pills */}
        <div className="footer-row-brand-nav">
          <div className="footer-brand-compact">
            <a href="#hero" className="logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 9.5C17 6.5 14.5 4 11.5 4C8.5 4 6 6.5 6 9.5C6 12.5 8.5 15 11.5 15H17V9.5H12" />
                  <path d="M17 4C17 4 19.5 2 21 3.5C22.5 5 20.5 7.5 20.5 7.5" stroke="#10B981" strokeWidth="2.5" />
                </svg>
              </div>
              <span>G Mart</span>
            </a>
            <p className="footer-tagline-text">Fresh organic groceries & essentials delivered fast.</p>
          </div>

          <div className="footer-nav-group">
            <span className="footer-group-label">Categories:</span>
            <div className="footer-nav-pills">
              <a href="#products">🥨 Snacks</a>
              <a href="#products">🛒 Groceries</a>
              <a href="#products">🥤 Drinks</a>
              <a href="#products">🧺 Laundry Essentials</a>
              <a href="#products">🥬 Organic Farms</a>
            </div>
          </div>
        </div>

        {/* Row 2: Customer Care Horizontal Links + Contact Details */}
        <div className="footer-row-care-contact">
          <div className="footer-nav-group">
            <span className="footer-group-label">Customer Care:</span>
            <div className="footer-nav-pills">
              <a href="#">🚚 Track Order</a>
              <a href="#">📦 Shipping Details</a>
              <a href="#">🔄 Returns & Refunds</a>
              <a href="#">🛡️ Freshness Guarantee</a>
              <a href="#">💬 Help & Support</a>
            </div>
          </div>

          <div className="footer-contact-horizontal">
            <span className="contact-chip">📞 +91 98765 43210</span>
            <span className="contact-divider">•</span>
            <span className="contact-chip">✉️ support@gmartgrocery.com</span>
            <span className="contact-divider">•</span>
            <span className="contact-chip">📍 Talwandi Sabo, Punjab, 151302</span>
          </div>
        </div>

        {/* Row 3: Social Links, Security Guarantee & Copyright */}
        <div className="footer-row-bottom">
          <p className="footer-copyright-text">
            &copy; 2026 G Mart Marketplace. All Rights Reserved. Freshness on demand.
          </p>

          <div className="footer-social-icons">
            <a href="#" aria-label="Facebook">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="#" aria-label="Twitter">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
