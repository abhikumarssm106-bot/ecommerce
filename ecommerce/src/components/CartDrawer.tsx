import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, ShoppingBag, Minus, Plus, Sparkles } from 'lucide-react';
import { formatINR } from '../utils/formatCurrency';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onCheckout
}) => {
  const { cart, updateQty, removeFromCart } = useCart();

  // Unit price * quantity for each item
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
  const total = subtotal;
  const totalCartQty = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className={`cart-drawer ${isOpen ? 'open' : ''}`} id="cartDrawer">
      <div className="cart-drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={20} className="accent" style={{ color: 'var(--clr-accent)' }} />
          <h2>Your Cart</h2>
          <span className="cart-count-pill">{totalCartQty}</span>
        </div>
        <button className="cart-close-btn" onClick={onClose} aria-label="Close Cart">
          <X size={24} />
        </button>
      </div>

      <div className="cart-items-wrapper">
        {cart.length === 0 ? (
          <div className="cart-empty-state" style={{ padding: 'var(--space-4xl) var(--space-xl)', textAlign: 'center', color: 'var(--clr-text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🛒</div>
            <h3>Your cart is empty</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)', marginTop: '6px' }}>Add fresh organic produce and snacks to get started!</p>
          </div>
        ) : (
          cart.map((item) => {
            const lineTotal = Number(item.price) * Number(item.qty);
            return (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p className="cart-item-variant">Pack: {item.weight}</p>
                  <div className="cart-item-price-row">
                    <span className="cart-item-price">{formatINR(lineTotal)}</span>
                    {item.qty > 1 && (
                      <span className="cart-item-unit-price" style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginLeft: '6px' }}>
                        ({formatINR(item.price)} each)
                      </span>
                    )}
                  </div>
                </div>
                <div className="cart-item-actions">
                  <div className="cart-qty-pill-stepper">
                    <button
                      className="cart-stepper-btn minus"
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      aria-label="Decrease Quantity"
                    >
                      <Minus size={13} strokeWidth={3} />
                    </button>
                    <span className="cart-stepper-count">{item.qty}</span>
                    <button
                      className="cart-stepper-btn plus"
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      aria-label="Increase Quantity"
                    >
                      <Plus size={13} strokeWidth={3} />
                    </button>
                  </div>
                  <button
                    className="cart-item-trash-btn"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {cart.length > 0 && (
        <div className="cart-footer">
          <div className="cart-free-delivery-badge">
            <Sparkles size={14} color="#10b981" />
            <span>Yay! You unlocked <strong>FREE 10-Min Delivery</strong></span>
          </div>
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="cart-summary-row">
            <span>Delivery Charge</span>
            <span style={{ color: '#10B981', fontWeight: 800 }}>FREE</span>
          </div>
          <div className="cart-summary-row total">
            <span>Grand Total</span>
            <span style={{ color: '#0284c7', fontWeight: 900, fontSize: '1.3rem' }}>{formatINR(total)}</span>
          </div>
          <button className="cart-checkout-btn" onClick={onCheckout}>
            Proceed to Checkout ({formatINR(total)})
          </button>
        </div>
      )}
    </div>
  );
};
