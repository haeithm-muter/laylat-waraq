import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardColorTheme } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';

interface ColorThemeSwatchProps {
  theme: CardColorTheme;
  selected: boolean;
  onPress: () => void;
}

export function ColorThemeSwatch({ theme, selected, onPress }: ColorThemeSwatchProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={styles.wrapper}
    >
      <View
        style={[
          styles.swatch,
          { backgroundColor: theme.accent },
          selected && { borderColor: theme.accentDark, borderWidth: 3 },
        ]}
      >
        {selected && <Ionicons name="checkmark" size={18} color={theme.onAccent} />}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {theme.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: 60,
    gap: spacing.xs,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: '#FBF6EA',
    writingDirection: 'rtl',
  },
});
