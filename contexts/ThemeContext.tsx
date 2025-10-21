import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  colorScheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemTheme = useColorScheme() ?? 'light';
  const [theme, setThemeState] = useState<Theme>('system');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(systemTheme);

  // Load saved theme preference
  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Apply theme when theme or system theme changes
  useEffect(() => {
    applyTheme();
  }, [theme, systemTheme]);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        setThemeState(savedTheme);
      } else {
        setThemeState('system');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      setThemeState('system');
    }
  };

  const applyTheme = () => {
    const newColorScheme = theme === 'system' ? systemTheme : theme;
    setColorScheme(newColorScheme);
    
    // Update StatusBar and other native UI elements
    // This would require additional native modules for full implementation
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme: Theme = 
      theme === 'light' ? 'dark' : 
      theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);
  };

  const value: ThemeContextValue = {
    theme,
    colorScheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};