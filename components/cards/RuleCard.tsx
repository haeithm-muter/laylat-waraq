import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RuleDefinition, RULE_TONE_COLORS, RULE_TYPE_ICONS } from '@/content/rules';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';

interface RuleCardProps {
  /** 'betting' shows the wager buttons; other phases show the drawn rule. */
  phase: 'betting' | 'question' | 'reveal';
  rule: RuleDefinition | null;
  ruleNotice: string | null;
  ruleResolved: boolean;
  onOpenRule: () => void;
  /** Rule 11 — surfaced once the silence window has passed. */
  showSteal: boolean;
  onSteal: () => void;
  didBet: boolean;
  bettingEnabled: boolean;
  onPlaceBet: (didBet: boolean) => void;
  compact?: boolean;
}

/**
 * PRD §4.9 puts both the betting controls and the drawn twist card here.
 * The wager is settled first (question still hidden), then the card shows
 * the rule and whatever action it needs from the host.
 */
export function RuleCard({
  phase,
  rule,
  ruleNotice,
  ruleResolved,
  onOpenRule,
  showSteal,
  onSteal,
  didBet,
  bettingEnabled,
  onPlaceBet,
  compact = false,
}: RuleCardProps) {
  const tone = rule ? RULE_TONE_COLORS[rule.tone] : colors.border;
  const isBetting = phase === 'betting' && bettingEnabled;

  return (
    <View style={[styles.card, compact && styles.cardCompact, rule && { borderColor: tone }]}>
      <View style={styles.headerRow}>
        {rule ? (
          <View style={[styles.toneDot, { backgroundColor: tone }]} />
        ) : (
          <Ionicons name="albums-outline" size={compact ? 14 : 18} color={colors.textOnDarkMuted} />
        )}
        <Text style={styles.headerLabel}>
          {rule ? `قانون ${rule.id} ${RULE_TYPE_ICONS[rule.type]}` : 'بطاقة القانون'}
        </Text>
      </View>

      {isBetting ? (
        <View style={styles.bettingBody}>
          <Text style={[styles.bettingPrompt, compact && styles.bettingPromptCompact]}>
            راهن بضعف النقاط قبل ما تشوف السؤال
          </Text>

          <Pressable
            onPress={() => onPlaceBet(true)}
            style={({ pressed }) => [styles.betButton, styles.betYes, pressed && styles.pressed]}
          >
            <Text style={styles.betYesLabel}>راهن (×2)</Text>
          </Pressable>

          <Pressable
            onPress={() => onPlaceBet(false)}
            style={({ pressed }) => [styles.betButton, styles.betNo, pressed && styles.pressed]}
          >
            <Text style={styles.betNoLabel}>لا تراهن</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.ruleBody}>
          {didBet && (
            <View style={styles.betActiveChip}>
              <Ionicons name="flame" size={12} color={colors.success} />
              <Text style={styles.betActiveText}>الرهان ×2</Text>
            </View>
          )}

          {rule ? (
            <>
              <ScrollView
                contentContainerStyle={styles.ruleTextScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.ruleText, compact && styles.ruleTextCompact]}>{rule.text}</Text>
              </ScrollView>

              {showSteal && (
                <Pressable
                  onPress={onSteal}
                  style={({ pressed }) => [styles.stealButton, pressed && styles.pressed]}
                >
                  <Text style={styles.stealLabel}>⚡ خطف السؤال</Text>
                </Pressable>
              )}

              {ruleResolved ? (
                <View style={styles.noticeChip}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={styles.noticeText} numberOfLines={2}>
                    {ruleNotice ?? 'تم'}
                  </Text>
                </View>
              ) : (
                rule.type !== 'auto' &&
                rule.timing !== 'passive' &&
                rule.timing !== 'in_question' && (
                  <Pressable
                    onPress={onOpenRule}
                    style={({ pressed }) => [
                      styles.executeButton,
                      { backgroundColor: tone },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.executeLabel}>تنفيذ القانون</Text>
                  </Pressable>
                )
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>بدون قانون هذي الجولة</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(8, 20, 16, 0.5)',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardCompact: {
    padding: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  toneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  bettingBody: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  bettingPrompt: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textOnDark,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  bettingPromptCompact: {
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 0,
  },
  betButton: {
    minHeight: 46,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  betYes: {
    backgroundColor: colors.success,
  },
  betNo: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  betYesLabel: {
    fontFamily: fontFamily.black,
    fontSize: 17,
    color: '#042415',
    writingDirection: 'rtl',
  },
  betNoLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  ruleBody: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  ruleTextScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  ruleText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 21,
    color: colors.textOnDark,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  ruleTextCompact: {
    fontSize: 11,
    lineHeight: 18,
  },
  executeButton: {
    minHeight: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  executeLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.white,
    writingDirection: 'rtl',
  },
  stealButton: {
    minHeight: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
  },
  stealLabel: {
    fontFamily: fontFamily.black,
    fontSize: 14,
    color: '#241B08',
    writingDirection: 'rtl',
  },
  noticeChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(63,190,122,0.14)',
  },
  noticeText: {
    flexShrink: 1,
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.success,
    writingDirection: 'rtl',
  },
  betActiveChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(63,190,122,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(63,190,122,0.45)',
  },
  betActiveText: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.success,
    writingDirection: 'rtl',
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: 'rgba(251, 246, 234, 0.38)',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
