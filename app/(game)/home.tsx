import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { useAuthStore } from '@/store/authStore';
import { useActiveCardTheme } from '@/hooks/useActiveCardTheme';
import { Avatar } from '@/components/ui/Avatar';
import { SettingsPanel } from '@/components/ui/SettingsPanel';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const theme = useActiveCardTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const pulse = useRef(new Animated.Value(0)).current;

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'ضيف';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const onPlayPress = () => router.push('/(game)/mode-select');

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.05] });

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.feltDark, colors.feltDarker]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <View style={styles.profileGroup}>
            <Avatar name={displayName} />
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
          </View>

          <Pressable
            onPress={() => setSettingsOpen(true)}
            style={styles.settingsButton}
            accessibilityLabel="الإعدادات"
          >
            <Ionicons name="settings-sharp" size={22} color={colors.textOnDark} />
          </Pressable>
        </View>

        <View style={styles.center}>
          <Animated.View
            style={[
              styles.glow,
              { backgroundColor: theme.accent, transform: [{ scale: glowScale }], opacity: glowOpacity },
            ]}
          />

          <Pressable onPress={onPlayPress} style={({ pressed }) => [pressed && styles.ctaPressed]}>
            <View style={[styles.ctaCircle, { backgroundColor: theme.accent }]}>
              <Text style={styles.ctaEmoji}>🃏</Text>
              <Text style={[styles.ctaLabel, { color: theme.onAccent }]}>لنلعب!</Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>

      <SettingsPanel visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.feltDark,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  profileGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 220,
  },
  profileName: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  ctaCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  ctaEmoji: {
    fontSize: 52,
  },
  ctaLabel: {
    marginTop: spacing.xs,
    fontFamily: fontFamily.black,
    fontSize: 24,
    writingDirection: 'rtl',
  },
});
