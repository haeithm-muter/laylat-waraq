import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

type Provider = 'email' | 'apple' | 'facebook';

const PROVIDER_STYLE: Record<Provider, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  email: { bg: colors.cream, fg: '#241B12', icon: 'mail' },
  apple: { bg: '#000000', fg: '#FFFFFF', icon: 'logo-apple' },
  facebook: { bg: '#1877F2', fg: '#FFFFFF', icon: 'logo-facebook' },
};

interface SocialAuthButtonProps {
  provider: Provider;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SocialAuthButton({ provider, label, onPress, loading, disabled }: SocialAuthButtonProps) {
  const s = PROVIDER_STYLE[provider];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: s.bg },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={s.fg} />
      ) : (
        <View style={styles.content}>
          <Ionicons name={s.icon} size={20} color={s.fg} />
          <Text style={[styles.label, { color: s.fg }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    minWidth: 190,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  content: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    writingDirection: 'rtl',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
