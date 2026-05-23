import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Do not reset scroll if we are navigating to the Home page, let the Home page restore it
        if (pathname === '/') {
            return;
        }

        const resetScroll = () => {
            // Reset window scroll
            window.scrollTo({ top: 0, behavior: 'instant' });

            // Reset the main scrollable area used in AppLayout
            const scrollArea = document.querySelector('.content-scroll-area');
            if (scrollArea) {
                const originalScrollBehavior = scrollArea.style.scrollBehavior;
                scrollArea.style.scrollBehavior = 'auto';
                scrollArea.scrollTo({ top: 0, behavior: 'instant' });
                setTimeout(() => {
                    if (scrollArea) {
                        scrollArea.style.scrollBehavior = originalScrollBehavior;
                    }
                }, 20);
            }
        };

        // Reset scroll immediately
        resetScroll();

        // Delayed reset to override any browser/layout adjustments after component mounting or suspense resolution
        const timer = setTimeout(resetScroll, 100);

        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
