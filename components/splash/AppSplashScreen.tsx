import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { Logo } from '@/components/branding/Logo';
import { colors } from '@/theme/colors';

interface AppSplashScreenProps {
  onLayout?: (event: LayoutChangeEvent) => void;
}

/**
 * JS-rendered splash shown right after the native static splash hides.
 * Same background color as the native splash (see app.json →
 * plugins → expo-splash-screen) so the handoff is seamless, then plays a
 * short branded entrance before app/_layout.tsx routes to login/home.
 */
export function AppSplashScreen({ onLayout }: AppSplashScreenProps) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 60 }),
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Logo size="lg" tagline />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.feltDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
