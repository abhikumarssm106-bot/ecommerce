import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { ArrowRight } from 'lucide-react';
import { formatINR } from '../utils/formatCurrency';

interface PromoBannerProps {
  showToast: (msg: string) => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ showToast }) => {
  const { countdownEnd, addToCart } = useCart();
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  useEffect(() => {
    if (!countdownEnd) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = countdownEnd - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days: d.toString().padStart(2, '0'),
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [countdownEnd]);

  const offerPrice = 399;

  const handleClaimOffer = () => {
    addToCart(
      'p9',
      'Gourmet Fruit & Cheese Basket (Large size)',
      offerPrice,
      'images/grocery_hero.png',
      1,
      'Standard Wicker Basket (Gourmet)',
      'Large size'
    );
    showToast('Claimed Weekly Special Offer!');
  };

  return (
    <section className="promo-section reveal visible" id="promo">
      <div className="container">
        <div className="promo-card">
          
          <div className="promo-content">
            <span className="promo-tag">
              <span className="pulse" style={{ background: 'var(--clr-accent)' }}></span> Special Weekly Deal
            </span>
            <h2 className="promo-title">Gourmet Fresh Fruit <br/><span className="accent">& Cheese Gift Basket</span></h2>
            <p className="promo-desc">Artisan cheeses paired with handpicked organic grapes, strawberries, and crisp apples in a beautiful woven gift basket. Available this week only.</p>
            
            {/* Countdown Timer */}
            <div className="countdown" id="promoCountdown">
              <div className="countdown-item">
                <span className="countdown-value" id="days">{timeLeft.days}</span>
                <span className="countdown-label">Days</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-value" id="hours">{timeLeft.hours}</span>
                <span className="countdown-label">Hours</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-value" id="minutes">{timeLeft.minutes}</span>
                <span className="countdown-label">Mins</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-value" id="seconds">{timeLeft.seconds}</span>
                <span className="countdown-label">Secs</span>
              </div>
            </div>
            
            <div>
              <button
                className="btn-primary"
                onClick={handleClaimOffer}
                style={{ color: '#ffffff' }}
              >
                Claim Offer • {formatINR(offerPrice)}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          
          <div className="promo-image">
            <img src="images/grocery_hero.png" alt="Gourmet Gift Basket close up" />
            <div className="promo-discount-badge" style={{ background: 'var(--clr-accent)' }}>
              <span className="number">15%</span>
              <span className="label">OFF</span>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};
