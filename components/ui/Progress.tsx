import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressProps {
  value: number; // 0-100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  gradientColors?: string[];
  animated?: boolean;
  style?: ViewStyle;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  height = 8,
  backgroundColor = '#E2E8F0',
  progressColor = '#3B82F6',
  gradientColors,
  animated = true,
  style,
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const progressWidth = `${clampedValue}%`;

  const containerStyle = [
    styles.container,
    {
      height,
      backgroundColor,
      borderRadius: height / 2,
    },
    style,
  ];

  const progressStyle = [
    styles.progress,
    {
      width: progressWidth as DimensionValue,
      height,
      borderRadius: height / 2,
    },
  ];

  if (gradientColors) {
    return (
      <View style={containerStyle}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={progressStyle}
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <View style={[progressStyle, { backgroundColor: progressColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});