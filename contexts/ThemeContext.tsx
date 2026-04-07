import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
export type Language = 'he' | 'en';

interface ThemeContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>('he');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('saban-theme') as Theme | null;
    const savedLanguage = localStorage.getItem('saban-language') as Language | null;
    
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
    }

    if (savedLanguage) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Apply theme and language to document
  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    
    // Set theme
    if (theme === 'light') {
      html.classList.add('light');
    } else {
      html.classList.remove('light');
    }

    // Set language/direction
    html.lang = language;
    html.dir = language === 'he' ? 'rtl' : 'ltr';
    html.classList.toggle('ltr', language === 'en');

    // Save to localStorage
    localStorage.setItem('saban-theme', theme);
    localStorage.setItem('saban-language', language);
  }, [theme, language, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, language, toggleTheme, setTheme, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
