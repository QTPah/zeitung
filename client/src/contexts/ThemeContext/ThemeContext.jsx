import { createContext, useContext, useEffect, useState } from 'react';

export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    
    let theme = (localStorage.getItem('theme') || 'light').trim();

    const getStyles = (themes) => themes[theme];
    

    const value = {
        getStyles,
        theme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}