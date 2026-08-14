import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { X, Check, Plus } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { cart, clearCart } = useCart();
  const { isAuthenticated, addresses, addAddress, fetchAddresses } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlacing, setIsPlacing] = useState<boolean>(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState<boolean>(false);
  
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  
  const [payment, setPayment] = useState<string>('COD');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load addresses when checkout opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchAddresses();
    }
  }, [isOpen, isAuthenticated]);

  // Set default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
    } else if (addresses.length === 0) {
      setShowNewAddressForm(true);
    }
  }, [addresses]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shippingCharge = subtotal >= 30 ? 0 : (subtotal > 0 ? 2.99 : 0);
  const total = subtotal + shippingCharge;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage(null);
  };

  const handleNext = async () => {
    setErrorMessage(null);

    if (currentStep === 1) {
      if (showNewAddressForm) {
        // Validate address fields
        const { firstName, lastName, line1, city, state, pincode } = addressForm;
        if (!firstName.trim() || !lastName.trim() || !line1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
          setErrorMessage('Please fill out all address fields.');
          return;
        }
        try {
          setIsPlacing(true);
          await addAddress({
            ...addressForm,
            isDefault: addresses.length === 0
          });
          setShowNewAddressForm(false);
          setErrorMessage(null);
          setCurrentStep(2);
        } catch (err: any) {
          setErrorMessage('Failed to save address. Please try again.');
        } finally {
          setIsPlacing(false);
        }
      } else {
        if (!selectedAddressId) {
          setErrorMessage('Please select a shipping address.');
          return;
        }
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setIsPlacing(true);
      try {
        // 1. Submit order to backend
        const { data } = await api.post('/orders/checkout', {
          shippingAddressId: selectedAddressId,
          notes: `Delivery by ${payment}`
        });

        const order = data.data;

        // 2. If online payment, verify/simulate payment capture
        if (payment === 'CARD' || payment === 'APPLE') {
          await api.post('/payments/verify', {
            orderId: order.id,
            provider: payment === 'APPLE' ? 'STRIPE' : 'RAZORPAY',
            providerOrderId: `ord_mock_${Date.now()}`,
          });
        }

        // 3. Clear cart in DB and local
        await clearCart();
        
        setCurrentStep(4);
      } catch (err: any) {
        const msg = err.response?.data?.error?.message || 'Failed to place order. Out of stock or invalid session.';
        setErrorMessage(msg);
      } finally {
        setIsPlacing(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 4) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleDone = () => {
    setCurrentStep(1);
    setAddressForm({ firstName: '', lastName: '', line1: '', city: '', state: '', pincode: '', country: 'India' });
    setPayment('COD');
    setSelectedAddressId('');
    setShowNewAddressForm(false);
    onClose();
  };

  const triggerLogin = () => {
    onClose();
    // Dispatch open auth modal event
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  };

  return (
    <div className={`checkout-modal-overlay open`} onClick={(e) => {
      if (e.target === e.currentTarget && currentStep !== 4 && !isPlacing) {
        onClose();
      }
    }}>
      <div className="checkout-modal">
        <div className="checkout-modal-header">
          <h3>Checkout Details</h3>
          {currentStep !== 4 && !isPlacing && (
            <button className="checkout-close-btn" onClick={onClose} aria-label="Close Checkout">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Guest Lock Screen */}
        {!isAuthenticated ? (
          <div className="checkout-modal-body" style={{ padding: 'var(--space-xl) var(--space-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🔒</div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Login Required for Checkout</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-secondary)', marginBottom: 'var(--space-xl)' }}>
              To ensure secure transactions and preserve order history, you must be logged in to complete your checkout.
            </p>
            <button className="btn-primary" onClick={triggerLogin} style={{ width: '100%', justifyContent: 'center' }}>
              Sign In / Create Account
            </button>
          </div>
        ) : (
          <>
            {/* Progress Steps Indicator */}
            {currentStep < 4 && (
              <div className="checkout-steps-indicator">
                <div className={`step-ind ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
                  <span className="step-ind-num">1</span> Delivery
                </div>
                <div className={`step-ind ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
                  <span className="step-ind-num">2</span> Payment
                </div>
                <div className={`step-ind ${currentStep === 3 ? 'active' : ''}`}>
                  <span className="step-ind-num">3</span> Review
                </div>
              </div>
            )}

            <div className="checkout-modal-body">
              {errorMessage && (
                <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600, padding: '8px', border: '1px solid #FEE2E2', borderRadius: 'var(--radius-sm)', background: '#FEF2F2' }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Step 1: Address Selection / Addition */}
              {currentStep === 1 && (
                <div className="checkout-step-content active">
                  <h4 style={{ marginBottom: 'var(--space-md)', fontWeight: 700 }}>Where should we deliver?</h4>
                  
                  {/* Saved Addresses list */}
                  {!showNewAddressForm && addresses.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`payment-option-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                          onClick={() => setSelectedAddressId(addr.id)}
                          style={{ padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}
                        >
                          <input
                            type="radio"
                            name="addressRadio"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            style={{ marginTop: '3px' }}
                          />
                          <div style={{ textAlign: 'left', fontSize: '0.85rem', lineHeight: 1.4 }}>
                            <strong>{addr.firstName} {addr.lastName}</strong> {addr.isDefault && <span style={{ fontSize: '0.7rem', background: 'var(--clr-accent)', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>Default</span>}
                            <div style={{ color: 'var(--clr-text-secondary)', marginTop: '4px' }}>
                              {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        className="btn-ghost"
                        onClick={() => setShowNewAddressForm(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', width: '100%', justifyContent: 'center', padding: '10px' }}
                      >
                        <Plus size={16} /> Add New Address
                      </button>
                    </div>
                  )}

                  {/* Add New Address Form */}
                  {showNewAddressForm && (
                    <div className="form-grid">
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={addressForm.firstName}
                          onChange={handleInputChange}
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={addressForm.lastName}
                          onChange={handleInputChange}
                          placeholder="Doe"
                          required
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Street Address</label>
                        <input
                          type="text"
                          name="line1"
                          value={addressForm.line1}
                          onChange={handleInputChange}
                          placeholder="Apt 4B, 128 Broadway St"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>City</label>
                        <input
                          type="text"
                          name="city"
                          value={addressForm.city}
                          onChange={handleInputChange}
                          placeholder="Bangalore"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input
                          type="text"
                          name="state"
                          value={addressForm.state}
                          onChange={handleInputChange}
                          placeholder="Karnataka"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Pincode / Zip</label>
                        <input
                          type="text"
                          name="pincode"
                          value={addressForm.pincode}
                          onChange={handleInputChange}
                          placeholder="560001"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Country</label>
                        <input
                          type="text"
                          name="country"
                          value={addressForm.country}
                          onChange={handleInputChange}
                          placeholder="India"
                          required
                        />
                      </div>
                      
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setShowNewAddressForm(false)}
                          style={{ gridColumn: '1 / -1', fontSize: '0.85rem' }}
                        >
                          Cancel and Use Saved Address
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Payment Method */}
              {currentStep === 2 && (
                <div className="checkout-step-content active">
                  <h4 style={{ marginBottom: 'var(--space-md)', fontWeight: 700 }}>Select Payment Method</h4>
                  <div className="payment-options-grid">
                    <div
                      className={`payment-option-card ${payment === 'COD' ? 'selected' : ''}`}
                      onClick={() => setPayment('COD')}
                    >
                      <input
                        type="radio"
                        name="paymentRadio"
                        id="radCOD"
                        checked={payment === 'COD'}
                        onChange={() => setPayment('COD')}
                      />
                      <div style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'left' }}>
                        <span>Cash on Delivery (COD)</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-secondary)', fontWeight: 'normal', marginTop: '2px' }}>
                          Pay with cash or card reader upon courier arrival.
                        </span>
                      </div>
                    </div>
                    
                    <div
                      className={`payment-option-card ${payment === 'CARD' ? 'selected' : ''}`}
                      onClick={() => setPayment('CARD')}
                    >
                      <input
                        type="radio"
                        name="paymentRadio"
                        id="radCard"
                        checked={payment === 'CARD'}
                        onChange={() => setPayment('CARD')}
                      />
                      <div style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'left' }}>
                        <span>Credit / Debit Card (Razorpay)</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-secondary)', fontWeight: 'normal', marginTop: '2px' }}>
                          Pay instantly online via secure simulated credit card transactions.
                        </span>
                      </div>
                    </div>

                    <div
                      className={`payment-option-card ${payment === 'APPLE' ? 'selected' : ''}`}
                      onClick={() => setPayment('APPLE')}
                    >
                      <input
                        type="radio"
                        name="paymentRadio"
                        id="radApple"
                        checked={payment === 'APPLE'}
                        onChange={() => setPayment('APPLE')}
                      />
                      <div style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'left' }}>
                        <span>Apple Pay / Stripe Wallet</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-secondary)', fontWeight: 'normal', marginTop: '2px' }}>
                          Simulated Stripe digital wallet payments in 1-click.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review Invoice Summary */}
              {currentStep === 3 && (
                <div className="checkout-step-content active">
                  <h4 style={{ marginBottom: 'var(--space-md)', fontWeight: 700 }}>Confirm Your Order</h4>
                  <div className="checkout-review-summary">
                    <div className="checkout-review-row">
                      <span>Items Total</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="checkout-review-row">
                      <span>Delivery Charges</span>
                      <span>{shippingCharge === 0 ? 'Free' : `$${shippingCharge.toFixed(2)}`}</span>
                    </div>
                    <div className="checkout-review-row total">
                      <span>Grand Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5, background: 'var(--clr-bg-secondary)', padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '8px', alignItems: 'flex-start', textAlign: 'left' }}>
                    <span style={{ color: 'var(--clr-accent)' }}>🛡️</span>
                    <span>All food items are packed in insulated temperature-controlled bags to preserve peak freshness. Delivery guaranteed in 10 minutes.</span>
                  </div>
                </div>
              )}

              {/* Step 4: Success Message */}
              {currentStep === 4 && (
                <div className="checkout-step-content active">
                  <div className="checkout-success-view">
                    <div className="success-icon-circle">
                      <Check size={36} color="white" />
                    </div>
                    <h4>Order Successfully Placed!</h4>
                    <p>Your grocery items are currently being packed at our local G Mart hub. A courier will arrive at your address in approximately 10 minutes!</p>
                    <button className="btn-primary" onClick={handleDone} style={{ width: '100%', justifyContent: 'center' }}>
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer controls */}
            {currentStep < 4 && (
              <div className="checkout-modal-footer">
                <button
                  className="btn-checkout-prev"
                  style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
                  onClick={handleBack}
                  disabled={isPlacing}
                >
                  Back
                </button>
                <button
                  className="btn-checkout-next"
                  onClick={handleNext}
                  disabled={isPlacing}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{isPlacing ? 'Processing...' : currentStep === 3 ? 'Place Order' : 'Continue'}</span>
                  {!isPlacing && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
