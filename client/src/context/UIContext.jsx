import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Mobile navigation state
    const [isMobileView, setIsMobileView] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );
    const [mobileChannelOpen, setMobileChannelOpen] = useState(false);
    const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

    // Track viewport width for mobile detection without redundant state updates
    useEffect(() => {
        const handleResize = () => {
            const isFullscreen = Boolean(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            const isCoarsePointer = typeof window !== 'undefined' && (
                (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
                ('ontouchstart' in window && Math.min(window.innerWidth, window.innerHeight) <= 920)
            );
            const shortestSide = Math.min(window.innerWidth, window.innerHeight);
            const mobile = (isFullscreen || isCoarsePointer)
                ? shortestSide <= 768
                : window.innerWidth <= 768;

            setIsMobileView((prev) => (prev === mobile ? prev : mobile));
            // Only reset mobile channel state on genuine desktop viewport transitions — never during fullscreen or mobile rotation
            if (!mobile && !isFullscreen && !isCoarsePointer) {
                setMobileChannelOpen((prev) => (prev ? false : prev));
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        document.addEventListener('fullscreenchange', handleResize);
        document.addEventListener('webkitfullscreenchange', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            document.removeEventListener('fullscreenchange', handleResize);
            document.removeEventListener('webkitfullscreenchange', handleResize);
        };
    }, []);

    const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);
    const closeSidebar = useCallback(() => setIsSidebarOpen((prev) => (prev ? false : prev)), []);
    const openSidebar = useCallback(() => setIsSidebarOpen((prev) => (prev ? prev : true)), []);

    const contextValue = useMemo(() => ({
        isSidebarOpen,
        toggleSidebar,
        closeSidebar,
        openSidebar,
        isMobileView,
        mobileChannelOpen,
        setMobileChannelOpen,
        isDesktopSidebarCollapsed,
        setIsDesktopSidebarCollapsed,
    }), [isSidebarOpen, toggleSidebar, closeSidebar, openSidebar, isMobileView, mobileChannelOpen, isDesktopSidebarCollapsed]);

    return (
        <UIContext.Provider value={contextValue}>
            {children}
        </UIContext.Provider>
    );
};
