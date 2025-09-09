import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}) => {
  const getBadgeStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = 8;
        baseStyle.paddingVertical = 4;
        baseStyle.minHeight = 20;
        break;
      case 'large':
        baseStyle.paddingHorizontal = 16;
        baseStyle.paddingVertical = 8;
        baseStyle.minHeight = 32;
        break;
      default: // medium
        baseStyle.paddingHorizontal = 12;
        baseStyle.paddingVertical = 6;
        baseStyle.minHeight = 24;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = '#F1F5F9';
        break;
      case 'success':
        baseStyle.backgroundColor = '#DCFCE7';
        break;
      case 'warning':
        baseStyle.backgroundColor = '#FEF3C7';
        break;
      case 'error':
        baseStyle.backgroundColor = '#FEE2E2';
        break;
      case 'info':
        baseStyle.backgroundColor = '#DBEAFE';
        break;
      default: // primary
        baseStyle.backgroundColor = '#3B82F6';
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseTextStyle.fontSize = 10;
        break;
      case 'large':
        baseTextStyle.fontSize = 14;
        break;
      default: // medium
        baseTextStyle.fontSize = 12;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseTextStyle.color = '#475569';
        break;
      case 'success':
        baseTextStyle.color = '#166534';
        break;
      case 'warning':
        baseTextStyle.color = '#92400E';
        break;
      case 'error':
        baseTextStyle.color = '#991B1B';
        break;
      case 'info':
        baseTextStyle.color = '#1E40AF';
        break;
      default: // primary
        baseTextStyle.color = '#FFFFFF';
    }

    return baseTextStyle;
  };

  return (
    <View style={[getBadgeStyle(), style]}>
      <Text style={[getTextStyle(), textStyle]}>
        {children}
      </Text>
    </View>
  );
};