import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Participant } from '@/store/gameStore';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { useMountTransition } from '@/hooks/useMountTransition';

interface AnswerRevealPopupProps {
  visible: boolean;
  answer: string;
  points: number;
  didBet: boolean;
  participants: Participant[];
  /** When set (rules 5 and 11), only this participant may be credited. */
  restrictAnswerTo: string | null;
  /** Rule 24 adds a half-credit option alongside the normal award. */
  allowPartial: boolean;
  onAward: (participantId: string | null, isPartial?: boolean) => void;
}

export function AnswerRevealPopup(props: AnswerRevealPopupProps) {
  const { visible, onAward } = props;

  // The caller often changes the answer/points/participants in the same
  // action that flips `visible` false — freeze the content props while
  // visible so the exit fade shows the outgoing answer, not stale/blank
  // content mid-transition.
  const [frozen, setFrozen] = React.useState(props);
  React.useEffect(() => {
    if (visible) setFrozen(props);
  }, [
    visible,
    props.answer,
    props.points,
    props.didBet,
    props.participants,
    props.restrictAnswerTo,
    props.allowPartial,
  ]);

  const { rendered, progress } = useMountTransition(visible);
  if (!rendered) return null;

  const { answer, points, didBet, participants, restrictAnswerTo, allowPartial } = frozen;
  const awarded = didBet ? points * 2 : points;
  const penalty = didBet ? points : 0;
  const eligible = restrictAnswerTo
    ? participants.filter((p) => p.id === restrictAnswerTo)
    : participants;
  const dialogScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    // Rendered as a sibling overlay rather than <Modal>, matching
    // SettingsPanel — react-native-web's Modal portal breaks absolutely
    // positioned children.
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]} />

      <Animated.View
        style={[styles.dialog, { opacity: progress, transform: [{ scale: dialogScale }] }]}
      >
        <Text style={styles.eyebrow}>الإجابة الصحيحة هي</Text>

        <ScrollView
          contentContainerStyle={styles.answerScroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.answerText}>{answer}</Text>
        </ScrollView>

        <View style={styles.divider} />

        <Text style={styles.prompt}>من جاوب؟</Text>
        {Boolean(restrictAnswerTo) && (
          <Text style={styles.restrictionNote}>القانون يحصر الإجابة على لاعب واحد</Text>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.choicesRow}
        >
          {eligible.map((participant) => (
            <Pressable
              key={participant.id}
              onPress={() => onAward(participant.id)}
              style={({ pressed }) => [styles.playerChoice, pressed && styles.pressed]}
            >
              <Avatar name={participant.name} size={34} />
              <Text style={styles.playerName} numberOfLines={1}>
                {participant.name}
              </Text>
              <Text style={styles.playerGain}>+{awarded}</Text>
            </Pressable>
          ))}

          {allowPartial &&
            eligible.map((participant) => (
              <Pressable
                key={`partial_${participant.id}`}
                onPress={() => onAward(participant.id, true)}
                style={({ pressed }) => [styles.partialChoice, pressed && styles.pressed]}
              >
                <Ionicons name="contrast" size={26} color={colors.warning} />
                <Text style={styles.partialName} numberOfLines={1}>
                  {participant.name}
                </Text>
                <Text style={styles.partialLabel}>جزئي +{Math.round(points / 2)}</Text>
              </Pressable>
            ))}

          <Pressable
            onPress={() => onAward(null)}
            style={({ pressed }) => [styles.noneChoice, pressed && styles.pressed]}
          >
            <Ionicons name="close-circle" size={30} color={colors.danger} />
            <Text style={styles.noneLabel}>لا أحد</Text>
            <Text style={styles.nonePenalty}>{penalty > 0 ? `−${penalty}` : '٠'}</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 30,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  dialog: {
    width: '78%',
    maxHeight: '92%',
    backgroundColor: colors.feltDarker,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: '#D4A657',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  eyebrow: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  answerScroll: {
    paddingVertical: spacing.xs,
  },
  answerText: {
    fontFamily: fontFamily.black,
    fontSize: 28,
    lineHeight: 42,
    color: '#D4A657',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  prompt: {
    fontFamily: fontFamily.extraBold,
    fontSize: 17,
    color: colors.textOnDark,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  choicesRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  playerChoice: {
    minWidth: 92,
    alignItems: 'center',
    gap: 3,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerName: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  playerGain: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.success,
  },
  restrictionNote: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.warning,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  partialChoice: {
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(227, 169, 59, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(227, 169, 59, 0.45)',
  },
  partialName: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  partialLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.warning,
    writingDirection: 'rtl',
  },
  noneChoice: {
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(229, 88, 77, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(229, 88, 77, 0.45)',
  },
  noneLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.danger,
    writingDirection: 'rtl',
  },
  nonePenalty: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
