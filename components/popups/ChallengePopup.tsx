import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PendingChallenge } from '@/store/gameStore';
import { useTimer } from '@/hooks/useTimer';
import { useMountTransition } from '@/hooks/useMountTransition';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';

interface ChallengePopupProps {
  challenge: PendingChallenge | null;
  participantName: string;
  onDismiss: () => void;
}

/** Physical challenges raised by the trackers behind rules 21 and 22. */
export function ChallengePopup({ challenge, participantName, onDismiss }: ChallengePopupProps) {
  const [started, setStarted] = React.useState(false);

  const { secondsLeft, isUrgent, reset } = useTimer({
    durationSec: challenge?.timerSec ?? 0,
    running: started && Boolean(challenge?.timerSec),
  });

  React.useEffect(() => {
    setStarted(false);
    reset();
  }, [challenge?.text, challenge?.participantId, reset]);

  // `challenge` itself is the visibility signal and goes null the instant
  // it's dismissed — keep the last non-null one around so the exit fade has
  // content to render while it plays instead of vanishing instantly.
  const [lastChallenge, setLastChallenge] = React.useState(challenge);
  React.useEffect(() => {
    if (challenge) setLastChallenge(challenge);
  }, [challenge]);

  const { rendered, progress } = useMountTransition(Boolean(challenge));
  if (!rendered || !lastChallenge) return null;
  const dialogScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]} />

      <Animated.View
        style={[styles.dialog, { opacity: progress, transform: [{ scale: dialogScale }] }]}
      >
        <Text style={styles.emoji}>💪</Text>
        <Text style={styles.title}>تحدي بدني!</Text>
        <Text style={styles.who}>{participantName}</Text>
        <Text style={styles.what}>{lastChallenge.text}</Text>

        {Boolean(lastChallenge.timerSec) && (
          <View style={styles.timerRow}>
            <Text style={[styles.timerDigits, isUrgent && { color: colors.danger }]}>
              {secondsLeft}
            </Text>
            {!started && (
              <Pressable onPress={() => setStarted(true)} style={styles.startButton}>
                <Ionicons name="play" size={13} color={colors.white} />
                <Text style={styles.startLabel}>ابدأ</Text>
              </Pressable>
            )}
          </View>
        )}

        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
        >
          <Text style={styles.doneLabel}>✅ تم</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    elevation: 50,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  dialog: {
    width: '58%',
    backgroundColor: colors.feltDarker,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.warning,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emoji: { fontSize: 40 },
  title: {
    fontFamily: fontFamily.black,
    fontSize: 20,
    color: colors.warning,
    writingDirection: 'rtl',
  },
  who: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  what: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  timerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  timerDigits: {
    fontFamily: fontFamily.black,
    fontSize: 32,
    color: colors.cream,
    fontVariant: ['tabular-nums'],
  },
  startButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.warning,
  },
  startLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.white,
    writingDirection: 'rtl',
  },
  doneButton: {
    minHeight: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  doneLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: '#042415',
    writingDirection: 'rtl',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
