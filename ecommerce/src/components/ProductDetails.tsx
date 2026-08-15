import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import type { Product, Variant } from '../types';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { formatINR } from '../utils/formatCurrency';

const getFilterStyle = (styleStr?: string): React.CSSProperties | undefined => {
  if (!styleStr) return undefined;
  if (styleStr.includes('filter: ')) {
    const filterValue = styleStr.split('filter: ')[1]?.split(';')[0];
    return filterValue ? { filter: filterValue } : undefined;
  }
  return { filter: styleStr };
};

interface ProductDetailsProps {
  products: Product[];
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ products }) => {
  const { addToCart, cart, addToRecentlyViewed } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [active, setActive] = useState<boolean>(false);
  
  const [currentQty, setCurrentQty] = useState<number>(1);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [activeImage, setActiveImage] = useState<string>('');
  const [activeImageStyle, setActiveImageStyle] = useState<string>('');
  const [activeThumbIdx, setActiveThumbIdx] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Hash route parsing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#product\/([a-zA-Z0-9_-]+)$/);
      
      if (match && products.length > 0) {
        const productId = match[1];
        const found = products.find(p => p.id === productId);
        if (found) {
          setProduct(found);
          setActive(true);
          setCurrentQty(1);
          setSelectedVariantIndex(0);
          setActiveImage(found.image);
          setActiveImageStyle(found.imageStyle || '');
          setActiveThumbIdx(0);
          addToRecentlyViewed(found.id);
          
          // Lock scrolling on main body
          document.body.style.overflow = 'hidden';
          if (containerRef.current) {
            containerRef.current.scrollTop = 0;
          }
        } else {
          window.location.hash = '';
        }
      } else if (!match) {
        setActive(false);
        document.body.style.overflow = '';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Run initially and whenever products update
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.body.style.overflow = '';
    };
  }, [products]);

  if (!product) return <div className={`product-details-page ${active ? 'active' : ''}`} id="productDetailsPage" />;

  const activeVariant: Variant = product.variants[selectedVariantIndex] || product.variants[0];
  const activePrice = product.price + activeVariant.priceOffset;
  const originalPrice = product.oldPrice ? (product.oldPrice + activeVariant.priceOffset) : null;
  const discountPercent = originalPrice ? Math.round(((originalPrice - activePrice) / originalPrice) * 100) : null;

  // Handle closing drawer
  const handleClose = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = '';
    }
  };

  const handleAddToCart = () => {
    const fullItemName = `${product.name} (${activeVariant.weight})`;
    addToCart(
      product.id,
      fullItemName,
      activePrice,
      product.image,
      currentQty,
      activeVariant.name,
      activeVariant.weight,
      (activeVariant as any).id // DB variantId
    );
    window.dispatchEvent(new CustomEvent('open-cart-drawer'));
  };

  const handleBuyNow = () => {
    handleAddToCart();
    handleClose();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-checkout-modal'));
    }, 500);
  };

  const handleAddBundle = () => {
    if (!product.bundle) return;
    const discountFactor = 1 - product.bundle.discount;
    
    // Add main item with discount
    addToCart(
      product.id,
      `${product.name} (Combo)`,
      product.price * discountFactor,
      product.image,
      1,
      activeVariant.name,
      activeVariant.weight,
      (activeVariant as any).id
    );

    // Add each bundle item
    product.bundle.items.forEach(itemId => {
      const itemInfo = products.find(p => p.id === itemId);
      if (itemInfo) {
        const itemVariant = itemInfo.variants[0];
        addToCart(
          itemInfo.id,
          `${itemInfo.name} (Combo)`,
          itemInfo.price * discountFactor,
          itemInfo.image,
          1,
          itemVariant.name,
          itemVariant.weight,
          (itemVariant as any).id
        );
      }
    });

    window.dispatchEvent(new CustomEvent('open-cart-drawer'));
  };

  // Thumbnail configurations
  const thumbnails = [
    { url: product.image, style: product.imageStyle || '' },
    { url: product.image, style: (product.imageStyle || '') + ' hue-rotate(85deg) saturate(1.2)' },
    { url: product.image, style: (product.imageStyle || '') + ' saturate(1.8) contrast(1.1)' }
  ];

  const handleThumbClick = (url: string, style: string, idx: number) => {
    setActiveImage(url);
    setActiveImageStyle(style);
    setActiveThumbIdx(idx);
  };

  // Calculate bundle prices
  let bundleOldSum = product.price;
  if (product.bundle) {
    product.bundle.items.forEach(itemId => {
      const item = products.find(p => p.id === itemId);
      if (item) bundleOldSum += item.price;
    });
  }
  const bundlePrice = product.bundle ? (bundleOldSum * (1 - product.bundle.discount)) : 0;

  const cartTotalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className={`product-details-page ${active ? 'active' : ''}`} id="productDetailsPage" ref={containerRef}>
      {/* Sticky Header Bar */}
      <header className="pdp-header">
        <div className="container pdp-header-inner">
          <button className="pdp-back-btn" onClick={handleClose} aria-label="Close Details">
            <ArrowLeft size={24} />
          </button>
          <div className="pdp-header-title">
            <span className="pdp-brand-header" id="pdpHeaderBrand">{product.brand}</span>
            <h2 className="pdp-name-header" id="pdpHeaderName">{product.name}</h2>
          </div>
          <button className="pdp-cart-btn" onClick={() => { handleClose(); setTimeout(() => window.dispatchEvent(new CustomEvent('open-cart-drawer')), 300); }} aria-label="Open Cart">
            <ShoppingBag size={22} />
            {cartTotalQty > 0 && <span className="cart-badge show" id="pdpCartBadge">{cartTotalQty}</span>}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="pdp-content">
        <div className="container">
          <div className="pdp-grid">
            
            {/* Column 1: Image Gallery */}
            <div className="pdp-gallery-col">
              <div className="pdp-main-image-wrap">
                <img
                  id="pdpMainImage"
                  src={activeImage}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('unsplash')) {
                      target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
                    }
                  }}
                  style={getFilterStyle(activeImageStyle)}
                />
                {product.badge && (
                  <span className={`product-badge ${product.badgeClass || 'new'}`} id="pdpBadge">
                    {product.badge}
                  </span>
                )}
              </div>
              
              <div className="pdp-thumbnails" id="pdpThumbnails">
                {thumbnails.map((t, idx) => (
                  <button
                    key={idx}
                    className={`pdp-thumb ${activeThumbIdx === idx ? 'active' : ''}`}
                    onClick={() => handleThumbClick(t.url, t.style, idx)}
                  >
                    <img
                      src={t.url}
                      alt={`Thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('unsplash')) {
                          target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
                        }
                      }}
                      style={getFilterStyle(t.style)}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: Information & Purchase */}
            <div className="pdp-info-col">
              <div className="pdp-category-pill" id="pdpCategory">{product.category}</div>
              <h1 className="pdp-title" id="pdpName">{product.name}</h1>
              <div className="pdp-brand-row">Brand: <span id="pdpBrand" className="bold">{product.brand}</span></div>
              <div className="pdp-weight-row" id="pdpWeight">Size: {activeVariant.weight}</div>
              
              {/* Pricing */}
              <div className="pdp-price-row">
                <span className="pdp-price" id="pdpPrice">{formatINR(activePrice)}</span>
                {originalPrice && (
                  <>
                    <span className="pdp-price-old" id="pdpOldPrice">{formatINR(originalPrice)}</span>
                    <span className="pdp-discount-badge" id="pdpDiscount">{discountPercent}% OFF</span>
                  </>
                )}
              </div>

              {/* Variants Selector */}
              <div className="pdp-variants-section">
                <h3>Select Pack Size / Variant</h3>
                <div className="pdp-variants-grid" id="pdpVariants">
                  {product.variants.map((v, idx) => {
                    const diffText = v.priceOffset > 0 ? ` (+ ${formatINR(v.priceOffset)})` : '';
                    return (
                      <button
                        key={idx}
                        className={`pdp-variant-pill ${selectedVariantIndex === idx ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedVariantIndex(idx);
                        }}
                      >
                        {v.name}{diffText}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock Status */}
              <div className="pdp-stock-row">
                Availability: <span className={`pdp-stock-badge ${product.stockClass === 'low' ? 'low' : ''}`} id="pdpStock">
                  {product.stock}
                </span>
              </div>

              {/* Desktop Actions Row */}
              <div className="pdp-actions-row">
                <div className="pdp-qty-selector">
                  <button className="pdp-qty-btn" onClick={() => setCurrentQty(q => Math.max(1, q - 1))} aria-label="Decrease Quantity">−</button>
                  <span className="pdp-qty-value" id="pdpQtyValue">{currentQty}</span>
                  <button className="pdp-qty-btn" onClick={() => setCurrentQty(q => q + 1)} aria-label="Increase Quantity">+</button>
                </div>
                <button className="btn-primary" onClick={handleAddToCart} style={{ flex: 1, color: '#ffffff' }}>
                  Add to Cart ({formatINR(activePrice * currentQty)})
                </button>
                <button className="btn-ghost" onClick={handleBuyNow}>
                  Buy Now
                </button>
              </div>

              {/* Description */}
              <div className="pdp-section pdp-description-section">
                <h3>Product Description</h3>
                <p id="pdpDescription">{product.description}</p>
                
                <h4>Key Features & Benefits</h4>
                <ul className="pdp-features-list" id="pdpFeatures">
                  {product.features.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
                
                <h4>Usage Instructions</h4>
                <p id="pdpUsage">{product.usage}</p>
              </div>

              {/* Additional Details Accordion/Grid */}
              <div className="pdp-section pdp-specs-section">
                <h3>Additional Information</h3>
                <div className="pdp-specs-grid">
                  <div className="pdp-spec-item">
                    <span className="spec-label">Country of Origin</span>
                    <span className="spec-value" id="pdpOrigin">{product.origin}</span>
                  </div>
                  <div className="pdp-spec-item">
                    <span className="spec-label">Storage Conditions</span>
                    <span className="spec-value" id="pdpStorage">{product.storage}</span>
                  </div>
                  <div className="pdp-spec-item">
                    <span className="spec-label">Manufacturing Date</span>
                    <span className="spec-value" id="pdpMfgDate">{product.mfgDate}</span>
                  </div>
                  <div className="pdp-spec-item">
                    <span className="spec-label">Expiry Date</span>
                    <span className="spec-value" id="pdpExpDate">{product.expDate}</span>
                  </div>
                </div>

                {/* Ingredients Section */}
                {product.ingredients && (
                  <div id="pdpIngredientsArea" className="pdp-ingredients-area">
                    <h4>Ingredients</h4>
                    <p id="pdpIngredients" style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5 }}>
                      {product.ingredients}
                    </p>
                  </div>
                )}

                {/* Nutrition Facts Table */}
                {product.nutrition && (
                  <div id="pdpNutritionArea" className="pdp-nutrition-area">
                    <h4>Nutritional Information (per 100g)</h4>
                    <table className="pdp-nutrition-table">
                      <thead>
                        <tr>
                          <th>Nutrient</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody id="pdpNutritionTableBody">
                        {Object.entries(product.nutrition).map(([nutrient, amount]) => (
                          <tr key={nutrient}>
                            <td>{nutrient}</td>
                            <td>{amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Frequently Bought Together Bundle */}
              {product.bundle && (
                <div className="pdp-section pdp-bundle-section" id="pdpBundleSection">
                  <h3>Frequently Bought Together</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)', marginBottom: 'var(--space-md)' }}>
                    Save extra with this selected combo bundle pack!
                  </p>
                  <div className="pdp-bundle-wrap">
                    <div className="pdp-bundle-items" id="pdpBundleItems">
                      {/* Current item card */}
                      <div className="pdp-bundle-item-card">
                        <img src={product.image} alt={product.name} style={getFilterStyle(product.imageStyle)} />
                        <span className="pdp-bundle-item-name">{product.name}</span>
                        <span className="pdp-bundle-item-price">{formatINR(product.price)}</span>
                      </div>
                      
                      {/* Plus symbols and combo items */}
                      {product.bundle.items.map((itemId) => {
                        const itemInfo = products.find(p => p.id === itemId);
                        if (!itemInfo) return null;
                        return (
                          <React.Fragment key={itemId}>
                            <span className="pdp-bundle-plus">+</span>
                            <div className="pdp-bundle-item-card">
                              <img src={itemInfo.image} alt={itemInfo.name} style={getFilterStyle(itemInfo.imageStyle)} />
                              <span className="pdp-bundle-item-name">{itemInfo.name}</span>
                              <span className="pdp-bundle-item-price">{formatINR(itemInfo.price)}</span>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                    
                    <div className="pdp-bundle-checkout">
                      <div className="pdp-bundle-price">
                        <span className="bundle-label">Bundle Price:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="bundle-price-val" id="pdpBundleTotal">{formatINR(bundlePrice)}</span>
                          <span className="bundle-price-old" id="pdpBundleOldTotal">{formatINR(bundleOldSum)}</span>
                        </div>
                        <span className="bundle-savings" id="pdpBundleSavings">
                          Save {Math.round(product.bundle.discount * 100)}% on Combo Bundle!
                        </span>
                      </div>
                      <button className="btn-primary" onClick={handleAddBundle} style={{ fontSize: '0.85rem', padding: '10px 20px', color: '#ffffff' }}>
                        Add Bundle ({formatINR(bundlePrice)})
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Products */}
              <div className="pdp-section pdp-related-section">
                <h3>Related Products</h3>
                <div className="horizontal-carousel" id="pdpRelatedContainer">
                  {product.related.map((relatedId) => {
                    const relInfo = products.find(p => p.id === relatedId);
                    if (!relInfo) return null;
                    return (
                      <div
                        className="product-card"
                        key={relatedId}
                        style={{ minWidth: '160px', padding: 'var(--space-sm)' }}
                        onClick={() => {
                          window.location.hash = `#product/${relatedId}`;
                        }}
                      >
                        <div className="product-img-wrap" style={{ height: '100px' }}>
                          <img src={relInfo.image} alt={relInfo.name} style={getFilterStyle(relInfo.imageStyle)} />
                          {relInfo.badge && (
                            <span className={`product-badge ${relInfo.badgeClass || 'new'}`}>{relInfo.badge}</span>
                          )}
                        </div>
                        <div className="product-info" style={{ padding: '8px 0 0 0' }}>
                          <h3 className="product-name" style={{ fontSize: '0.75rem', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {relInfo.name}
                          </h3>
                          <span className="product-weight" style={{ fontSize: '0.65rem' }}>{relInfo.weight.split(' ')[0]}</span>
                          <div className="product-price-row" style={{ marginTop: '4px' }}>
                            <span className="product-price" style={{ fontSize: '0.85rem' }}>{formatINR(relInfo.price)}</span>
                            {relInfo.oldPrice && (
                              <span className="product-price-old">{formatINR(relInfo.oldPrice)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="pdp-mobile-sticky-bar">
        <div className="pdp-mobile-price-col">
          <span className="pdp-mobile-qty-label" id="pdpMobileQtyLabel">
            {currentQty} item{currentQty > 1 ? 's' : ''} • Size: {activeVariant.weight}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pdp-mobile-price" id="pdpMobilePrice">
              {formatINR(activePrice * currentQty)}
            </span>
            {originalPrice && (
              <span className="pdp-mobile-old-price" id="pdpMobileOldPrice">
                {formatINR(originalPrice * currentQty)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div className="pdp-qty-selector" style={{ height: '44px' }}>
            <button className="pdp-qty-btn" onClick={() => setCurrentQty(q => Math.max(1, q - 1))} aria-label="Decrease Quantity">−</button>
            <span className="pdp-qty-value" id="pdpMobileQtyValue">{currentQty}</span>
            <button className="pdp-qty-btn" onClick={() => setCurrentQty(q => q + 1)} aria-label="Increase Quantity">+</button>
          </div>
          <button className="btn-primary" onClick={handleAddToCart} style={{ padding: '12px 20px', fontSize: '0.9rem', boxShadow: 'none', strokeWidth: 0, whiteSpace: 'nowrap', color: '#ffffff' }}>
            Add ({formatINR(activePrice * currentQty)})
          </button>
        </div>
      </div>
    </div>
  );
};
