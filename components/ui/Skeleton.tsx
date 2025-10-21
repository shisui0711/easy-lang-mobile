import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, BorderRadius } from '@/constants/Tokens';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
  animated?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.md,
  style,
  animated = true,
}) => {
  const backgroundColor = useThemeColor({}, 'gray300');
  const animatedBackgroundColor = useThemeColor({}, 'gray200');

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    >
      {animated && (
        <Animated.View
          entering={FadeIn.duration(1000)}
          exiting={FadeOut.duration(1000)}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: animatedBackgroundColor,
              borderRadius,
            },
          ]}
        />
      )}
    </View>
  );
};

interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string | number;
  style?: any;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 1,
  lastLineWidth = '80%',
  style,
}) => {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          style={[
            styles.textLine,
            index === lines - 1 && { width: lastLineWidth },
            index < lines - 1 && { marginBottom: Spacing.sm },
          ]}
        />
      ))}
    </View>
  );
};

interface SkeletonCardProps {
  style?: any;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <Skeleton width={40} height={40} borderRadius={20} style={styles.avatar} />
      <View style={styles.content}>
        <SkeletonText lines={2} lastLineWidth="60%" />
      </View>
    </View>
  );
};

interface SkeletonListProps {
  count?: number;
  style?: any;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ count = 5, style }) => {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={styles.listItem} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  textContainer: {
    width: '100%',
  },
  textLine: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  avatar: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  listItem: {
    marginBottom: Spacing.md,
  },
});