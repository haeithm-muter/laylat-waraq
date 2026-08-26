import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { Question } from '@/content/types';
import { Category } from '@/constants/categories';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';

interface QuestionCardProps {
  question: Question;
  category: Category | undefined;
  /** Hidden during the betting phase — the wager is placed before seeing it. */
  concealed: boolean;
  didBet: boolean;
  onReveal: () => void;
  emphasis?: boolean;
}

export function QuestionCard({
  question,
  category,
  concealed,
  didBet,
  onReveal,
  emphasis = false,
}: QuestionCardProps) {
  // Crossfades whenever the question changes or the bet-conceal state
  // flips, instead of the content swapping instantly.
  const contentOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    contentOpacity.setValue(0);
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [concealed, question.id, contentOpacity]);

  return (
    <View style={[styles.card, emphasis && styles.cardEmphasis]}>
      <View style={[styles.categoryPill, { backgroundColor: category?.color ?? colors.info }]}>
        <Text style={styles.categoryText} numberOfLines={1}>
          {category?.icon} {category?.name ?? question.category}
        </Text>
      </View>

      <Animated.View style={[styles.contentArea, { opacity: contentOpacity }]}>
        {concealed ? (
          <View style={styles.concealedBody}>
            <Text style={styles.concealedMark}>؟</Text>
            <Text style={styles.concealedHint}>قرّر الرهان قبل ما تشوف السؤال</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.questionScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.questionText, emphasis && styles.questionTextEmphasis]}>
              {question.question}
            </Text>
          </ScrollView>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>
            {didBet ? `${question.points * 2} نقطة (رهان ×2)` : `${question.points} نقطة`}
          </Text>
        </View>

        {!concealed && <PrimaryButton label="كشف الإجابة" onPress={onReveal} fullWidth />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: '#D4A657',
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardEmphasis: {
    padding: spacing.lg,
  },
  contentArea: {
    flex: 1,
  },
  categoryPill: {
    alignSelf: 'flex-end',
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  categoryText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.white,
    writingDirection: 'rtl',
  },
  questionScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  questionText: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
    lineHeight: 30,
    color: colors.textOnLight,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  questionTextEmphasis: {
    fontSize: 25,
    lineHeight: 38,
  },
  concealedBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  concealedMark: {
    fontFamily: fontFamily.black,
    fontSize: 64,
    lineHeight: 76,
    color: 'rgba(36, 27, 18, 0.22)',
  },
  concealedHint: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textOnLightMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  footer: {
    gap: spacing.sm,
  },
  pointsBadge: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(36, 27, 18, 0.08)',
  },
  pointsText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.textOnLight,
    writingDirection: 'rtl',
  },
});
