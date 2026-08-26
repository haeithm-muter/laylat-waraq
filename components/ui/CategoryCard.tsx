import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '@/constants/categories';
import { fontFamily } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

interface CategoryCardProps {
  category: Category;
  selected: boolean;
  onPress: () => void;
}

export function CategoryCard({ category, selected, onPress }: CategoryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        { borderColor: selected ? category.color : colors.border },
        selected && { backgroundColor: `${category.color}26` },
        pressed && styles.pressed,
      ]}
    >
      {selected && (
        <View style={[styles.checkBadge, { backgroundColor: category.color }]}>
          <Ionicons name="checkmark" size={12} color={colors.textOnDark} />
        </View>
      )}
      <Text style={styles.icon}>{category.icon}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 96,
    height: 88,
    borderRadius: radius.md,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 26,
  },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
});
