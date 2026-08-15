import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatINR } from '../utils/formatCurrency';

interface BannerSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  price: number;
  oldPrice?: number;
  highlightText: string;
  image: string;
  bgGradient: string;
  brand: string;
  btnText: string;
  targetCategory?: string;
}

const slides: BannerSlide[] = [
  {
    id: 'b-hostel',
    badge: 'HOSTEL ESSENTIALS',
    title: 'Everything Your Hostel Needs',
    subtitle: 'Delivered Fast to Your Room in 10 Mins',
    price: 20,
    oldPrice: 30,
    highlightText: 'Starting at',
    image: 'images/hostel_hero.png',
    bgGradient: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
    brand: '⚡ G Mart Campus',
    btnText: 'Order in 10 Mins',
    targetCategory: 'snacks'
  },
  {
    id: 'b1',
    badge: 'CAMPUS DEALS',
    title: 'Late Night Munchies & Snacks',
    subtitle: 'Lays, Kurkure, Maggi & Cold Drinks',
    price: 14,
    oldPrice: 20,
    highlightText: 'From',
    image: 'images/hostel_hero.png',
    bgGradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
    brand: 'Snack Station',
    btnText: 'Shop Now',
    targetCategory: 'snacks'
  },
  {
    id: 'b2',
    badge: 'FREE DELIVERY',
    title: 'Hostel Groceries & Milk',
    subtitle: 'Amul Milk, Bread, Butter & Eggs',
    price: 30,
    oldPrice: 35,
    highlightText: 'Fresh',
    image: 'images/prod_bananas.png',
    bgGradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
    brand: 'Dairy & Staples',
    btnText: 'Get Delivered',
    targetCategory: 'groceries'
  }
];

interface BannerCarouselProps {
  onSelectCategory?: (category: string) => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ onSelectCategory }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Auto-scroll every 3.8 seconds
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 3800);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left -> next
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      } else {
        // swipe right -> prev
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
  };

  const handleAction = (slide: BannerSlide) => {
    if (slide.targetCategory && onSelectCategory) {
      onSelectCategory(slide.targetCategory);
    }
    const productsEl = document.getElementById('products');
    if (productsEl) {
      productsEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className="mobile-banner-carousel-wrap"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sliding Animation Track */}
      <div
        className="banner-carousel-track"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`
        }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="banner-carousel-slide"
            style={{ background: slide.bgGradient }}
          >
            {/* Left Info Column */}
            <div className="banner-slide-info">
              <div className="banner-top-badge-row">
                <span className="banner-brand-badge">{slide.brand}</span>
                <span className="banner-sale-badge">{slide.badge}</span>
              </div>

              <h3 className="banner-slide-title">{slide.title}</h3>
              
              <div className="banner-price-tag-row">
                <span className="banner-from-label">{slide.highlightText}</span>
                <span className="banner-price-highlight">{formatINR(slide.price)}</span>
                {slide.oldPrice && (
                  <span className="banner-old-price">{formatINR(slide.oldPrice)}</span>
                )}
              </div>

              <p className="banner-subtitle-text">{slide.subtitle}</p>

              <button className="banner-cta-btn" onClick={() => handleAction(slide)}>
                {slide.btnText}
              </button>
            </div>

            {/* Right Image Graphic */}
            <div className="banner-slide-graphic">
              <img src={slide.image} alt={slide.title} className="banner-graphic-img" />
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        className="banner-nav-btn prev"
        onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
        aria-label="Previous Slide"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        className="banner-nav-btn next"
        onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
        aria-label="Next Slide"
      >
        <ChevronRight size={16} />
      </button>

      {/* Dots Indicator */}
      <div className="banner-carousel-dots">
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`banner-dot ${currentIndex === idx ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
