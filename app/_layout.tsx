import React, { useCallback, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useAuthStore } from '@/store/authStore';
import { lockLandscape } from '@/utils/orientation';
import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Minimum time the branded splash stays on screen, so it reads as an
// intentional moment rather than a flicker on fast devices/warm starts.
const MIN_SPLASH_MS = 900;

export default function RootLayout() {
  const { fontsLoaded, fontError } = useAppFonts();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  const user = useAuthStore((s) => s.user);
  const initializing = useAuthStore((s) => s.initializing);
  const setUser = useAuthStore((s) => s.setUser);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  // Arabic-first app: allow RTL for native primitives. We intentionally skip
  // I18nManager.forceRTL()+reload here (see README) — layout-level RTL is
  // handled explicitly per-component (row-reverse, writingDirection: 'rtl'),
  // which is safer to ship mid-sprint than a forced native reload loop.
  useEffect(() => {
    I18nManager.allowRTL(true);
  }, []);

  useEffect(() => {
    lockLandscape();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, [setUser, setInitializing]);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const onSplashLayout = useCallback(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  const appReady = (fontsLoaded || Boolean(fontError)) && minTimeElapsed && !initializing;

  if (!appReady) {
    return <AppSplashScreen onLayout={onSplashLayout} />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar hidden />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(game)" />
        </Stack>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
