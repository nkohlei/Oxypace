import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';

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

    const isFirstMount = useRef(true);

    // Apply theme changes instantaneously (0ms freeze, zero startViewTransition bitmap stall)
    useEffect(() => {
        const root = document.documentElement;

        const applyThemeClasses = () => {
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
        };

        if (isFirstMount.current) {
            isFirstMount.current = false;
            applyThemeClasses();
            return;
        }

        // Disable transitions for 1 frame so hundreds of nodes swap colors in a single paint
        root.classList.add('theme-switching');
        applyThemeClasses();
        let raf2 = null;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
                root.classList.remove('theme-switching');
            });
        });
        return () => {
            cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
            root.classList.remove('theme-switching');
        };
    }, [isDark]);

    const toggleTheme = useCallback(() => {
        setIsDark((prev) => !prev);
    }, []);

    const toggleMotionSpeed = useCallback(() => {
        setMotionSpeed((prev) => (prev === '1x' ? '0.5x' : '1x'));
    }, []);

    const contextValue = useMemo(
        () => ({ isDark, toggleTheme, motionSpeed, setMotionSpeed, toggleMotionSpeed }),
        [isDark, toggleTheme, motionSpeed, toggleMotionSpeed]
    );

    return (
        <ThemeContext.Provider value={contextValue}>
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
