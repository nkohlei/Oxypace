import React, { useState, useEffect } from 'react';

const FloatingScrollTop = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

            // Calculate progress percentage (0 to 100)
            const progress = docHeight > 0 ? (currentScrollY / docHeight) * 100 : 0;
            setScrollProgress(progress);

            // Show button after scrolling down 200px
            if (currentScrollY > 200) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Initial check
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Calculate SVG stroke-dashoffset for the circle
    // Circle math: C = 2 * pi * r. For r=20, C ≈ 125.6
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

    return (
        <button
            className={`floating-scroll-top ${isVisible ? 'visible' : ''}`}
            onClick={scrollToTop}
            aria-label="Yukarı Çık"
        >
            <svg
                className="progress-ring"
                width="50"
                height="50"
                viewBox="0 0 50 50"
            >
                {/* Background circle */}
                <circle
                    className="progress-ring-track"
                    strokeWidth="3"
                    fill="transparent"
                    r={radius}
                    cx="25"
                    cy="25"
                />
                {/* Progress circle */}
                <circle
                    className="progress-ring-fill"
                    strokeWidth="3"
                    fill="transparent"
                    r={radius}
                    cx="25"
                    cy="25"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                    }}
                />
            </svg>
            <div className="scroll-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m18 15-6-6-6 6" />
                </svg>
            </div>
        </button>
    );
};

export default FloatingScrollTop;
