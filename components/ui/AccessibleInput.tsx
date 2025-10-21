import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography, BorderRadius } from '@/constants/Tokens';

interface AccessibleInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  required?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  error,
  required = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const errorColor = useThemeColor({}, 'error');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.container}>
      <Text 
        style={[styles.label, { color: textColor }]}
        accessible={false} // Label is associated with input via accessibilityLabel
      >
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          { 
            color: textColor, 
            backgroundColor: cardColor,
            borderColor: error ? errorColor : borderColor,
          },
          multiline && styles.multiline,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={useThemeColor({}, 'gray500')}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        multiline={multiline}
        numberOfLines={numberOfLines}
        accessible={true}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityRole="text"
      />
      {error && (
        <Text 
          style={[styles.error, { color: errorColor }]}
          accessible={true}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  required: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.body.fontSize,
    minHeight: 48,
  },
  multiline: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: Typography.caption.fontSize,
    marginTop: Spacing.sm,
  },
});