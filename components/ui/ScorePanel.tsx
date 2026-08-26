import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Participant } from '@/store/gameStore';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';

interface ScorePanelProps {
  participants: Participant[];
  activeParticipantId?: string;
  onAdjust: (participantId: string, delta: number) => void;
  /** Manual +/- nudges (PRD §4.8) are hidden while a question is in flight. */
  showControls?: boolean;
}

const ADJUST_STEP = 100;

export function ScorePanel({
  participants,
  activeParticipantId,
  onAdjust,
  showControls = true,
}: ScorePanelProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {participants.map((participant) => (
        <ScoreChip
          key={participant.id}
          participant={participant}
          isActive={participant.id === activeParticipantId}
          showControls={showControls}
          onAdjust={onAdjust}
        />
      ))}
    </ScrollView>
  );
}

interface ScoreChipProps {
  participant: Participant;
  isActive: boolean;
  showControls: boolean;
  onAdjust: (participantId: string, delta: number) => void;
}

function ScoreChip({ participant, isActive, showControls, onAdjust }: ScoreChipProps) {
  // Small "pop" whenever this player's score changes, instead of the
  // number just snapping to its new value.
  const scale = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(participant.score);
  useEffect(() => {
    if (participant.score === prevScore.current) return;
    prevScore.current = participant.score;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.18, duration: 110, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [participant.score, scale]);

  return (
    <View style={[styles.chip, isActive && styles.chipActive]}>
      {showControls && (
        <Pressable
          onPress={() => onAdjust(participant.id, ADJUST_STEP)}
          hitSlop={6}
          style={styles.adjustButton}
          accessibilityLabel={`زيادة نقاط ${participant.name}`}
        >
          <Ionicons name="add" size={13} color={colors.success} />
        </Pressable>
      )}

      <View style={styles.chipBody}>
        <Text style={[styles.name, isActive && styles.nameActive]} numberOfLines={1}>
          {participant.name}
        </Text>
        <Animated.Text
          style={[styles.score, isActive && styles.scoreActive, { transform: [{ scale }] }]}
        >
          {participant.score}
        </Animated.Text>
      </View>

      {showControls && (
        <Pressable
          onPress={() => onAdjust(participant.id, -ADJUST_STEP)}
          hitSlop={6}
          style={styles.adjustButton}
          accessibilityLabel={`خصم نقاط ${participant.name}`}
        >
          <Ionicons name="remove" size={13} color={colors.danger} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: 'rgba(212,166,87,0.16)',
    borderColor: '#D4A657',
  },
  chipBody: {
    alignItems: 'center',
    minWidth: 52,
  },
  name: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  nameActive: {
    color: '#D4A657',
    fontFamily: fontFamily.bold,
  },
  score: {
    fontFamily: fontFamily.extraBold,
    fontSize: 15,
    color: colors.textOnDark,
    fontVariant: ['tabular-nums'],
  },
  scoreActive: {
    color: '#D4A657',
  },
  adjustButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
