import React from 'react';
import { ArrowRight, Sparkles, Zap, ShieldCheck } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="hostel-welcome-overlay">
      <div className="hostel-welcome-container">
        
        {/* Top Visual Card with 3D Hostel Boy Illustration */}
        <div className="welcome-visual-section">
          <div className="welcome-tag-pill">
            <Sparkles size={14} className="welcome-sparkle-icon" />
            <span>Campus Fast-Delivery</span>
          </div>

          <div className="welcome-hero-img-wrap">
            <img
              src="images/hostel_hero.png"
              alt="Everything Your Hostel Needs"
              className="welcome-hero-boy-img"
            />
          </div>

          <div className="welcome-floating-badge top-right">
            <Zap size={14} className="flash-icon" />
            <span>10-Min Room Delivery</span>
          </div>
        </div>

        {/* Bottom Content Card */}
        <div className="welcome-bottom-card">
          <div className="welcome-indicator-dots">
            <span className="dot active" />
            <span className="dot" />
            <span className="dot" />
          </div>

          <h1 className="welcome-title">
            Everything Your Hostel Needs, <span className="highlight-text">Delivered Fast</span>
          </h1>

          <p className="welcome-subtitle">
            Skip the long canteen lines. Order late-night snacks, instant noodles, chilled drinks, and daily essentials delivered right to your hostel room.
          </p>

          <div className="welcome-feature-chips">
            <div className="chip-item">
              <ShieldCheck size={14} color="#0284c7" />
              <span>Free Delivery</span>
            </div>
            <div className="chip-item">
              <Sparkles size={14} color="#0284c7" />
              <span>Campus Verified</span>
            </div>
            <div className="chip-item">
              <Zap size={14} color="#0284c7" />
              <span>Instant Pay / COD</span>
            </div>
          </div>

          <button
            className="welcome-get-started-btn"
            onClick={onGetStarted}
            id="welcomeGetStartedBtn"
          >
            <span>Get Started</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
};
