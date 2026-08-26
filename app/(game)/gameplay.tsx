import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTopicById } from '@/content/topics';
import {
  useGameStore,
  selectActiveParticipant,
  remainingCounts,
  totalRemaining as sumRemaining,
} from '@/store/gameStore';
import { useServerStore } from '@/store/serverStore';
import { useTimer } from '@/hooks/useTimer';
import { TimerCard } from '@/components/cards/TimerCard';
import { QuestionCard } from '@/components/cards/QuestionCard';
import { RuleCard } from '@/components/cards/RuleCard';
import { AnswerRevealPopup } from '@/components/popups/AnswerRevealPopup';
import { RuleActionPopup } from '@/components/popups/RuleActionPopup';
import { ChallengePopup } from '@/components/popups/ChallengePopup';
import { ScorePanel } from '@/components/ui/ScorePanel';
import { CategoryGrid } from '@/components/ui/CategoryGrid';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { playSound } from '@/utils/sounds';

/** Rule 11 — seconds of silence before a rival may grab the question. */
const STEAL_UNLOCK_SEC = 10;

export default function GameplayScreen() {
  const mode = useGameStore((s) => s.mode);
  const phase = useGameStore((s) => s.phase);
  const participants = useGameStore((s) => s.participants);
  const activeCategoryIds = useGameStore((s) => s.activeCategoryIds);
  const currentQuestion = useGameStore((s) => s.currentQuestion);
  const currentCategoryId = useGameStore((s) => s.currentCategoryId);
  const didBet = useGameStore((s) => s.didBet);
  const bettingEnabled = useGameStore((s) => s.bettingEnabled);
  const questionTimeSec = useGameStore((s) => s.questionTimeSec);
  const questionNumber = useGameStore((s) => s.questionNumber);
  const canUndo = useGameStore((s) => s.undoStack.length > 0);
  const currentRule = useGameStore((s) => s.currentRule);
  const ruleNotice = useGameStore((s) => s.ruleNotice);
  const ruleResolution = useGameStore((s) => s.ruleResolution);
  const restrictAnswerTo = useGameStore((s) => s.restrictAnswerTo);
  const pendingChallenge = useGameStore((s) => s.pendingChallenge);
  const categoryChooserId = useGameStore((s) => s.categoryChooserId);
  const isTiebreaker = useGameStore((s) => s.isTiebreaker);

  const activeParticipant = useGameStore(selectActiveParticipant);
  // `decks` is a stable reference between mutations; the derived counts are
  // computed here rather than in a selector (see note in gameStore.ts).
  const decks = useGameStore((s) => s.decks);
  const remainingByCategory = useMemo(() => remainingCounts(decks), [decks]);
  const totalRemaining = useMemo(() => sumRemaining(decks), [decks]);

  const pickCategory = useGameStore((s) => s.pickCategory);
  const placeBet = useGameStore((s) => s.placeBet);
  const revealAnswer = useGameStore((s) => s.revealAnswer);
  const resolveCurrentRule = useGameStore((s) => s.resolveCurrentRule);
  const resolvePostAnswerRule = useGameStore((s) => s.resolvePostAnswerRule);
  const dismissChallenge = useGameStore((s) => s.dismissChallenge);
  const awardTo = useGameStore((s) => s.awardTo);
  const adjustScore = useGameStore((s) => s.adjustScore);
  const undoLast = useGameStore((s) => s.undoLast);
  const endGame = useGameStore((s) => s.endGame);
  const resetGame = useGameStore((s) => s.resetGame);

  const leaveServer = useServerStore((s) => s.leaveServer);

  const [timerPaused, setTimerPaused] = useState(false);
  const [rulePopupOpen, setRulePopupOpen] = useState(false);

  const handleExpire = useCallback(() => {
    playSound('alarm');
    revealAnswer();
  }, [revealAnswer]);

  const { secondsLeft, isUrgent, reset: resetTimer } = useTimer({
    durationSec: questionTimeSec,
    // The sudden-death question is deliberately untimed (PRD §4.13).
    running: phase === 'question' && !timerPaused && !isTiebreaker,
    onExpire: handleExpire,
  });

  // Each drawn question gets a fresh clock.
  useEffect(() => {
    resetTimer();
    setTimerPaused(false);
    setRulePopupOpen(false);
  }, [currentQuestion?.id, resetTimer]);

  // Countdown tick for the final 10s (PRD §4.9) — `secondsLeft` only
  // changes on whole-second boundaries (see useTimer), so this fires once
  // per second rather than every 250ms poll.
  useEffect(() => {
    if (phase === 'question' && isUrgent) playSound('tick');
  }, [secondsLeft, isUrgent, phase]);

  const handleAward = useCallback(
    (participantId: string | null, isPartial?: boolean) => {
      playSound(participantId ? 'correct' : 'wrong');
      awardTo(participantId, isPartial);
    },
    [awardTo]
  );

  // Landing here without a started game (deep link, reload) has nothing to
  // render — send the player back rather than showing an empty board.
  useEffect(() => {
    if (participants.length === 0) router.replace('/(game)/home');
  }, [participants.length]);

  // The podium, ranking and tie-breaker live on their own screen.
  useEffect(() => {
    if (phase === 'game_over') router.replace('/(game)/results');
  }, [phase]);

  if (participants.length === 0) return null;

  const activeCategories = activeCategoryIds
    .map((id) => getTopicById(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const currentCategory = currentCategoryId ? getTopicById(currentCategoryId) : undefined;
  const totalQuestions = questionNumber + totalRemaining;
  const isFriendsMode = mode === 'friends';
  const activeId = activeParticipant?.id ?? '';
  const ruleResolved = ruleResolution !== null || Boolean(ruleNotice && !currentRule);
  // Rule 11 unlocks the steal only after the silence window has elapsed.
  const secondsElapsed = questionTimeSec - secondsLeft;
  const showSteal =
    phase === 'question' &&
    currentRule?.id === 11 &&
    !restrictAnswerTo &&
    secondsElapsed >= STEAL_UNLOCK_SEC;
  const challengeName =
    participants.find((p) => p.id === pendingChallenge?.participantId)?.name ?? '';
  const chooserName = participants.find((p) => p.id === categoryChooserId)?.name ?? '';

  const exitToHome = () => {
    resetGame();
    leaveServer();
    router.replace('/(game)/home');
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.feltDark, colors.feltDarker]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <View style={styles.topBarSide}>
            <Pressable onPress={endGame} style={styles.topButton} hitSlop={6}>
              <Ionicons name="flag" size={14} color={colors.danger} />
              <Text style={[styles.topButtonLabel, { color: colors.danger }]}>إنهاء</Text>
            </Pressable>

            {!isFriendsMode && (
              <Pressable onPress={exitToHome} style={styles.topButton} hitSlop={6}>
                <Ionicons name="exit-outline" size={14} color={colors.textOnDarkMuted} />
                <Text style={styles.topButtonLabel}>خروج</Text>
              </Pressable>
            )}

            {canUndo && (
              <Pressable onPress={undoLast} style={styles.topButton} hitSlop={6}>
                <Ionicons name="arrow-undo" size={14} color="#D4A657" />
                <Text style={[styles.topButtonLabel, { color: '#D4A657' }]}>تراجع</Text>
              </Pressable>
            )}
          </View>

          {phase !== 'game_over' && (
            <Text style={styles.counter}>
              السؤال {Math.max(1, questionNumber)}/{totalQuestions}
            </Text>
          )}

          <View style={styles.topBarSide}>
            <ScorePanel
              participants={participants}
              activeParticipantId={activeParticipant?.id}
              onAdjust={adjustScore}
              showControls={phase === 'category_pick' || phase === 'game_over'}
            />
          </View>
        </View>

        {phase === 'category_pick' ? (
          <View style={styles.pickBody}>
            <View style={styles.turnBanner}>
              <Text style={styles.turnLabel}>الدور:</Text>
              <Text style={styles.turnName}>{activeParticipant?.name ?? '—'}</Text>
            </View>
            <Text style={styles.pickHint}>
              {categoryChooserId && categoryChooserId !== activeId
                ? `${chooserName} هو اللي يختار الفئة`
                : 'اختر فئة السؤال'}
            </Text>
            <CategoryGrid
              categories={activeCategories}
              remainingByCategory={remainingByCategory}
              onPick={pickCategory}
            />
          </View>
        ) : currentQuestion ? (
          isFriendsMode ? (
            /* PRD §4.12 — question takes the wider share, side rail stacks
               the timer and rule card. */
            <View style={styles.friendsBody}>
              <View style={styles.friendsQuestion}>
                <QuestionCard
                  question={currentQuestion}
                  category={currentCategory}
                  concealed={phase === 'betting'}
                  didBet={didBet}
                  onReveal={revealAnswer}
                  emphasis
                />
              </View>
              <View style={styles.friendsRail}>
                <TimerCard
                  secondsLeft={secondsLeft}
                  isUrgent={isUrgent}
                  running={phase === 'question' && !timerPaused}
                  onToggleRunning={() => setTimerPaused((v) => !v)}
                  showControl={phase === 'question'}
                  compact
                />
                <RuleCard
                  phase={phase === 'betting' ? 'betting' : 'question'}
                  rule={currentRule}
                  ruleNotice={ruleNotice}
                  ruleResolved={ruleResolved}
                  onOpenRule={() => setRulePopupOpen(true)}
                  showSteal={showSteal}
                  onSteal={() => setRulePopupOpen(true)}
                  didBet={didBet}
                  bettingEnabled={bettingEnabled}
                  onPlaceBet={placeBet}
                  compact
                />
              </View>
            </View>
          ) : (
            /* PRD §4.9 — timer | question | rule */
            <View style={styles.serverBody}>
              <View style={styles.sideColumn}>
                <TimerCard
                  secondsLeft={secondsLeft}
                  isUrgent={isUrgent}
                  running={phase === 'question' && !timerPaused}
                  onToggleRunning={() => setTimerPaused((v) => !v)}
                  showControl={phase === 'question'}
                />
              </View>
              <View style={styles.centerColumn}>
                <QuestionCard
                  question={currentQuestion}
                  category={currentCategory}
                  concealed={phase === 'betting'}
                  didBet={didBet}
                  onReveal={revealAnswer}
                />
              </View>
              <View style={styles.sideColumn}>
                <RuleCard
                  phase={phase === 'betting' ? 'betting' : 'question'}
                  rule={currentRule}
                  ruleNotice={ruleNotice}
                  ruleResolved={ruleResolved}
                  onOpenRule={() => setRulePopupOpen(true)}
                  showSteal={showSteal}
                  onSteal={() => setRulePopupOpen(true)}
                  didBet={didBet}
                  bettingEnabled={bettingEnabled}
                  onPlaceBet={placeBet}
                />
              </View>
            </View>
          )
        ) : null}
      </SafeAreaView>

      <AnswerRevealPopup
        visible={phase === 'reveal' && Boolean(currentQuestion)}
        answer={currentQuestion?.answer ?? ''}
        points={currentQuestion?.points ?? 0}
        didBet={didBet}
        participants={participants}
        restrictAnswerTo={restrictAnswerTo}
        allowPartial={currentRule?.id === 24}
        onAward={handleAward}
      />

      <RuleActionPopup
        visible={rulePopupOpen && phase !== 'rule_post'}
        rule={currentRule}
        participants={participants}
        activeParticipantId={activeId}
        onResolve={(outcome) => {
          resolveCurrentRule(outcome);
          setRulePopupOpen(false);
        }}
        onDismiss={() => setRulePopupOpen(false)}
      />

      <RuleActionPopup
        visible={phase === 'rule_post'}
        rule={currentRule}
        participants={participants}
        activeParticipantId={activeId}
        onResolve={resolvePostAnswerRule}
        onDismiss={() => resolvePostAnswerRule({ kind: 'not_done' })}
      />

      <ChallengePopup
        challenge={pendingChallenge}
        participantName={challengeName}
        onDismiss={dismissChallenge}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.feltDark },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  topBarSide: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  topButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  topButtonLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  counter: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },

  pickBody: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  turnBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  turnLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  turnName: {
    fontFamily: fontFamily.black,
    fontSize: 22,
    color: '#D4A657',
    writingDirection: 'rtl',
  },
  pickHint: {
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },

  serverBody: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  sideColumn: {
    flex: 1,
  },
  centerColumn: {
    flex: 1.7,
  },

  friendsBody: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  friendsQuestion: {
    flex: 1.35,
  },
  friendsRail: {
    flex: 1,
    gap: spacing.sm,
  },

  overBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  overTitle: {
    fontFamily: fontFamily.black,
    fontSize: 26,
    color: colors.textOnDark,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  standings: {
    width: '100%',
    maxWidth: 460,
    gap: spacing.xs,
  },
  standingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  standingWinner: {
    backgroundColor: 'rgba(212,166,87,0.16)',
    borderWidth: 1,
    borderColor: '#D4A657',
  },
  standingRank: {
    fontFamily: fontFamily.extraBold,
    fontSize: 14,
    color: '#D4A657',
    width: 20,
    textAlign: 'center',
  },
  standingName: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.textOnDark,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  standingScore: {
    fontFamily: fontFamily.extraBold,
    fontSize: 17,
    color: colors.textOnDark,
    fontVariant: ['tabular-nums'],
  },
  overNote: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: 'rgba(251, 246, 234, 0.4)',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  overActions: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
