import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { X, Check, Plus } from 'lucide-react';
import { formatINR } from '../utils/formatCurrency';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated, addresses, addAddress, fetchAddresses } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlacing, setIsPlacing] = useState<boolean>(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState<boolean>(false);
  
  const [addressForm, setAddressForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    hostelName: '',
    roomNo: '',
  });
  
  const [payment, setPayment] = useState<string>('COD');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill user names when modal opens
  useEffect(() => {
    if (user) {
      setAddressForm(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || ''
      }));
    }
  }, [user, isOpen]);

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

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
  const shippingCharge = 0; // FREE Delivery on all orders
  const total = subtotal;

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
      if (showNewAddressForm || addresses.length === 0) {
        const { firstName, lastName, hostelName, roomNo } = addressForm;
        if (!firstName.trim() || !lastName.trim() || !hostelName.trim()) {
          setErrorMessage('Please enter First Name, Last Name, and Hostel Name.');
          return;
        }
        try {
          setIsPlacing(true);
          const fullAddressString = `${hostelName.trim()}${roomNo.trim() ? ', Room ' + roomNo.trim() : ''}`;
          await addAddress({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            line1: fullAddressString,
            city: 'Campus',
            state: 'Hostel',
            pincode: '151302',
            country: 'India',
            isDefault: addresses.length === 0
          });
          setShowNewAddressForm(false);
          setErrorMessage(null);
          setCurrentStep(2);
        } catch {
          // If backend address save fails or guest, still proceed to payment
          setCurrentStep(2);
        } finally {
          setIsPlacing(false);
        }
      } else {
        if (!selectedAddressId) {
          setErrorMessage('Please select a delivery hostel address.');
          return;
        }
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setIsPlacing(true);
      try {
        const { data } = await api.post('/orders/checkout', {
          shippingAddressId: selectedAddressId || undefined,
          notes: `Hostel Delivery: ${addressForm.hostelName} Room: ${addressForm.roomNo}. Payment: ${payment}`
        });

        const order = data.data;

        if (payment === 'CARD' || payment === 'APPLE') {
          await api.post('/payments/verify', {
            orderId: order.id,
            provider: payment === 'APPLE' ? 'STRIPE' : 'RAZORPAY',
            providerOrderId: `ord_mock_${Date.now()}`,
          });
        }

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
    setAddressForm({ firstName: '', lastName: '', hostelName: '', roomNo: '' });
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

                  {/* Add New Address / Hostel Details Form */}
                  {showNewAddressForm && (
                    <div className="form-grid">
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={addressForm.firstName}
                          onChange={handleInputChange}
                          placeholder="e.g. Mohit"
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
                          placeholder="e.g. Kumar"
                          required
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Hostel Name / Building Block</label>
                        <input
                          type="text"
                          name="hostelName"
                          value={addressForm.hostelName}
                          onChange={handleInputChange}
                          placeholder="e.g. Boys Hostel A, Block 3 / Girls Hostel B"
                          required
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Room Number / Floor (Optional)</label>
                        <input
                          type="text"
                          name="roomNo"
                          value={addressForm.roomNo}
                          onChange={handleInputChange}
                          placeholder="e.g. Room 204, 2nd Floor"
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
                      <span>{formatINR(subtotal)}</span>
                    </div>
                    <div className="checkout-review-row">
                      <span>Delivery Charges</span>
                      <span>{shippingCharge === 0 ? 'Free' : formatINR(shippingCharge)}</span>
                    </div>
                    <div className="checkout-review-row total">
                      <span>Grand Total</span>
                      <span style={{ color: 'var(--clr-accent)', fontWeight: 800 }}>{formatINR(total)}</span>
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
