import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography, BorderRadius } from '@/constants/Tokens';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { FadeInView } from '@/components/ui/AnimatedComponents';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  retryLabel?: string;
  goBackLabel?: string;
  style?: any;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  onGoBack,
  retryLabel = 'Try Again',
  goBackLabel = 'Go Back',
  style,
}) => {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const errorColor = useThemeColor({}, 'error');

  return (
    <FadeInView style={[styles.container, { backgroundColor }, style]}>
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={60} color={errorColor} />
        </View>
        
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        <Text style={[styles.message, { color: textColor }]}>{message}</Text>
        
        <View style={styles.actions}>
          {onRetry && (
            <Button
              title={retryLabel}
              onPress={onRetry}
              style={styles.button}
              fullWidth
            />
          )}
          
          {onGoBack && (
            <Button
              title={goBackLabel}
              onPress={onGoBack}
              variant="outline"
              style={styles.button}
              fullWidth
            />
          )}
        </View>
      </View>
    </FadeInView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.body.fontSize,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.body.lineHeight,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  button: {
    marginTop: Spacing.sm,
  },
});