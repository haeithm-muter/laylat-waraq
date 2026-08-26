import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { fontFamily } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { useActiveCardTheme } from '@/hooks/useActiveCardTheme';

interface SliderFieldProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function SliderField({ value, min, max, step = 1, unit = '', onChange }: SliderFieldProps) {
  const theme = useActiveCardTheme();

  return (
    <View style={styles.wrapper}>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={theme.accent}
        maximumTrackTintColor="rgba(255,255,255,0.18)"
        thumbTintColor={theme.accent}
        style={styles.slider}
      />
      <Text style={styles.value}>
        {value}
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  slider: {
    flex: 1,
    height: 36,
  },
  value: {
    minWidth: 48,
    textAlign: 'center',
    fontFamily: fontFamily.extraBold,
    fontSize: 16,
    color: colors.textOnDark,
  },
});
