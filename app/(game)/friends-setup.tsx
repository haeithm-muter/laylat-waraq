import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { useServerStore } from '@/store/serverStore';

export default function FriendsSetupScreen() {
  const setFriendNames = useServerStore((s) => s.setFriendNames);
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');

  const canStart = player1.trim().length > 0 && player2.trim().length > 0;

  const onStart = () => {
    setFriendNames(player1.trim(), player2.trim());
    router.push('/(game)/category-select');
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.feltDark, colors.feltDarker]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <ScreenHeader title="مع الأصدقاء" subtitle="لعبتين على نفس الجهاز" />

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>👤 اللاعب الأول</Text>
              <TextField
                label="الاسم"
                value={player1}
                onChangeText={setPlayer1}
                placeholder="مثال: سلطان"
                autoCorrect={false}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>👤 اللاعب الثاني</Text>
              <TextField
                label="الاسم"
                value={player2}
                onChangeText={setPlayer2}
                placeholder="مثال: نورة"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <PrimaryButton label="التالي ▶️" onPress={onStart} disabled={!canStart} fullWidth />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.feltDark },
  flex: { flex: 1 },
  content: {
    flex: 1,
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.textOnDark,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
});
