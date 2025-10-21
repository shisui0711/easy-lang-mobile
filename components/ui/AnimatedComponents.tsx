import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  FadeInLeft, 
  FadeInRight,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  FadeOutLeft,
  FadeOutRight,
  SlideInDown,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
  SlideOutDown,
  SlideOutUp,
  SlideOutLeft,
  SlideOutRight,
  BounceIn,
  BounceInDown,
  BounceInUp,
  BounceInLeft,
  BounceInRight,
  BounceOut,
  BounceOutDown,
  BounceOutUp,
  BounceOutLeft,
  BounceOutRight,
  ZoomIn,
  ZoomInDown,
  ZoomInUp,
  ZoomInLeft,
  ZoomInRight,
  ZoomInEasyDown,
  ZoomInEasyUp,
  ZoomOut,
  ZoomOutDown,
  ZoomOutUp,
  ZoomOutLeft,
  ZoomOutRight,
  LightSpeedInLeft,
  LightSpeedInRight,
  LightSpeedOutLeft,
  LightSpeedOutRight,
  StretchInX,
  StretchInY,
  StretchOutX,
  StretchOutY,
  FlipInXUp,
  FlipInXDown,
  FlipInYLeft,
  FlipInYRight,
  FlipOutXUp,
  FlipOutXDown,
  FlipOutYLeft,
  FlipOutYRight,
  RotateInDownLeft,
  RotateInDownRight,
  RotateInUpLeft,
  RotateInUpRight,
  RotateOutDownLeft,
  RotateOutDownRight,
  RotateOutUpLeft,
  RotateOutUpRight,
} from 'react-native-reanimated';
import { Spacing, Animation } from '@/constants/Tokens';

// Animated View component
export const AnimatedView: React.FC<{
  children: React.ReactNode;
  entering?: any;
  exiting?: any;
  style?: any;
}> = ({ children, entering = FadeIn, exiting = FadeOut, style }) => {
  return (
    <Animated.View
      entering={entering.duration(Animation.duration.normal)}
      exiting={exiting.duration(Animation.duration.normal)}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

// Animated Text component
export const AnimatedText: React.FC<{
  children: React.ReactNode;
  entering?: any;
  exiting?: any;
  style?: any;
}> = ({ children, entering = FadeIn, exiting = FadeOut, style }) => {
  return (
    <Animated.Text
      entering={entering.duration(Animation.duration.normal)}
      exiting={exiting.duration(Animation.duration.normal)}
      style={style}
    >
      {children}
    </Animated.Text>
  );
};

// Fade in components
export const FadeInView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={FadeIn} exiting={FadeOut} style={style}>
    {children}
  </AnimatedView>
);

export const FadeInDownView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={FadeInDown} exiting={FadeOutDown} style={style}>
    {children}
  </AnimatedView>
);

export const FadeInUpView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={FadeInUp} exiting={FadeOutUp} style={style}>
    {children}
  </AnimatedView>
);

export const FadeInLeftView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={FadeInLeft} exiting={FadeOutLeft} style={style}>
    {children}
  </AnimatedView>
);

export const FadeInRightView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={FadeInRight} exiting={FadeOutRight} style={style}>
    {children}
  </AnimatedView>
);

// Slide in components
export const SlideInDownView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={SlideInDown} exiting={SlideOutDown} style={style}>
    {children}
  </AnimatedView>
);

export const SlideInUpView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={SlideInUp} exiting={SlideOutUp} style={style}>
    {children}
  </AnimatedView>
);

export const SlideInLeftView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={SlideInLeft} exiting={SlideOutLeft} style={style}>
    {children}
  </AnimatedView>
);

export const SlideInRightView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={SlideInRight} exiting={SlideOutRight} style={style}>
    {children}
  </AnimatedView>
);

// Bounce components
export const BounceInView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={BounceIn} exiting={BounceOut} style={style}>
    {children}
  </AnimatedView>
);

export const BounceInDownView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={BounceInDown} exiting={BounceOutDown} style={style}>
    {children}
  </AnimatedView>
);

export const BounceInUpView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={BounceInUp} exiting={BounceOutUp} style={style}>
    {children}
  </AnimatedView>
);

export const BounceInLeftView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={BounceInLeft} exiting={BounceOutLeft} style={style}>
    {children}
  </AnimatedView>
);

export const BounceInRightView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={BounceInRight} exiting={BounceOutRight} style={style}>
    {children}
  </AnimatedView>
);

// Zoom components
export const ZoomInView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={ZoomIn} exiting={ZoomOut} style={style}>
    {children}
  </AnimatedView>
);

export const ZoomInDownView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={ZoomInDown} exiting={ZoomOutDown} style={style}>
    {children}
  </AnimatedView>
);

export const ZoomInUpView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={ZoomInUp} exiting={ZoomOutUp} style={style}>
    {children}
  </AnimatedView>
);

export const ZoomInLeftView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={ZoomInLeft} exiting={ZoomOutLeft} style={style}>
    {children}
  </AnimatedView>
);

export const ZoomInRightView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={ZoomInRight} exiting={ZoomOutRight} style={style}>
    {children}
  </AnimatedView>
);

// LightSpeed components
export const LightSpeedInLeftView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={LightSpeedInLeft} exiting={LightSpeedOutLeft} style={style}>
    {children}
  </AnimatedView>
);

export const LightSpeedInRightView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={LightSpeedInRight} exiting={LightSpeedOutRight} style={style}>
    {children}
  </AnimatedView>
);

// Stretch components
export const StretchInXView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={StretchInX} exiting={StretchOutX} style={style}>
    {children}
  </AnimatedView>
);

export const StretchInYView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={StretchInY} exiting={StretchOutY} style={style}>
    {children}
  </AnimatedView>
);

// Flip components
export const FlipInXUpView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={FlipInXUp} exiting={FlipOutXUp} style={style}>
    {children}
  </AnimatedView>
);

export const FlipInXDownView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={FlipInXDown} exiting={FlipOutXDown} style={style}>
    {children}
  </AnimatedView>
);

export const FlipInYLeftView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={FlipInYLeft} exiting={FlipOutYLeft} style={style}>
    {children}
  </AnimatedView>
);

export const FlipInYRightView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={FlipInYRight} exiting={FlipOutYRight} style={style}>
    {children}
  </AnimatedView>
);

// Rotate components
export const RotateInDownLeftView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={RotateInDownLeft} exiting={RotateOutDownLeft} style={style}>
    {children}
  </AnimatedView>
);

export const RotateInDownRightView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={RotateInDownRight} exiting={RotateOutDownRight} style={style}>
    {children}
  </AnimatedView>
);

export const RotateInUpLeftView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={RotateInUpLeft} exiting={RotateOutUpLeft} style={style}>
    {children}
  </AnimatedView>
);

export const RotateInUpRightView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <AnimatedView entering={RotateInUpRight} exiting={RotateOutUpRight} style={style}>
    {children}
  </AnimatedView>
);

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
});