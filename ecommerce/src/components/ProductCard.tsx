import React from 'react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { Heart, Plus } from 'lucide-react';
import { formatINR } from '../utils/formatCurrency';

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
  showToast: (msg: string) => void;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  showToast,
  compact = false
}) => {
  const { wishlist, toggleWishlist, addToCart, cart } = useCart();

  const isWishlisted = wishlist.includes(product.id);
  const inCartQty = cart
    .filter(item => item.productId === product.id)
    .reduce((sum, item) => sum + item.qty, 0);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleWishlist(product.id);
    if (!isWishlisted) {
      showToast(`Added ${product.name} to Wishlist!`);
    } else {
      showToast(`Removed ${product.name} from Wishlist.`);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const firstVariant = product.variants[0] || { name: 'Standard', weight: product.weight || '1 unit', priceOffset: 0 };
    addToCart(
      product.id,
      `${product.name} (${firstVariant.weight})`,
      product.price + firstVariant.priceOffset,
      product.image,
      1,
      firstVariant.name,
      firstVariant.weight,
      (firstVariant as any).id
    );
    showToast(`Added ${product.name} to Cart!`);
  };

  return (
    <div
      className={`product-card ${compact ? 'compact' : ''}`}
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
    >
      <div className="product-img-wrap">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('unsplash')) {
              target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
            }
          }}
          style={product.imageStyle ? { filter: product.imageStyle.split('filter: ')[1]?.split(';')[0] } : undefined}
        />

        {/* Top-Right Wishlist Heart Button (Always Visible) */}
        <button
          className={`product-wishlist-btn top-right ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart
            size={15}
            fill={isWishlisted ? '#ef4444' : 'none'}
            stroke={isWishlisted ? '#ef4444' : '#64748b'}
          />
        </button>

        {/* Badge or Veg Symbol */}
        {product.badge ? (
          <span className={`product-badge ${product.badgeClass || 'new'}`}>
            {product.badge}
          </span>
        ) : (
          <span className="product-veg-icon" title="100% Vegetarian">
            <span className="veg-dot"></span>
          </span>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name" title={product.name}>{product.name}</h3>
        <span className="product-weight">{product.weight}</span>
        
        <div className="product-bottom-row">
          <div className="product-price-col">
            <span className="product-price">{formatINR(product.price)}</span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="product-price-old">{formatINR(product.oldPrice)}</span>
            )}
          </div>

          {/* Bottom-Right Add to Cart Button (Always Visible) */}
          <button
            className={`product-quick-add-btn bottom-right ${inCartQty > 0 ? 'added' : ''}`}
            onClick={handleQuickAdd}
            aria-label={`Add ${product.name} to Cart`}
          >
            {inCartQty > 0 ? (
              <span className="cart-qty-badge">{inCartQty}</span>
            ) : (
              <Plus size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
