import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Category } from '@/constants/categories';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';

interface CategoryGridProps {
  categories: Category[];
  remainingByCategory: Record<string, number>;
  onPick: (categoryId: string) => void;
}

/** In-turn category picker (PRD §4.8) — exhausted categories gray out (§5.1). */
export function CategoryGrid({ categories, remainingByCategory, onPick }: CategoryGridProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    >
      {categories.map((category) => {
        const remaining = remainingByCategory[category.id] ?? 0;
        const exhausted = remaining === 0;

        return (
          <Pressable
            key={category.id}
            onPress={() => !exhausted && onPick(category.id)}
            disabled={exhausted}
            accessibilityRole="button"
            accessibilityState={{ disabled: exhausted }}
            style={({ pressed }) => [
              styles.card,
              { borderColor: exhausted ? colors.border : category.color },
              exhausted && styles.cardExhausted,
              pressed && !exhausted && styles.pressed,
            ]}
          >
            <Text style={[styles.icon, exhausted && styles.dimmed]}>{category.icon}</Text>
            <Text style={[styles.name, exhausted && styles.dimmed]} numberOfLines={1}>
              {category.name}
            </Text>
            <View
              style={[
                styles.countBadge,
                { backgroundColor: exhausted ? 'rgba(255,255,255,0.06)' : `${category.color}2E` },
              ]}
            >
              <Text style={[styles.countText, exhausted && styles.dimmed]}>
                {exhausted ? 'انتهت' : `الأسئلة: ${remaining}`}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  card: {
    width: 104,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    gap: 3,
  },
  cardExhausted: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  icon: {
    fontSize: 24,
  },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  countBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  countText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  dimmed: {
    opacity: 0.35,
  },
});
