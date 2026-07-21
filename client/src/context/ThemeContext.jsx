import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme') || localStorage.getItem('theme_mode');
        return saved ? saved === 'dark' : true; // Default to dark
    });

    // Apply theme changes synchronously with Blog
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');
            root.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            localStorage.setItem('theme_mode', 'dark');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
            root.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            localStorage.setItem('theme_mode', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>{children}</ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
