import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme_mode');
        return saved !== 'light'; // Default to dark
    });
    // Apply theme changes
    useEffect(() => {
        const root = document.documentElement;

        if (isDark) {
            root.setAttribute('data-theme', 'dark');
            // Deep Midnight Blue Theme
            root.style.setProperty('--bg-dark', '#020617'); // Dark Midnight Blue
            root.style.setProperty('--bg-darker', '#0f172a');
            root.style.setProperty('--bg-card', '#1e293b');
            root.style.setProperty('--text-primary', '#f8fafc');
            root.style.setProperty('--text-secondary', '#cbd5e1');
            root.style.setProperty('--text-tertiary', '#94a3b8');
            root.style.setProperty('--bg-input', 'rgba(15, 23, 42, 0.6)');
            root.style.setProperty('--bg-hover', 'rgba(255, 255, 255, 0.1)'); // 10% fade (Dark)
            root.style.setProperty('--border-subtle', 'rgba(148, 163, 184, 0.1)');
            root.style.setProperty('--border-neon', 'rgba(0, 150, 200, 0.2)');
            root.style.setProperty('--primary-glow', 'rgba(0, 150, 200, 0.2)');
            root.style.setProperty('--shadow-card', '0 4px 24px rgba(0, 0, 0, 0.4)');
            root.style.setProperty('--primary-cyan', 'rgb(0, 150, 200)');
            root.style.setProperty('--gradient-space', 'linear-gradient(180deg, #0a1520 0%, #0d1a28 50%, #081318 100%)'); // Dark Gradient
        } else {
            root.setAttribute('data-theme', 'light');
            // Pure White Theme (User Request)
            root.style.setProperty('--bg-dark', '#ffffff'); // Pure White background
            root.style.setProperty('--bg-darker', '#f8fafc'); // Very light gray for contrast
            root.style.setProperty('--bg-card', '#ffffff'); // White cards
            root.style.setProperty('--text-primary', '#0f172a'); // Dark text
            root.style.setProperty('--text-secondary', '#334155');
            root.style.setProperty('--text-tertiary', '#64748b');
            root.style.setProperty('--bg-input', '#f1f5f9');
            root.style.setProperty('--bg-hover', 'rgba(0, 0, 0, 0.1)'); // 10% fade (Light)
            root.style.setProperty('--border-subtle', 'rgba(148, 163, 184, 0.3)');
            root.style.setProperty('--border-neon', 'rgba(0, 150, 200, 0.15)');
            root.style.setProperty('--primary-glow', 'rgba(0, 150, 200, 0.1)');
            root.style.setProperty('--shadow-card', '0 4px 20px rgba(0, 0, 0, 0.05)');
            root.style.setProperty('--primary-cyan', 'rgb(0, 120, 160)');
            root.style.setProperty('--gradient-space', 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'); // Light/White Gradient
        }

        // Save to localStorage
        localStorage.setItem('theme_mode', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
