/**
 * ليلة ورق — Typography
 * Font: Cairo (Google Fonts) — loaded via hooks/useAppFonts.ts
 */
import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Cairo_400Regular',
  medium: 'Cairo_500Medium',
  semiBold: 'Cairo_600SemiBold',
  bold: 'Cairo_700Bold',
  extraBold: 'Cairo_800ExtraBold',
  black: 'Cairo_900Black',
} as const;

// Arabic script sits visually smaller than Latin at the same pt size,
// and Cairo needs slightly taller line-heights to avoid clipping diacritics.
export const textStyles = {
  display: {
    fontFamily: fontFamily.black,
    fontSize: 40,
    lineHeight: 52,
  } as TextStyle,
  h1: {
    fontFamily: fontFamily.extraBold,
    fontSize: 28,
    lineHeight: 38,
  } as TextStyle,
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 32,
  } as TextStyle,
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 26,
  } as TextStyle,
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  button: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    lineHeight: 24,
  } as TextStyle,
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  } as TextStyle,
  small: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
} as const;

// Applied globally so every <Text> defaults to right-aligned Arabic,
// unless a component explicitly overrides it (e.g. centered CTAs).
export const rtlText: TextStyle = {
  writingDirection: 'rtl',
  textAlign: 'right',
};
