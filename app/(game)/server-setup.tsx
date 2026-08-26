import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import { useActiveCardTheme } from '@/hooks/useActiveCardTheme';
import { useAuthStore } from '@/store/authStore';
import { useServerStore } from '@/store/serverStore';
import { generateAccessCode } from '@/lib/localServer/codeGenerator';
import { RulesMode } from '@/lib/localServer/protocol';

/** The rest of the game settings now live in the lobby, adjustable by the
 * host after the server is up — these are just the starting values. */
const DEFAULT_MAX_PLAYERS = 5;
const DEFAULT_QUESTION_TIME_SEC = 40;
const DEFAULT_RULES_MODE: RulesMode = 'random';
const DEFAULT_RULES_MANDATORY = true;

export default function ServerSetupScreen() {
  const theme = useActiveCardTheme();
  const user = useAuthStore((s) => s.user);
  const status = useServerStore((s) => s.status);
  const error = useServerStore((s) => s.error);
  const createServer = useServerStore((s) => s.createServer);
  const clearError = useServerStore((s) => s.clearError);

  const [serverName, setServerName] = useState('ليلة ورق');
  const [code, setCode] = useState(generateAccessCode);

  useEffect(() => {
    if (status === 'lobby') {
      router.push('/(game)/lobby');
    }
  }, [status]);

  const hostName = user?.displayName || user?.email?.split('@')[0] || 'المضيف';
  const canSubmit = code.length === 4;

  const onSubmit = () => {
    if (!canSubmit) return;
    clearError();
    createServer(
      {
        serverName: serverName.trim() || 'ليلة ورق',
        code,
        maxPlayers: DEFAULT_MAX_PLAYERS,
        questionTimeSec: DEFAULT_QUESTION_TIME_SEC,
        rulesMode: DEFAULT_RULES_MODE,
        rulesMandatory: DEFAULT_RULES_MANDATORY,
      },
      hostName
    );
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.feltDark, colors.feltDarker]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <ScreenHeader title="إعداد السيرفر" subtitle="اسم السيرفر ورمز الدخول — والباقي يُضبط داخل غرفة الانتظار" />

        <View style={styles.content}>
          <TextField
            label="اسم السيرفر"
            value={serverName}
            onChangeText={setServerName}
            placeholder="ليلة ورق"
          />

          <View style={styles.codeCard}>
            <View style={styles.codeRow}>
              <Pressable
                onPress={() => setCode(generateAccessCode())}
                style={[styles.regenButton, { borderColor: theme.accent }]}
                hitSlop={8}
                accessibilityLabel="ولّد رمزاً جديداً"
              >
                <Ionicons name="refresh" size={18} color={theme.accent} />
              </Pressable>
              <View style={styles.codeInput}>
                <TextField
                  label="رمز الدخول"
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="0000"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>
            <Text style={styles.codeHint}>يتولّد تلقائياً، وتقدر تغيّره لأي 4 أرقام تحبها</Text>
          </View>

          {Boolean(error) && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton
            label="إنشاء السيرفر"
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={status === 'connecting'}
            fullWidth
            style={styles.submitButton}
          />
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
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: 'center',
  },
  codeCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  regenButton: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeInput: {
    flex: 1,
  },
  codeHint: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  error: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: '#FFB4AC',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  submitButton: {
    marginTop: spacing.xs,
  },
});
