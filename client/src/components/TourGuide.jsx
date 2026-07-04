import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import './TourGuide.css';

const TOUR_STEPS = [
  {
    targetId: null,
    title: 'Oxypace\'e Hoş Geldiniz!',
    text: 'Oxypace\'e Hoş Geldiniz! Platformumuz, arkadaşlarınızla tamamen eş zamanlı ve senkronize şekilde medya tüketebileceğiniz, özgürce topluluklar kurabileceğiniz yeni nesil bir sosyal portaldır. Gelin, modülleri birlikte keşfedelim!',
    preferredPosition: 'center'
  },
  {
    targetId: 'tour-step-messages',
    title: 'Mesajlar',
    text: 'Mesajlar: Arkadaşlarınızla veya odalardaki kişilerle anlık olarak birebir ya da grup halinde güvenli mesajlaşmalar başlatabileceğiniz paneldir.',
    preferredPosition: 'right'
  },
  {
    targetId: 'tour-step-discover',
    title: 'Keşfet ve Arama',
    text: 'Keşfet ve Arama: Platform genelindeki aktif portalları, trending içerikleri ve diğer kullanıcıları arayıp bulabileceğiniz, yeni topluluklar keşfedebileceğiniz arama modülüdür.',
    preferredPosition: 'right'
  },
  {
    targetId: 'tour-step-create',
    title: 'Portal Kur',
    text: 'Portal Kur: Kendi topluluğunuzu, kurallarınızı ve paylaşım alanlarınızı oluşturabileceğiniz, tamamen size ait yeni bir portal alanı inşa etme butonudur.',
    preferredPosition: 'right'
  },
  {
    targetId: 'tour-step-reorder',
    title: 'Portal Sıralaması',
    text: 'Portal Sıralaması: Üye olduğunuz veya yöneticisi olduğunuz portalları, sol menü akışında kendi önceliğinize göre yukarı-aşağı sürükleyerek sıralayabileceğiniz modüldür.',
    preferredPosition: 'right'
  },
  {
    targetId: 'tour-step-controls',
    title: 'Hızlı Ses Ayarları',
    text: 'Hızlı Ses Ayarları: Canlı odalara katıldığınızda mikrofonunuzu susturabileceğiniz, kulaklık/hoparlör çıkışlarınızı ve profil ses tünellerinizi anlık yönetebileceğiniz alandır.',
    preferredPosition: 'right'
  },
  {
    targetId: 'tour-step-profile',
    title: 'Kullanıcı Kontrol Paneli',
    text: 'Kullanıcı Kontrol Paneli: Profilinize ait aktif ayarları değiştirebileceğiniz, bildirimlerinizi görüntüleyebileceğiniz ve destek talebi oluşturabileceğiniz yönetim merkezidir.',
    preferredPosition: 'bottom-left'
  },
  {
    targetId: null,
    title: 'Tebrikler!',
    text: 'Tebrikler! Oxypace\'in temel modüllerini öğrendiniz. Şimdi canlı odalarda arkadaşlarınızla buluşabilir veya portallarda ilk paylaşımlarınızı yapmaya başlayabilirsiniz. Keyifli vakit geçirmeniz dileğiyle!',
    preferredPosition: 'center'
  }
];

const TourGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [spotlightStyle, setSpotlightStyle] = useState({ display: 'none' });
  const [cardStyle, setCardStyle] = useState({ display: 'none' });
  
  const cardRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const location = useLocation();

  // Check user agent for search crawlers (Googlebot, Mediapartners-Google)
  const isGoogleBot = typeof navigator !== 'undefined' && 
    /googlebot|mediapartners-google/i.test(navigator.userAgent);

  // Initialize Tour: check localStorage
  useEffect(() => {
    if (isGoogleBot) {
      return;
    }

    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isGoogleBot]);

  // Programmatically manage profile dropdown state for Step 7 (Index 6)
  useEffect(() => {
    if (!isActive) return;

    let timeoutId;

    // Check if we entered Step 7
    if (currentStep === 6) {
      const isDropdownOpen = !!document.querySelector('.header-dropdown');
      if (!isDropdownOpen) {
        const btn = document.getElementById('tour-step-profile');
        if (btn) {
          timeoutId = setTimeout(() => {
            btn.click();
          }, 0);
        }
      }
    } else {
      // If we left Step 7, close it if open
      const isDropdownOpen = !!document.querySelector('.header-dropdown');
      if (isDropdownOpen) {
        const btn = document.getElementById('tour-step-profile');
        if (btn) {
          timeoutId = setTimeout(() => {
            btn.click();
          }, 0);
        }
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentStep, isActive]);

  // Ensure profile dropdown is closed when closing the tour
  useEffect(() => {
    let timeoutId;
    if (!isActive) {
      const isDropdownOpen = !!document.querySelector('.header-dropdown');
      if (isDropdownOpen) {
        const btn = document.getElementById('tour-step-profile');
        if (btn) {
          timeoutId = setTimeout(() => {
            btn.click();
          }, 0);
        }
      }
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isActive]);

  // Clean up tour state when path changes (User transitions pages)
  useEffect(() => {
    if (isActive) {
      handleComplete();
    }
  }, [location.pathname]);

  // Close dropdown and clean up completely when component unmounts
  useEffect(() => {
    return () => {
      const isDropdownOpen = !!document.querySelector('.header-dropdown');
      if (isDropdownOpen) {
        const btn = document.getElementById('tour-step-profile');
        if (btn) {
          btn.click();
        }
      }
    };
  }, []);

  // Keyboard navigation listeners (ESC/Arrows)
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleComplete();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, currentStep]);

  // Handle positioning of card and spotlight dynamically
  const updateLayout = () => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStep];

    // Center screen fallback (Steps 1 & 8)
    if (!step.targetId) {
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

    const targetElement = document.getElementById(step.targetId);

    if (!targetElement) {
      // Target element is not currently in the DOM or viewport.
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
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Spotlight layout bounds calculations
    let spotlightLeft = targetRect.left - padding;
    let spotlightWidth = targetRect.width + (padding * 2);
    let spotlightTop = targetRect.top - padding;
    let spotlightHeight = targetRect.height + (padding * 2);

    // Keep spotlight inside viewport boundaries to prevent negative offsets or horizontal/vertical scrolling
    if (spotlightLeft < 0) {
      spotlightWidth += spotlightLeft;
      spotlightLeft = 0;
    }
    if (spotlightLeft + spotlightWidth > viewportWidth) {
      spotlightWidth = viewportWidth - spotlightLeft;
    }
    if (spotlightTop < 0) {
      spotlightHeight += spotlightTop;
      spotlightTop = 0;
    }
    if (spotlightTop + spotlightHeight > viewportHeight) {
      spotlightHeight = viewportHeight - spotlightTop;
    }

    // Set Spotlight Style (with soft gradient halo)
    setSpotlightStyle({
      top: `${spotlightTop}px`,
      left: `${spotlightLeft}px`,
      width: `${spotlightWidth}px`,
      height: `${spotlightHeight}px`,
      display: 'block'
    });

    // Calculate Popover Position
    let cardTop = 0;
    let cardLeft = 0;
    const cardWidth = 320;
    const cardHeight = cardRef.current ? cardRef.current.offsetHeight : 180;

    if (step.preferredPosition === 'right') {
      cardLeft = targetRect.right + 15;
      cardTop = targetRect.top + (targetRect.height - cardHeight) / 2;

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
    // Add small delay to ensure programmatic DOM changes (like opening the dropdown in step 7) are fully rendered before calculating positions
    const timer = setTimeout(updateLayout, 100);

    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(updateLayout, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updateLayout, true);

    return () => {
      clearTimeout(timer);
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

  // Render Bot Crawler Content (SEO zengin açıklama metinleri)
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
