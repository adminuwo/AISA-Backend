import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('app_theme');
        return saved || 'light';
    });

    const [accentColor, setAccentColor] = useState(() => {
        return localStorage.getItem('app_accent') || 'Default';
    });

    // Default: Blue (240 100% 67%)
    const ACCENT_COLORS = {
        'Default': '240 100% 67%',
        'Blue': '217 91% 60%',
        'Green': '142 71% 45%',
        'Purple': '262 83% 58%',
        'Orange': '24 95% 53%',
        'Pink': '330 81% 60%',
        'Red': '0 84% 60%'
    };

    const ACCENT_RINGS = {
        'Default': '240 100% 67%',
        'Blue': '217 91% 60%',
        'Green': '142 71% 45%',
        'Purple': '262 83% 58%',
        'Orange': '24 95% 53%',
        'Pink': '330 81% 60%',
        'Red': '0 84% 60%'
    };

    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (currentTheme) => {
            root.classList.remove('light', 'dark');
            if (currentTheme.toLowerCase() === 'system') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                root.classList.add(isDark ? 'dark' : 'light');
            } else {
                root.classList.add(currentTheme.toLowerCase());
            }
        };

        applyTheme(theme);

        if (theme.toLowerCase() === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme('system');

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }

        localStorage.setItem('app_theme', theme);
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        const colorVal = ACCENT_COLORS[accentColor] || ACCENT_COLORS['Default'];
        const ringVal = ACCENT_RINGS[accentColor] || ACCENT_RINGS['Default'];

        root.style.setProperty('--primary', colorVal);
        root.style.setProperty('--ring', ringVal);

        localStorage.setItem('app_accent', accentColor);
    }, [accentColor]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor, ACCENT_COLORS }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
