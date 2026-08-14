import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, ShoppingBag } from 'lucide-react';

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

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shippingCharge = subtotal >= 30 ? 0 : (subtotal > 0 ? 2.99 : 0);
  const total = subtotal + shippingCharge;

  return (
    <div className={`cart-drawer ${isOpen ? 'open' : ''}`} id="cartDrawer">
      <div className="cart-drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={20} className="accent" style={{ color: 'var(--clr-accent)' }} />
          <h2>Your Cart</h2>
          <span className="cart-count-pill">{cart.reduce((sum, item) => sum + item.qty, 0)}</span>
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
          cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <img src={item.image} alt={item.name} className="cart-item-img" />
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <p className="cart-item-variant">Size/Pack: {item.weight}</p>
                <span className="cart-item-price">${item.price.toFixed(2)}</span>
              </div>
              <div className="cart-item-actions">
                <div className="cart-qty-controls">
                  <button
                    className="cart-qty-btn"
                    onClick={() => updateQty(item.id, item.qty - 1)}
                  >
                    −
                  </button>
                  <span className="cart-qty-val">{item.qty}</span>
                  <button
                    className="cart-qty-btn"
                    onClick={() => updateQty(item.id, item.qty + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  className="cart-delete-btn"
                  onClick={() => removeFromCart(item.id)}
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="cart-footer">
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="cart-summary-row">
            <span>Delivery Charge</span>
            {shippingCharge === 0 ? (
              <span style={{ color: '#10B981', fontWeight: 700 }}>FREE</span>
            ) : (
              <span>${shippingCharge.toFixed(2)}</span>
            )}
          </div>
          {shippingCharge > 0 && (
            <p style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', textAlign: 'right', marginTop: '-4px', marginBottom: '8px' }}>
              Add <strong>${(30 - subtotal).toFixed(2)}</strong> more for FREE delivery!
            </p>
          )}
          <div className="cart-summary-row total">
            <span>Grand Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button className="cart-checkout-btn" onClick={onCheckout}>
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
};
