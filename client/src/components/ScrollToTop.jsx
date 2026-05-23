import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Do not reset scroll if we are navigating to the Home page, let the Home page restore it
        if (pathname === '/') {
            return;
        }

        // Reset window scroll
        window.scrollTo(0, 0);

        // Reset the main scrollable area used in AppLayout
        const scrollArea = document.querySelector('.content-scroll-area');
        if (scrollArea) {
            scrollArea.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
};

export default ScrollToTop;
