import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography } from '@/constants/Tokens';
import { SkeletonText, SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';
import { FadeInView } from '@/components/ui/AnimatedComponents';

interface LoadingScreenProps {
  message?: string;
  showSkeleton?: boolean;
  skeletonType?: 'text' | 'card' | 'list';
  style?: any;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  showSkeleton = true,
  skeletonType = 'list',
  style,
}) => {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <FadeInView style={[styles.container, { backgroundColor }, style]}>
      <View style={styles.content}>
        <Text style={[styles.message, { color: textColor }]}>{message}</Text>
        
        {showSkeleton && (
          <View style={styles.skeletonContainer}>
            {skeletonType === 'text' && <SkeletonText lines={3} />}
            {skeletonType === 'card' && <SkeletonCard />}
            {skeletonType === 'list' && <SkeletonList />}
          </View>
        )}
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
  content: {
    width: '100%',
    maxWidth: 500,
  },
  message: {
    fontSize: Typography.bodyLarge.fontSize,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  skeletonContainer: {
    width: '100%',
  },
});