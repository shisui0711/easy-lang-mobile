import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/Tokens';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  ...otherProps 
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return (
    <View 
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[{ backgroundColor, padding: Spacing.md }, style]} 
      {...otherProps} 
    />
  );
}