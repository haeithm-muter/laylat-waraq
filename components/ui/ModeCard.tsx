import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { fontFamily } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { useActiveCardTheme } from '@/hooks/useActiveCardTheme';

interface ModeCardProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  size?: 'lg' | 'md';
}

export function ModeCard({ icon, title, subtitle, onPress, size = 'lg' }: ModeCardProps) {
  const theme = useActiveCardTheme();
  const isLarge = size === 'lg';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isLarge ? styles.cardLarge : styles.cardMedium,
        { borderColor: theme.accent },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.icon, isLarge ? styles.iconLarge : styles.iconMedium]}>{icon}</Text>
      <Text style={[styles.title, isLarge && styles.titleLarge]}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 2,
    backgroundColor: 'rgba(8, 20, 16, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    overflow: 'hidden',
  },
  cardLarge: {
    flex: 1,
    minHeight: 180,
    gap: spacing.xs,
  },
  cardMedium: {
    flex: 1,
    minHeight: 130,
    gap: 2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  icon: {
    marginBottom: spacing.xs,
  },
  iconLarge: {
    fontSize: 48,
  },
  iconMedium: {
    fontSize: 34,
  },
  title: {
    fontFamily: fontFamily.extraBold,
    fontSize: 16,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  titleLarge: {
    fontSize: 20,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
});
