import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getInitials, getRandomColor } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  firstName?: string;
  lastName?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  textStyle?: TextStyle;
  backgroundColor?: string;
  gradientColors?: string[];
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  firstName = '',
  lastName = '',
  size = 'medium',
  style,
  textStyle,
  backgroundColor,
  gradientColors,
}) => {
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32, borderRadius: 16 };
      case 'large':
        return { width: 64, height: 64, borderRadius: 32 };
      case 'xlarge':
        return { width: 80, height: 80, borderRadius: 40 };
      default: // medium
        return { width: 48, height: 48, borderRadius: 24 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 24;
      case 'xlarge':
        return 28;
      default: // medium
        return 16;
    }
  };

  const sizeStyle = getSizeStyle();
  const textSize = getTextSize();
  const initials = getInitials(firstName, lastName);
  
  const avatarStyle = [
    styles.avatar,
    sizeStyle,
    {
      backgroundColor: backgroundColor || getRandomColor(),
    },
    style,
  ];

  const finalTextStyle = [
    styles.text,
    {
      fontSize: textSize,
    },
    textStyle,
  ];

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={sizeStyle as any}
        // Remove the defaultSource for now as we don't have the image
      />
    );
  }

  if (gradientColors) {
    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[sizeStyle, style]}
      >
        <View style={[styles.avatarContent, sizeStyle]}>
          <Text style={finalTextStyle}>{initials}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={avatarStyle}>
      <Text style={finalTextStyle}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});