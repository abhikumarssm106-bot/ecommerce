import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User as UserIcon, Phone } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, isSuccess?: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, showToast }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        showToast('Logged in successfully!', true);
        onClose();
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
        });
        showToast('Registration successful! Please log in.', true);
        setIsLogin(true);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Something went wrong. Please try again.';
      setErrorMessage(msg);
      showToast(msg, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="checkout-modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="checkout-modal" style={{ maxWidth: '450px' }}>
        <div className="checkout-modal-header">
          <h3>{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
          <button className="checkout-close-btn" onClick={onClose} disabled={loading} aria-label="Close Auth">
            <X size={20} />
          </button>
        </div>

        <div className="checkout-modal-body" style={{ padding: 'var(--space-md)' }}>
          {errorMessage && (
            <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600, textAlign: 'center' }}>
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {!isLogin && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label>First Name</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      required
                      style={{ paddingLeft: '36px', width: '100%' }}
                    />
                    <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-secondary)' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  required
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-secondary)' }} />
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+919876543210"
                    style={{ paddingLeft: '36px', width: '100%' }}
                  />
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-secondary)' }} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-secondary)' }} />
              </div>
              {!isLogin && (
                <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: '4px', display: 'block' }}>
                  Min. 8 characters with upper, lower, number, and special character.
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '10px', justifyContent: 'center', height: '44px', color: '#ffffff' }}
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--clr-text-secondary)' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMessage(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--clr-accent)',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {isLogin ? 'Create one' : 'Sign in instead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
