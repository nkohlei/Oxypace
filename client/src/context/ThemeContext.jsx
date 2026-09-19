import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme') || localStorage.getItem('theme_mode');
        return saved ? saved === 'dark' : true; // Default to dark
    });

    const [motionSpeed, setMotionSpeed] = useState(() => {
        return localStorage.getItem('motion_speed') || '1x';
    });

    // Apply motion speed to CSS variables
    useEffect(() => {
        const root = document.documentElement;
        if (motionSpeed === '0.5x') {
            root.style.setProperty('--motion-speed', '2'); // 2x duration = 0.5x speed
            root.setAttribute('data-motion-speed', '0.5x');
        } else {
            root.style.setProperty('--motion-speed', '1'); // 1x duration
            root.setAttribute('data-motion-speed', '1x');
        }
        localStorage.setItem('motion_speed', motionSpeed);
    }, [motionSpeed]);

    // Apply theme changes with smooth morphing
    useEffect(() => {
        const root = document.documentElement;

        // Smooth transition class for color morphing
        root.classList.add('theme-transitioning');
        const timer = setTimeout(() => {
            root.classList.remove('theme-transitioning');
        }, 300);

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

        return () => clearTimeout(timer);
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    const toggleMotionSpeed = () => {
        setMotionSpeed((prev) => (prev === '1x' ? '0.5x' : '1x'));
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, motionSpeed, setMotionSpeed, toggleMotionSpeed }}>
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
