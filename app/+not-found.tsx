import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

export default function NotFoundScreen() {
  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.feltDark, colors.feltDarker]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.flex}>
        <View style={styles.body}>
          <Text style={styles.emoji}>🃏</Text>
          <Text style={styles.title}>الصفحة غير موجودة</Text>
          <PrimaryButton label="الرئيسية" onPress={() => router.replace('/(game)/home')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.feltDark },
  flex: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emoji: { fontSize: 48 },
  title: {
    fontFamily: fontFamily.black,
    fontSize: 20,
    color: colors.textOnDark,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
});
