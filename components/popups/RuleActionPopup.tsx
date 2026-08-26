import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RuleDefinition,
  RULE_TONE_COLORS,
  RULE_TYPE_ICONS,
} from '@/content/rules';
import { RuleOutcome } from '@/utils/ruleEngine';
import { Participant } from '@/store/gameStore';
import { useTimer } from '@/hooks/useTimer';
import { useMountTransition } from '@/hooks/useMountTransition';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';

interface RuleActionPopupProps {
  visible: boolean;
  rule: RuleDefinition | null;
  participants: Participant[];
  activeParticipantId: string;
  onResolve: (outcome: RuleOutcome) => void;
  onDismiss: () => void;
}

/** Which roster, if any, the host has to pick from to settle this rule. */
function selectionMode(rule: RuleDefinition): 'none' | 'opponents' | 'all' {
  if (rule.id === 1) return 'opponents'; // who took the slap
  if (rule.id === 11) return 'opponents'; // who grabbed the question
  if (rule.id === 5) return 'all'; // nominated answerer
  if (rule.id === 18) return 'all'; // who sits out
  if (rule.id === 25) return 'all'; // who broke the rule
  if (rule.type === 'duel') return 'all'; // who won
  return 'none';
}

function selectionLabel(rule: RuleDefinition): string {
  if (rule.id === 1) return 'مين استلم الضربة؟';
  if (rule.id === 11) return 'مين خطف السؤال؟';
  if (rule.id === 5) return 'مين بيجاوب؟';
  if (rule.id === 18) return 'مين اللي يضحّي بدوره؟';
  if (rule.id === 25) return 'مين كسر القانون؟';
  if (rule.type === 'duel') return 'مين فاز؟';
  return '';
}

export function RuleActionPopup({
  visible,
  rule: ruleProp,
  participants: participantsProp,
  activeParticipantId: activeParticipantIdProp,
  onResolve,
  onDismiss,
}: RuleActionPopupProps) {
  const [challengeStarted, setChallengeStarted] = React.useState(false);

  const { secondsLeft, isUrgent, reset } = useTimer({
    durationSec: ruleProp?.timerSec ?? 0,
    running: challengeStarted && Boolean(ruleProp?.timerSec),
  });

  React.useEffect(() => {
    setChallengeStarted(false);
    reset();
  }, [ruleProp?.id, reset]);

  // `rule`/`participants` can change or clear the instant `visible` flips
  // false (the caller often updates state in the same action that closes
  // the popup) — keep the last non-null snapshot so the exit fade shows
  // the outgoing rule instead of blank/mismatched content.
  const [lastProps, setLastProps] = React.useState({
    rule: ruleProp,
    participants: participantsProp,
    activeParticipantId: activeParticipantIdProp,
  });
  React.useEffect(() => {
    if (ruleProp) {
      setLastProps({
        rule: ruleProp,
        participants: participantsProp,
        activeParticipantId: activeParticipantIdProp,
      });
    }
  }, [ruleProp, participantsProp, activeParticipantIdProp]);

  const { rendered, progress } = useMountTransition(visible);
  if (!rendered || !lastProps.rule) return null;

  const rule = lastProps.rule;
  const tone = RULE_TONE_COLORS[rule.tone];
  const mode = selectionMode(rule);
  const roster =
    mode === 'opponents'
      ? lastProps.participants.filter((p) => p.id !== lastProps.activeParticipantId)
      : lastProps.participants;
  const hasTimer = Boolean(rule.timerSec);
  const dialogScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]} />

      <Animated.View
        style={[
          styles.dialog,
          { borderColor: tone, opacity: progress, transform: [{ scale: dialogScale }] },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: tone }]}>
            <Text style={styles.typeIcon}>{RULE_TYPE_ICONS[rule.type]}</Text>
          </View>
          <Text style={styles.headerTitle}>قانون رقم {rule.id}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.textScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.ruleText}>{rule.text}</Text>
        </ScrollView>

        {hasTimer && (
          <View style={styles.timerRow}>
            <Text style={[styles.timerDigits, isUrgent && { color: colors.danger }]}>
              {secondsLeft}
            </Text>
            <Text style={styles.timerUnit}>ثانية</Text>
            {!challengeStarted && (
              <Pressable
                onPress={() => setChallengeStarted(true)}
                style={[styles.startButton, { backgroundColor: tone }]}
              >
                <Ionicons name="play" size={13} color={colors.white} />
                <Text style={styles.startLabel}>ابدأ</Text>
              </Pressable>
            )}
          </View>
        )}

        {mode !== 'none' && (
          <>
            <Text style={styles.selectionPrompt}>{selectionLabel(rule)}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rosterRow}
            >
              {roster.map((participant) => (
                <Pressable
                  key={participant.id}
                  onPress={() => onResolve({ kind: 'select', participantId: participant.id })}
                  style={({ pressed }) => [
                    styles.rosterChip,
                    { borderColor: tone },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.rosterName} numberOfLines={1}>
                    {participant.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.actionsRow}>
          {rule.type === 'physical' ? (
            <>
              <Pressable
                onPress={() => onResolve({ kind: 'done' })}
                style={({ pressed }) => [styles.action, styles.actionYes, pressed && styles.pressed]}
              >
                <Text style={styles.actionYesLabel}>✅ فعلت</Text>
              </Pressable>
              <Pressable
                onPress={() => onResolve({ kind: 'not_done' })}
                style={({ pressed }) => [styles.action, styles.actionNo, pressed && styles.pressed]}
              >
                <Text style={styles.actionNoLabel}>❌ لم أفعل</Text>
              </Pressable>
            </>
          ) : rule.type === 'hand_slap' ? (
            <Pressable
              onPress={() => onResolve({ kind: 'not_done' })}
              style={({ pressed }) => [styles.action, styles.actionNo, pressed && styles.pressed]}
            >
              <Text style={styles.actionNoLabel}>❌ لم يتم</Text>
            </Pressable>
          ) : mode === 'none' ? (
            <Pressable
              onPress={() => onResolve({ kind: 'done' })}
              style={({ pressed }) => [styles.action, styles.actionYes, pressed && styles.pressed]}
            >
              <Text style={styles.actionYesLabel}>✅ تم</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={onDismiss} style={styles.skipButton} hitSlop={8}>
            <Text style={styles.skipLabel}>تخطّي</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    elevation: 40,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  dialog: {
    width: '74%',
    maxHeight: '92%',
    backgroundColor: colors.feltDarker,
    borderRadius: radius.xl,
    borderWidth: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: {
    fontSize: 15,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  textScroll: {
    paddingVertical: spacing.xs,
  },
  ruleText: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 28,
    color: colors.textOnDark,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  timerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  timerDigits: {
    fontFamily: fontFamily.black,
    fontSize: 34,
    color: colors.cream,
    fontVariant: ['tabular-nums'],
  },
  timerUnit: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  startButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  startLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.white,
    writingDirection: 'rtl',
  },
  selectionPrompt: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
  },
  rosterRow: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  rosterChip: {
    minWidth: 80,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  rosterName: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  action: {
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionYes: {
    backgroundColor: colors.success,
  },
  actionNo: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  actionYesLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: '#042415',
    writingDirection: 'rtl',
  },
  actionNoLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: 'rgba(251, 246, 234, 0.45)',
    writingDirection: 'rtl',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
