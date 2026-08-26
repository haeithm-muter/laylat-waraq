import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { fontFamily } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { useActiveCardTheme } from '@/hooks/useActiveCardTheme';

interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleGroupProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function ToggleGroup<T extends string>({ options, value, onChange }: ToggleGroupProps<T>) {
  const theme = useActiveCardTheme();

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.pill,
              selected ? { backgroundColor: theme.accent } : styles.pillInactive,
            ]}
          >
            <Text style={[styles.label, { color: selected ? theme.onAccent : colors.textOnDarkMuted }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  pillInactive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
  },
});
