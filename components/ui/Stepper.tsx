import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { useActiveCardTheme } from '@/hooks/useActiveCardTheme';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function Stepper({ value, min, max, step = 1, onChange }: StepperProps) {
  const theme = useActiveCardTheme();
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => canIncrease && onChange(Math.min(max, value + step))}
        disabled={!canIncrease}
        style={[styles.button, { borderColor: theme.accent }, !canIncrease && styles.buttonDisabled]}
        hitSlop={8}
      >
        <Ionicons name="add" size={18} color={canIncrease ? theme.accent : colors.textOnDarkMuted} />
      </Pressable>

      <Text style={styles.value}>{value}</Text>

      <Pressable
        onPress={() => canDecrease && onChange(Math.max(min, value - step))}
        disabled={!canDecrease}
        style={[styles.button, { borderColor: theme.accent }, !canDecrease && styles.buttonDisabled]}
        hitSlop={8}
      >
        <Ionicons name="remove" size={18} color={canDecrease ? theme.accent : colors.textOnDarkMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    borderColor: colors.border,
  },
  value: {
    minWidth: 36,
    textAlign: 'center',
    fontFamily: fontFamily.extraBold,
    fontSize: 18,
    color: colors.textOnDark,
  },
});
