import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fontFamily } from '@/theme/typography';
import { useActiveCardTheme } from '@/hooks/useActiveCardTheme';

interface AvatarProps {
  name?: string | null;
  size?: number;
}

export function Avatar({ name, size = 44 }: AvatarProps) {
  const theme = useActiveCardTheme();
  const initial = (name ?? 'ض').trim().charAt(0).toUpperCase() || 'ض';

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.accent },
      ]}
    >
      <Text style={[styles.initial, { color: theme.onAccent, fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fontFamily.extraBold,
  },
});
