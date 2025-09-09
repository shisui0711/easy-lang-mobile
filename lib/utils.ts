import { Platform } from 'react-native';

/**
 * Utility functions for the mobile app
 */

// Format date to readable string
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format time to readable string
export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format duration in minutes to readable string
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

// Calculate level from XP
export const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

// Calculate XP needed for next level
export const getXPForNextLevel = (currentLevel: number): number => {
  return (currentLevel * currentLevel) * 100;
};

// Calculate progress percentage
export const calculateProgress = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min((current / total) * 100, 100);
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Generate random color for avatars
export const getRandomColor = (): string => {
  const colors = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#84CC16', // Lime
    '#F97316', // Orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Get initials from name
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
};

// Debounce function
export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Platform specific helpers
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Haptic feedback wrapper
export const hapticFeedback = async (type: 'light' | 'medium' | 'heavy' = 'light') => {
  try {
    const { impactAsync, ImpactFeedbackStyle } = await import('expo-haptics');
    const style = type === 'light' 
      ? ImpactFeedbackStyle.Light 
      : type === 'medium' 
        ? ImpactFeedbackStyle.Medium 
        : ImpactFeedbackStyle.Heavy;
    await impactAsync(style);
  } catch (error) {
    // Haptics not available, continue silently
  }
};

// Format numbers with K, M, B suffixes
export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

// Generate achievement badge color based on rarity
export const getAchievementColor = (rarity: string): string => {
  switch (rarity) {
    case 'common':
      return '#94A3B8'; // Slate
    case 'rare':
      return '#3B82F6'; // Blue
    case 'epic':
      return '#8B5CF6'; // Purple
    case 'legendary':
      return '#F59E0B'; // Amber
    default:
      return '#6B7280'; // Gray
  }
};

// Check if streak should be reset (if last activity was more than 24 hours ago)
export const shouldResetStreak = (lastActivityDate: string): boolean => {
  const now = new Date();
  const lastActivity = new Date(lastActivityDate);
  const timeDiff = now.getTime() - lastActivity.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);
  
  return hoursDiff > 24;
};

// Get encouragement message based on progress
export const getEncouragementMessage = (progress: number): string => {
  if (progress >= 90) return "Outstanding! You're crushing it! 🔥";
  if (progress >= 75) return "Great job! Keep up the momentum! ⭐";
  if (progress >= 50) return "You're halfway there! Don't give up! 💪";
  if (progress >= 25) return "Good start! Every step counts! 👍";
  return "Let's get started on your learning journey! 🚀";
};

// Shuffle array
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Safe area padding for different devices
export const getSafeAreaPadding = () => {
  if (isIOS) {
    return {
      paddingTop: 44, // iOS status bar height
      paddingBottom: 34, // iOS home indicator
    };
  }
  return {
    paddingTop: 24, // Android status bar height
    paddingBottom: 0,
  };
};