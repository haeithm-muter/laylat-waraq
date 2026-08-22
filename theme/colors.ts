/**
 * ليلة ورق — Color System
 *
 * Base palette = fixed app chrome (backgrounds, text, semantic states).
 * Card color themes = the 6 selectable accents from Settings → "ألوان الورق"
 * (cream / blue / pink / green / dark / gold). The selected theme's accent
 * tints buttons, active states, and (later) the gameplay cards.
 */

export type CardColorThemeId = 'cream' | 'blue' | 'pink' | 'green' | 'dark' | 'gold';

export interface CardColorTheme {
  id: CardColorThemeId;
  label: string;
  /** Primary accent — buttons, active states, highlights */
  accent: string;
  /** Darker accent for pressed states / gradients */
  accentDark: string;
  /** Soft tint of the accent, used for subtle backgrounds/badges */
  accentSoft: string;
  /** Text color that sits on top of `accent` */
  onAccent: string;
}

export const cardColorThemes: Record<CardColorThemeId, CardColorTheme> = {
  cream: {
    id: 'cream',
    label: 'كريمي',
    accent: '#C9A24B',
    accentDark: '#A6813A',
    accentSoft: '#F3E6C4',
    onAccent: '#2B2118',
  },
  blue: {
    id: 'blue',
    label: 'أزرق',
    accent: '#4C8DFF',
    accentDark: '#2E63C9',
    accentSoft: '#D9E6FF',
    onAccent: '#0A1B3D',
  },
  pink: {
    id: 'pink',
    label: 'وردي',
    accent: '#EC6FA0',
    accentDark: '#C94A80',
    accentSoft: '#FBDCE9',
    onAccent: '#3D0F22',
  },
  green: {
    id: 'green',
    label: 'أخضر',
    accent: '#2FA36B',
    accentDark: '#1E7A4D',
    accentSoft: '#D3F0E0',
    onAccent: '#042415',
  },
  dark: {
    id: 'dark',
    label: 'داكن',
    accent: '#9AA0A6',
    accentDark: '#6B7076',
    accentSoft: '#E4E5E7',
    onAccent: '#141414',
  },
  gold: {
    id: 'gold',
    label: 'ذهبي',
    accent: '#D4A657',
    accentDark: '#A87F3B',
    accentSoft: '#F6E7C8',
    onAccent: '#241B08',
  },
};

export const defaultCardColorTheme: CardColorThemeId = 'gold';

/** Fixed app-wide palette — the "card table felt" identity of ليلة ورق */
export const colors = {
  // Brand
  feltDark: '#0B3D2E',
  feltDarker: '#082B20',
  feltLight: '#146044',

  // Neutrals
  background: '#0B3D2E',
  surface: '#0F4A37',
  surfaceElevated: '#155943',
  cream: '#F7EFDD',
  card: '#FBF6EA',

  // Text
  textOnDark: '#FBF6EA',
  textOnDarkMuted: 'rgba(251, 246, 234, 0.7)',
  textOnLight: '#241B12',
  textOnLightMuted: 'rgba(36, 27, 18, 0.62)',

  // Semantic
  success: '#3FBE7A',
  danger: '#E5584D',
  warning: '#E3A93B',
  info: '#4C8DFF',

  // Rule card type colors (Section 6 of PRD — used from Day 4 onward)
  ruleRed: '#E5584D',
  ruleGreen: '#3FBE7A',
  ruleBlue: '#4C8DFF',

  // Utility
  overlay: 'rgba(8, 20, 16, 0.72)',
  border: 'rgba(251, 246, 234, 0.16)',
  white: '#FFFFFF',
  black: '#000000',
} as const;
