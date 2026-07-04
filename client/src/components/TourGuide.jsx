import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './TourGuide.css';

const TOUR_STEPS = [
  {
    targetId: 'tour-step-messages',
    title: 'Mesajlar',
    text: 'Mesajlar: Arkadaşlarınla ve katıldığın odalardaki kişilerle anlık olarak birebir mesajlaşabileceğin alan.',
    preferredPosition: 'right'
  },
  {
    targetId: 'tour-step-discover',
    title: 'Canlı Odalar & Portallar',
    text: 'Canlı Odalar & Portallar: Canlı yayınları senkronize izleyebileceğin, sesli/görüntülü odalara katılabileceğin ve portal akışlarına erişebileceğin ana merkez.',
    preferredPosition: 'right'
  },
  {
    targetId: 'tour-step-controls',
    title: 'Hızlı Kontroller',
    text: 'Hızlı Kontroller: Canlı odalardaki ses giriş/çıkış ayarlarını ve mikrofonunu buradan anlık olarak yönetebilirsin.',
    preferredPosition: 'right'
  },
  {
    targetId: 'tour-step-profile',
    title: 'Kullanıcı Paneli',
    text: 'Kullanıcı Paneli: Ayarlarına ulaşabilir, destek talebi oluşturabilir veya bildirimlerini buradan kontrol edebilirsin.',
    preferredPosition: 'bottom-left'
  }
];

const TourGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [spotlightStyle, setSpotlightStyle] = useState({ display: 'none' });
  const [cardStyle, setCardStyle] = useState({ display: 'none' });
  
  const cardRef = useRef(null);
  const resizeTimeoutRef = useRef(null);

  // Check user agent for search crawlers (Googlebot, Mediapartners-Google)
  const isGoogleBot = typeof navigator !== 'undefined' && 
    /googlebot|mediapartners-google/i.test(navigator.userAgent);

  // Initialize Tour: check localStorage
  useEffect(() => {
    // If the user is a Googlebot, we do not auto-run the interactive tour since we just render all modules in DOM.
    if (isGoogleBot) {
      return;
    }

    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      // Small delay to ensure layout is fully rendered
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isGoogleBot]);

  // Handle positioning of card and spotlight dynamically
  const updateLayout = () => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStep];
    const targetElement = document.getElementById(step.targetId);

    if (!targetElement) {
      // Element not found/visible yet (e.g. loading or route transition). 
      // Place card in center of screen as a fallback, hide spotlight.
      setSpotlightStyle({ display: 'none' });
      setCardStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex'
      });
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const padding = 6;

    // Set Spotlight Style (with soft glow outline / halo)
    setSpotlightStyle({
      top: `${targetRect.top - padding}px`,
      left: `${targetRect.left - padding}px`,
      width: `${targetRect.width + (padding * 2)}px`,
      height: `${targetRect.height + (padding * 2)}px`,
      display: 'block'
    });

    // Calculate Popover Position
    let cardTop = 0;
    let cardLeft = 0;
    const cardWidth = 320;
    const cardHeight = cardRef.current ? cardRef.current.offsetHeight : 180;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (step.preferredPosition === 'right') {
      cardLeft = targetRect.right + 15;
      cardTop = targetRect.top + (targetRect.height - cardHeight) / 2;

      // Adjust boundaries
      if (cardLeft + cardWidth > viewportWidth) {
        cardLeft = viewportWidth - cardWidth - 16;
      }
    } else if (step.preferredPosition === 'bottom-left') {
      cardLeft = targetRect.right - cardWidth;
      cardTop = targetRect.bottom + 15;

      if (cardLeft < 16) {
        cardLeft = 16;
      }
    } else {
      // Default: Center relative
      cardLeft = targetRect.left + (targetRect.width - cardWidth) / 2;
      cardTop = targetRect.bottom + 15;
    }

    // Keep card inside viewport bounds
    if (cardTop + cardHeight > viewportHeight) {
      cardTop = viewportHeight - cardHeight - 16;
    }
    if (cardTop < 16) {
      cardTop = 16;
    }
    if (cardLeft < 16) {
      cardLeft = 16;
    }

    setCardStyle({
      top: `${cardTop}px`,
      left: `${cardLeft}px`,
      display: 'flex'
    });
  };

  // Re-calculate layout when step, activity, or viewport changes
  useEffect(() => {
    updateLayout();

    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(updateLayout, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updateLayout, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateLayout, true);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [isActive, currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setIsActive(false);
  };

  // Render Bot Crawler Content
  const renderCrawlerContent = () => {
    return (
      <div className="tour-bot-crawler-content" aria-hidden="true">
        {TOUR_STEPS.map((step, idx) => (
          <section key={idx} className="crawler-tour-step">
            <h2>{step.title}</h2>
            <p>{step.text}</p>
          </section>
        ))}
      </div>
    );
  };

  if (isGoogleBot) {
    return renderCrawlerContent();
  }

  if (!isActive) return null;

  const currentStepData = TOUR_STEPS[currentStep];

  return (
    <div className="tour-overlay-container">
      {/* Background Dimmer */}
      <div className="tour-overlay-bg" onClick={handleComplete} />

      {/* Spotlight Halo */}
      <div className="tour-spotlight-ring" style={spotlightStyle} />

      {/* Interactive Popover Card */}
      <div 
        ref={cardRef}
        className="tour-card" 
        style={cardStyle}
      >
        <div className="tour-header">
          <span className="tour-step-badge">
            {currentStep + 1} / {TOUR_STEPS.length}
          </span>
          <button className="tour-close-btn" onClick={handleComplete} title="Kapat">
            <X size={16} />
          </button>
        </div>

        <div className="tour-body">
          {currentStepData.text}
        </div>

        <div className="tour-footer">
          <button className="tour-btn-skip" onClick={handleComplete}>
            Turdan Çık
          </button>
          
          <div className="tour-nav-group">
            {currentStep > 0 && (
              <button className="tour-btn tour-btn-secondary" onClick={handlePrev}>
                Geri
              </button>
            )}
            <button className="tour-btn tour-btn-primary" onClick={handleNext}>
              {currentStep === TOUR_STEPS.length - 1 ? 'Tamamla' : 'İleri'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourGuide;
