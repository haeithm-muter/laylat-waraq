import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 140 }: QRCodeDisplayProps) {
  return (
    <View style={styles.card}>
      <QRCode value={value} size={size} color={colors.textOnLight} backgroundColor={colors.card} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: '#D4A657',
  },
});
