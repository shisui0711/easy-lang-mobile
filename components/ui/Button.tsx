import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticFeedback } from '@/lib/utils';
import { Spacing, Typography, BorderRadius } from '@/constants/Tokens';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: [string, string] | [string, string, string];
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  gradientColors = ['#3B82F6', '#8B5CF6'],
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}) => {
  const handlePress = async () => {
    if (!disabled && !loading) {
      await hapticFeedback('light');
      onPress();
    }
  };

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = Spacing.sm;
        baseStyle.paddingHorizontal = Spacing.md;
        baseStyle.minHeight = 36;
        break;
      case 'large':
        baseStyle.paddingVertical = Spacing.lg;
        baseStyle.paddingHorizontal = Spacing.xl;
        baseStyle.minHeight = 56;
        break;
      default: // medium
        baseStyle.paddingVertical = Spacing.md;
        baseStyle.paddingHorizontal = Spacing.lg;
        baseStyle.minHeight = 48;
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = cardColor;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = primaryColor;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      case 'gradient':
        // Gradient handled by LinearGradient wrapper
        break;
      default: // primary
        baseStyle.backgroundColor = primaryColor;
    }

    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: Typography.button.fontWeight,
    };

    // Size styles
    switch (size) {
      case 'small':
        baseTextStyle.fontSize = Typography.bodySmall.fontSize;
        break;
      case 'large':
        baseTextStyle.fontSize = Typography.bodyLarge.fontSize;
        break;
      default: // medium
        baseTextStyle.fontSize = Typography.button.fontSize;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseTextStyle.color = textColor;
        break;
      case 'outline':
        baseTextStyle.color = primaryColor;
        break;
      case 'ghost':
        baseTextStyle.color = primaryColor;
        break;
      default: // primary and gradient
        baseTextStyle.color = backgroundColor;
    }

    return baseTextStyle;
  };

  const buttonStyle = [getButtonStyle(), style];
  const finalTextStyle = [getTextStyle(), textStyle];

  const content = (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'gradient' ? backgroundColor : primaryColor}
          style={{ marginRight: Spacing.sm }}
        />
      )}
      <Text 
        style={finalTextStyle}
        accessible={false} // Prevent nested accessibility elements
      >
        {title}
      </Text>
    </>
  );

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={style}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        {...rest}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[getButtonStyle(), { backgroundColor: 'transparent' }]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={buttonStyle}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...rest}
    >
      {content}
    </TouchableOpacity>
  );
};