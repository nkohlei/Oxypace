import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Reset window scroll
        window.scrollTo(0, 0);

        // Reset the main scrollable area used in AppLayout
        const scrollArea = document.querySelector('.content-scroll-area');
        if (scrollArea) {
            scrollArea.scrollTo(0, 0);
        }

        // Apply strict body clamping only for Discord UI routes to prevent global layout shifting
        const discordRoutes = ['/portal', '/inbox', '/settings', '/create', '/profile'];
        const isDiscordRoute = discordRoutes.some(route => pathname.startsWith(route));

        if (isDiscordRoute) {
            document.body.classList.add('discord-layout-active');
        } else {
            document.body.classList.remove('discord-layout-active');
        }

    }, [pathname]);

    return null;
};

export default ScrollToTop;
