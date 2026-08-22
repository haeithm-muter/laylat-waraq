import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

interface LogoProps {
  size?: 'lg' | 'md' | 'sm';
  tagline?: boolean;
  light?: boolean;
}

const SIZES = {
  lg: { title: 44, flourish: 120, gap: 10 },
  md: { title: 32, flourish: 90, gap: 8 },
  sm: { title: 22, flourish: 64, gap: 6 },
};

/** Small ornamental swash used above/below the wordmark. */
function Flourish({ width, color }: { width: number; color: string }) {
  const h = width * 0.22;
  return (
    <Svg width={width} height={h} viewBox="0 0 120 26">
      <Path
        d="M2 13 C 30 2, 45 24, 60 13 C 75 2, 90 24, 118 13"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx={60} cy={13} r={4} fill={color} />
    </Svg>
  );
}

export function Logo({ size = 'lg', tagline = false, light = false }: LogoProps) {
  const s = SIZES[size];
  const titleColor = light ? colors.cream : '#D4A657';

  return (
    <View style={styles.container}>
      <Flourish width={s.flourish} color={titleColor} />
      <View style={{ height: s.gap }} />
      <Text
        style={[
          styles.title,
          { fontSize: s.title, lineHeight: s.title * 1.25, color: titleColor },
        ]}
      >
        🃏 ليلة ورق
      </Text>
      {tagline && <Text style={styles.tagline}>العبوا، تحدّوا، اكسبوا النقاط</Text>}
      <View style={{ height: s.gap }} />
      <Flourish width={s.flourish} color={titleColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.black,
    textAlign: 'center',
    writingDirection: 'rtl',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    marginTop: 4,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
