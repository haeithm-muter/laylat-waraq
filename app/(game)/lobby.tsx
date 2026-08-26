import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Switch, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PlayerListItem } from '@/components/ui/PlayerListItem';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';
import { Stepper } from '@/components/ui/Stepper';
import { SliderField } from '@/components/ui/SliderField';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { useActiveCardTheme } from '@/hooks/useActiveCardTheme';
import { useServerStore } from '@/store/serverStore';
import { QrJoinPayload, RulesMode } from '@/lib/localServer/protocol';

const RULES_MODE_OPTIONS: { value: RulesMode; label: string }[] = [
  { value: 'random', label: 'عشوائي' },
  { value: 'manual', label: 'يدوي' },
  { value: 'off', label: 'إيقاف' },
];

export default function LobbyScreen() {
  const theme = useActiveCardTheme();
  const isHost = useServerStore((s) => s.isHost);
  const serverName = useServerStore((s) => s.serverName);
  const code = useServerStore((s) => s.code);
  const ip = useServerStore((s) => s.ip);
  const port = useServerStore((s) => s.port);
  const players = useServerStore((s) => s.players);
  const maxPlayers = useServerStore((s) => s.maxPlayers);
  const questionTimeSec = useServerStore((s) => s.questionTimeSec);
  const rulesMode = useServerStore((s) => s.rulesMode);
  const rulesMandatory = useServerStore((s) => s.rulesMandatory);
  const status = useServerStore((s) => s.status);
  const error = useServerStore((s) => s.error);
  const myPlayerId = useServerStore((s) => s.myPlayerId);
  const goToCategorySelect = useServerStore((s) => s.goToCategorySelect);
  const updateGameSettings = useServerStore((s) => s.updateGameSettings);
  const leaveServer = useServerStore((s) => s.leaveServer);

  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  // Safety net for hardware/gesture back — the header's own back button
  // already calls leaveServer() explicitly; this just ensures we don't
  // leave a TCP server or connection dangling if the screen unmounts any
  // other way. leaveServer() is idempotent (no-op if already cleaned up).
  useEffect(() => () => leaveServer(), [leaveServer]);

  useEffect(() => {
    if (isHost && status === 'category_select') {
      router.push('/(game)/category-select');
    }
  }, [isHost, status]);

  const onBack = () => {
    leaveServer();
    router.back();
  };

  const onCopyCode = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const qrPayload: QrJoinPayload = { app: 'laylatwaraq', code, ip, port };
  const canStart = isHost && players.length >= 2;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.feltDark, colors.feltDarker]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <ScreenHeader title={serverName || 'السيرفر'} subtitle="غرفة الانتظار" onBack={onBack} />

        <View style={styles.body}>
          <View style={styles.playersColumn}>
            <View style={styles.playersHeader}>
              <Text style={styles.playersCount}>
                {players.length}/{maxPlayers}
              </Text>
              <Text style={styles.playersLabel}>اللاعبون</Text>
            </View>

            <FlatList
              data={players}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => <PlayerListItem player={item} isMe={item.id === myPlayerId} />}
              contentContainerStyle={styles.playersList}
              showsVerticalScrollIndicator={false}
            />

            {isHost ? (
              <>
                {Boolean(error) && <Text style={styles.error}>{error}</Text>}
                <PrimaryButton
                  label="ابدأ اللعبة ▶️"
                  onPress={goToCategorySelect}
                  disabled={!canStart}
                  fullWidth
                />
                {!canStart && <Text style={styles.hint}>محتاجين لاعبين اثنين على الأقل</Text>}
              </>
            ) : status === 'error' ? (
              <>
                <Text style={styles.error}>{error}</Text>
                <PrimaryButton label="رجوع" onPress={onBack} variant="outline" fullWidth />
              </>
            ) : (
              <View style={styles.waitingRow}>
                <Ionicons name="hourglass-outline" size={16} color={colors.textOnDarkMuted} />
                <Text style={styles.waitingText}>
                  {status === 'category_select'
                    ? 'المضيف يختار الفئات الآن...'
                    : 'بانتظار المضيف لبدء اللعبة...'}
                </Text>
              </View>
            )}
          </View>

          {isHost && (
            <View style={styles.inviteColumn}>
              <ScrollView
                contentContainerStyle={styles.inviteColumnContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.inviteTitle}>ادعُ أصدقاءك</Text>

                <Pressable onPress={onCopyCode} style={styles.codeCard}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color="#D4A657" />
                  <Text style={styles.codeText}>{code}</Text>
                </Pressable>

                {showQr ? (
                  <QRCodeDisplay value={JSON.stringify(qrPayload)} size={120} />
                ) : (
                  <Pressable onPress={() => setShowQr(true)} style={styles.qrToggle}>
                    <Ionicons name="qr-code-outline" size={16} color={colors.textOnDarkMuted} />
                    <Text style={styles.qrToggleText}>عرض رمز QR</Text>
                  </Pressable>
                )}

                <View style={styles.settingsDivider} />
                <Text style={styles.inviteTitle}>إعدادات اللعبة</Text>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>عدد اللاعبين</Text>
                  <Stepper
                    value={maxPlayers}
                    min={2}
                    max={20}
                    onChange={(v) => updateGameSettings({ maxPlayers: v })}
                  />
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>وقت السؤال</Text>
                  <SliderField
                    value={questionTimeSec}
                    min={10}
                    max={120}
                    step={5}
                    unit=" ث"
                    onChange={(v) => updateGameSettings({ questionTimeSec: v })}
                  />
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>نمط القوانين</Text>
                  <ToggleGroup
                    options={RULES_MODE_OPTIONS}
                    value={rulesMode}
                    onChange={(v) => updateGameSettings({ rulesMode: v })}
                  />
                </View>

                <View style={[styles.settingRow, styles.switchRow]}>
                  <Switch
                    value={rulesMandatory}
                    onValueChange={(v) => updateGameSettings({ rulesMandatory: v })}
                    trackColor={{ true: theme.accent, false: 'rgba(255,255,255,0.2)' }}
                    thumbColor={colors.cream}
                  />
                  <Text style={styles.settingLabel}>القوانين إجبارية</Text>
                </View>
              </ScrollView>
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
  body: {
    flex: 1,
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  playersColumn: {
    flex: 2,
    gap: spacing.sm,
  },
  playersHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  playersCount: {
    fontFamily: fontFamily.extraBold,
    fontSize: 18,
    color: '#D4A657',
  },
  playersLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  playersList: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  waitingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  waitingText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  hint: {
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  error: {
    textAlign: 'center',
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: '#FFB4AC',
    writingDirection: 'rtl',
  },
  inviteColumn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteColumnContent: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  inviteTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  settingsDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  settingRow: {
    width: '100%',
    gap: spacing.xs,
  },
  settingLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textOnDark,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  codeCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(212,166,87,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,166,87,0.4)',
  },
  codeText: {
    fontFamily: fontFamily.extraBold,
    fontSize: 20,
    letterSpacing: 4,
    color: '#D4A657',
  },
  qrToggle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  qrToggleText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
});
