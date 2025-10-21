import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';

export const FeedbackButton: React.FC = () => {
  const router = useRouter();
  const backgroundColor = useThemeColor({ light: '#3B82F6', dark: '#3B82F6' }, 'primary');
  const iconColor = useThemeColor({ light: '#FFFFFF', dark: '#FFFFFF' }, 'white');

  const handlePress = () => {
    router.push('/(tabs)/feedback' as any);
  };

  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor }]}
      onPress={handlePress}
      accessibilityLabel="Feedback button"
      accessibilityHint="Tap to provide feedback about the app"
    >
      <Ionicons name="chatbubble-ellipses" size={24} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});