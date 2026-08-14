import React from 'react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { Heart, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
  showToast: (msg: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  showToast
}) => {
  const { wishlist, toggleWishlist, addToCart } = useCart();

  const isWishlisted = wishlist.includes(product.id);

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
    const firstVariant = product.variants[0];
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
      className="product-card"
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
    >
      <div className="product-img-wrap">
        <img
          src={product.image}
          alt={product.name}
          style={product.imageStyle ? { filter: product.imageStyle.split('filter: ')[1]?.split(';')[0] } : undefined}
        />
        {product.badge && (
          <span className={`product-badge ${product.badgeClass || 'new'}`}>
            {product.badge}
          </span>
        )}
        <button
          className={`product-wishlist ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlistClick}
          aria-label="Add to Wishlist"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Heart size={16} fill={isWishlisted ? 'var(--clr-accent)' : 'none'} stroke={isWishlisted ? 'var(--clr-accent)' : 'currentColor'} />
        </button>
        <div className="product-quick-add">
          <button className="btn-quick-add" onClick={handleQuickAdd}>
            Add to Cart
          </button>
        </div>
      </div>
      <div className="product-info">
        <div className="product-brand">{product.brand}</div>
        <h3 className="product-name">{product.name}</h3>
        <span className="product-weight">Size/Weight: {product.weight}</span>
        
        <div className="product-rating">
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="star"
                size={12}
                fill="var(--clr-star)"
                stroke="none"
              />
            ))}
          </div>
          <span>(4.9)</span>
        </div>

        <div className="product-price-row">
          <span className="product-price">${product.price.toFixed(2)}</span>
          {product.oldPrice && (
            <span className="product-price-old">${product.oldPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
};
