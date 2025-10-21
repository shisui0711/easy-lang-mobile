/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// Extended color palette for consistent design language
export const Colors = {
  light: {
    // Base colors
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // Extended palette
    primary: '#0a7ea4',
    secondary: '#687076',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Grayscale
    white: '#ffffff',
    gray100: '#f8fafc',
    gray200: '#f1f5f9',
    gray300: '#e2e8f0',
    gray400: '#cbd5e1',
    gray500: '#94a3b8',
    gray600: '#64748b',
    gray700: '#475569',
    gray800: '#334155',
    gray900: '#1e293b',
    black: '#000000',
    
    // Component colors
    card: '#ffffff',
    border: '#e2e8f0',
    notification: '#ef4444',
  },
  dark: {
    // Base colors
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // Extended palette
    primary: '#2dd4bf',
    secondary: '#9BA1A6',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Grayscale
    white: '#ffffff',
    gray100: '#1e293b',
    gray200: '#334155',
    gray300: '#475569',
    gray400: '#64748b',
    gray500: '#94a3b8',
    gray600: '#cbd5e1',
    gray700: '#e2e8f0',
    gray800: '#f1f5f9',
    gray900: '#f8fafc',
    black: '#000000',
    
    // Component colors
    card: '#1e293b',
    border: '#334155',
    notification: '#ef4444',
  },
};