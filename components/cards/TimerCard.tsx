import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';

interface TimerCardProps {
  secondsLeft: number;
  isUrgent: boolean;
  running: boolean;
  onToggleRunning: () => void;
  /** False outside the live question phase, where pausing would be a no-op. */
  showControl?: boolean;
  compact?: boolean;
}

function format(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function TimerCard({
  secondsLeft,
  isUrgent,
  running,
  onToggleRunning,
  showControl = true,
  compact = false,
}: TimerCardProps) {
  const expired = secondsLeft <= 0;
  const accent = expired || isUrgent ? colors.danger : colors.cream;

  // Gentle pulse on the digits during the last 10s — starts/stops with
  // isUrgent rather than looping for the card's whole lifetime.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isUrgent) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 450, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isUrgent, pulse]);
  const digitsScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={[styles.card, compact && styles.cardCompact, isUrgent && styles.cardUrgent]}>
      <View style={styles.headerRow}>
        <Ionicons name="stopwatch-outline" size={compact ? 14 : 18} color={colors.textOnDarkMuted} />
        <Text style={styles.headerLabel}>الوقت</Text>
      </View>

      <Animated.Text
        style={[
          styles.digits,
          compact && styles.digitsCompact,
          { color: accent, transform: [{ scale: digitsScale }] },
        ]}
        numberOfLines={1}
      >
        {format(secondsLeft)}
      </Animated.Text>

      {!compact && (
        <Text style={styles.hint}>
          {expired ? 'انتهى الوقت!' : 'يبدأ العد بعد القراءة'}
        </Text>
      )}

      {showControl && !expired && (
        <Pressable onPress={onToggleRunning} style={styles.controlButton} hitSlop={8}>
          <Ionicons
            name={running ? 'pause' : 'play'}
            size={compact ? 13 : 15}
            color={colors.textOnDark}
          />
          <Text style={styles.controlLabel}>{running ? 'إيقاف مؤقت' : 'متابعة'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(8, 20, 16, 0.5)',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  cardCompact: {
    padding: spacing.sm,
    gap: 2,
  },
  cardUrgent: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(229, 88, 77, 0.10)',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  digits: {
    fontFamily: fontFamily.black,
    fontSize: 56,
    lineHeight: 66,
    fontVariant: ['tabular-nums'],
  },
  digitsCompact: {
    fontSize: 32,
    lineHeight: 40,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  controlButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: spacing.xs,
  },
  controlLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
});
