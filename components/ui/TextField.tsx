import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string | null;
  isPassword?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function TextField({ label, error, isPassword, icon, ...inputProps }: TextFieldProps) {
  const [secure, setSecure] = useState(isPassword);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          Boolean(error) && styles.inputRowError,
        ]}
      >
        {icon && <Ionicons name={icon} size={18} color={colors.textOnLightMuted} style={styles.icon} />}
        <TextInput
          {...inputProps}
          secureTextEntry={secure}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          placeholderTextColor={colors.textOnLightMuted}
          style={styles.input}
          textAlign="right"
        />
        {isPassword && (
          <Pressable onPress={() => setSecure((v) => !v)} hitSlop={10}>
            <Ionicons
              name={secure ? 'eye-off' : 'eye'}
              size={18}
              color={colors.textOnLightMuted}
            />
          </Pressable>
        )}
      </View>
      {Boolean(error) && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textOnDark,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: spacing.md,
    minHeight: 46,
    gap: spacing.sm,
  },
  inputRowFocused: {
    borderColor: '#D4A657',
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  icon: {
    marginTop: 1,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.textOnLight,
    writingDirection: 'rtl',
    paddingVertical: spacing.sm,
  },
  error: {
    marginTop: 4,
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: '#FFB4AC',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});
