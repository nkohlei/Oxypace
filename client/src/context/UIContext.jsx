import { createContext, useContext, useState, useEffect } from 'react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Mobile navigation state
    const [isMobileView, setIsMobileView] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );
    const [mobileChannelOpen, setMobileChannelOpen] = useState(false);

    // Track viewport width for mobile detection
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobileView(mobile);
            // Reset mobile channel state when switching to desktop
            if (!mobile) {
                setMobileChannelOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
    const closeSidebar = () => setIsSidebarOpen(false);
    const openSidebar = () => setIsSidebarOpen(true);

    return (
        <UIContext.Provider value={{
            isSidebarOpen, toggleSidebar, closeSidebar, openSidebar,
            isMobileView, mobileChannelOpen, setMobileChannelOpen
        }}>
            {children}
        </UIContext.Provider>
    );
};
