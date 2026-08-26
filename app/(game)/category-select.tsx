import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { SELECTABLE_TOPICS, TOPICS_PER_GAME } from '@/content/topics';
import { useServerStore } from '@/store/serverStore';
import { useGameStore } from '@/store/gameStore';

/** "مع الأصدقاء" has no lobby to configure, so it keeps the PRD's default 40s. */
const FRIENDS_QUESTION_TIME_SEC = 40;

export default function CategorySelectScreen() {
  const role = useServerStore((s) => s.role);
  const selectedCategoryIds = useServerStore((s) => s.selectedCategoryIds);
  const toggleCategory = useServerStore((s) => s.toggleCategory);
  const backToLobby = useServerStore((s) => s.backToLobby);
  const markStarting = useServerStore((s) => s.startGame);
  const players = useServerStore((s) => s.players);
  const friendNames = useServerStore((s) => s.friendNames);
  const questionTimeSec = useServerStore((s) => s.questionTimeSec);
  const rulesMode = useServerStore((s) => s.rulesMode);
  const startGameLoop = useGameStore((s) => s.startGame);

  const isFriendsFlow = role === 'local';
  const hasEnoughParticipants = isFriendsFlow || players.length >= 2;
  const topicsChosen = selectedCategoryIds.length === TOPICS_PER_GAME;
  const canStart = topicsChosen && hasEnoughParticipants;

  const onBack = () => {
    if (!isFriendsFlow) backToLobby();
    router.back();
  };

  const onStart = () => {
    if (isFriendsFlow) {
      startGameLoop({
        mode: 'friends',
        participants: [
          { id: 'friend_1', name: friendNames[0] },
          { id: 'friend_2', name: friendNames[1] },
        ],
        activeCategoryIds: selectedCategoryIds,
        questionTimeSec: FRIENDS_QUESTION_TIME_SEC,
      });
    } else {
      // Flip the lobby into its "starting" phase so connected clients see it,
      // then hand the turn loop its own snapshot of the settings.
      markStarting();
      startGameLoop({
        mode: 'server',
        participants: players.map((p) => ({ id: p.id, name: p.name })),
        activeCategoryIds: selectedCategoryIds,
        questionTimeSec,
        rulesMode,
      });
    }
    router.replace('/(game)/gameplay');
  };

  const hint = !hasEnoughParticipants
    ? 'محتاجين لاعبين اثنين على الأقل'
    : !topicsChosen
    ? `اختر ${TOPICS_PER_GAME} مواضيع بالضبط`
    : null;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.feltDark, colors.feltDarker]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <ScreenHeader
          title="اختيار المواضيع"
          subtitle={`${selectedCategoryIds.length}/${TOPICS_PER_GAME} مواضيع مختارة`}
          onBack={onBack}
        />

        <FlatList
          data={SELECTABLE_TOPICS}
          keyExtractor={(t) => t.id}
          numColumns={7}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              selected={selectedCategoryIds.includes(item.id)}
              onPress={() => toggleCategory(item.id)}
            />
          )}
        />

        <View style={styles.footer}>
          {hint && <Text style={styles.hint}>{hint}</Text>}
          <PrimaryButton label="ابدأ التحدي ▶️" onPress={onStart} disabled={!canStart} fullWidth />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.feltDark },
  flex: { flex: 1 },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  gridRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  hint: {
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
});
