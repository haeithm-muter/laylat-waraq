import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ModeCard } from '@/components/ui/ModeCard';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

export default function ModeSelectScreen() {
  const [localExpanded, setLocalExpanded] = useState(false);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.feltDark, colors.feltDarker]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <ScreenHeader title="اختر وضع اللعب" subtitle="كيف تبون تلعبون اليوم؟" />

        <View style={styles.content}>
          {!localExpanded ? (
            <View style={styles.row}>
              <ModeCard
                icon="🔗"
                title="سيرفر"
                subtitle="انضم لسيرفر موجود عن طريق كود أو QR"
                onPress={() => router.push('/(game)/join-server')}
              />
              <ModeCard
                icon="📶"
                title="محلي"
                subtitle="العبوا مع بعض على نفس الواي فاي"
                onPress={() => setLocalExpanded(true)}
              />
            </View>
          ) : (
            <View style={styles.expandedGroup}>
              <Pressable onPress={() => setLocalExpanded(false)} style={styles.collapseRow} hitSlop={8}>
                <Ionicons name="arrow-forward" size={16} color={colors.textOnDarkMuted} />
                <Text style={styles.collapseLabel}>رجوع لاختيار الوضع</Text>
              </Pressable>

              <View style={styles.row}>
                <ModeCard
                  icon="🖥️"
                  title="سيرفر لعب"
                  subtitle="أنشئ سيرفر وتحكم فيه كمضيف"
                  size="md"
                  onPress={() => router.push('/(game)/server-setup')}
                />
                <ModeCard
                  icon="👥"
                  title="مع الأصدقاء"
                  subtitle="لعبتين على نفس الجهاز"
                  size="md"
                  onPress={() => router.push('/(game)/friends-setup')}
                />
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.feltDark },
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row-reverse',
    gap: spacing.lg,
  },
  expandedGroup: {
    gap: spacing.md,
  },
  collapseRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
  },
  collapseLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
});
