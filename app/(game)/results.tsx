import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore, Participant } from '@/store/gameStore';
import { useServerStore } from '@/store/serverStore';
import { intelligenceScore } from '@/utils/scoreCalculator';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Confetti } from '@/components/ui/Confetti';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { playSound } from '@/utils/sounds';

/** Podium column heights, indexed by finishing position. */
const PODIUM_HEIGHTS = [96, 70, 52];
const PODIUM_COLORS = ['#D4A657', '#C0C6CC', '#B87333'];
const PODIUM_MEDALS = ['🥇', '🥈', '🥉'];
/** 1st, 2nd, 3rd rendered as 2nd–1st–3rd so the winner stands in the middle. */
const PODIUM_ORDER = [1, 0, 2];

export default function ResultsScreen() {
  const participants = useGameStore((s) => s.participants);
  const phase = useGameStore((s) => s.phase);
  const startTiebreaker = useGameStore((s) => s.startTiebreaker);
  const recycleQuestions = useGameStore((s) => s.recycleQuestions);
  const decks = useGameStore((s) => s.decks);
  const resetGame = useGameStore((s) => s.resetGame);
  const leaveServer = useServerStore((s) => s.leaveServer);

  const ranked = useMemo(
    () => [...participants].sort((a, b) => b.score - a.score),
    [participants]
  );

  // A sudden-death question or a deck refill sends us back to the board.
  useEffect(() => {
    if (phase === 'question' || phase === 'category_pick') {
      router.replace('/(game)/gameplay');
    }
  }, [phase]);

  useEffect(() => {
    if (participants.length === 0) router.replace('/(game)/home');
  }, [participants.length]);

  // Fires once when the results board is actually shown.
  useEffect(() => {
    playSound('win');
  }, []);

  if (participants.length === 0) return null;

  const isTied = ranked.length >= 2 && ranked[0].score === ranked[1].score;
  const questionsExhausted = Object.values(decks).every((deck) => deck.length === 0);
  const podium = PODIUM_ORDER.map((index) => ranked[index]).filter(Boolean);

  const onPlayAgain = () => {
    resetGame();
    router.replace('/(game)/home');
  };

  const onExit = () => {
    resetGame();
    leaveServer();
    router.replace('/(game)/home');
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.feltDark, colors.feltDarker]} style={StyleSheet.absoluteFill} />
      <Confetti />

      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <Text style={styles.title}>🎉 انتهت اللعبة</Text>

        <View style={styles.body}>
          <View style={styles.podiumColumn}>
            <View style={styles.podium}>
              {podium.map((participant) => {
                const place = ranked.indexOf(participant);
                return (
                  <View key={participant.id} style={styles.podiumSlot}>
                    <Text style={styles.medal}>{PODIUM_MEDALS[place]}</Text>
                    <Avatar name={participant.name} size={34} />
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {participant.name}
                    </Text>
                    <Text style={styles.podiumScore}>{participant.score}</Text>
                    <View
                      style={[
                        styles.podiumBlock,
                        { height: PODIUM_HEIGHTS[place], backgroundColor: PODIUM_COLORS[place] },
                      ]}
                    >
                      <Text style={styles.podiumPlace}>{place + 1}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {isTied && (
              <View style={styles.tieGroup}>
                <Text style={styles.tieNote}>فيه تعادل على المركز الأول!</Text>
                <PrimaryButton label="سؤال فاصل ⚡" onPress={startTiebreaker} />
              </View>
            )}
          </View>

          <View style={styles.tableColumn}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.cellRank]}>#</Text>
              <Text style={[styles.headerCell, styles.cellName]}>اللاعب</Text>
              <Text style={[styles.headerCell, styles.cellScore]}>النقاط</Text>
              <Text style={[styles.headerCell, styles.cellIq]}>الذكاء</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tableBody}>
              {ranked.map((participant, index) => (
                <RankRow key={participant.id} participant={participant} place={index} />
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.actions}>
          {questionsExhausted && (
            <PrimaryButton label="إعادة الأسئلة" onPress={recycleQuestions} variant="outline" />
          )}
          <PrimaryButton label="العب مجدداً" onPress={onPlayAgain} />
          <PrimaryButton label="القائمة الرئيسية" onPress={onExit} variant="outline" />
        </View>
      </SafeAreaView>
    </View>
  );
}

function RankRow({ participant, place }: { participant: Participant; place: number }) {
  const iq = intelligenceScore(participant.correctCount, participant.attemptedCount);
  return (
    <View style={[styles.row, place === 0 && styles.rowWinner]}>
      <Text style={[styles.cell, styles.cellRank]}>{place + 1}</Text>
      <Text style={[styles.cell, styles.cellName]} numberOfLines={1}>
        {participant.name}
      </Text>
      <Text style={[styles.cell, styles.cellScore]}>{participant.score}</Text>
      <Text style={[styles.cell, styles.cellIq]}>{iq}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.feltDark },
  flex: { flex: 1 },
  title: {
    fontFamily: fontFamily.black,
    fontSize: 24,
    color: colors.textOnDark,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
  },
  body: {
    flex: 1,
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  podiumColumn: {
    flex: 1.1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  podium: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  podiumSlot: {
    alignItems: 'center',
    gap: 2,
    width: 84,
  },
  medal: { fontSize: 20 },
  podiumName: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  podiumScore: {
    fontFamily: fontFamily.extraBold,
    fontSize: 14,
    color: '#D4A657',
    fontVariant: ['tabular-nums'],
  },
  podiumBlock: {
    width: '100%',
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
    marginTop: 2,
  },
  podiumPlace: {
    fontFamily: fontFamily.black,
    fontSize: 18,
    color: 'rgba(0,0,0,0.45)',
  },
  tieGroup: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  tieNote: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.warning,
    writingDirection: 'rtl',
  },
  tableColumn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  tableBody: {
    paddingTop: spacing.xs,
    gap: 3,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  rowWinner: {
    backgroundColor: 'rgba(212,166,87,0.14)',
  },
  cell: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  cellRank: { width: 24, textAlign: 'center' },
  cellName: { flex: 1, textAlign: 'right' },
  cellScore: { width: 58, textAlign: 'center', fontFamily: fontFamily.extraBold },
  cellIq: { width: 48, textAlign: 'center' },
  actions: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
