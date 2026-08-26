/**
 * Top-level categories (PRD §7.2). Subcategories and actual question banks
 * are Day 4 content work — this is just the selectable grid for server
 * setup / category-select screens.
 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'sports', name: 'رياضة', icon: '🏆', color: '#3FBE7A' },
  { id: 'general', name: 'فئات عامة', icon: '🧠', color: '#4C8DFF' },
  { id: 'religion', name: 'دين', icon: '🕌', color: '#2FA36B' },
  { id: 'series', name: 'مسلسلات', icon: '📺', color: '#EC6FA0' },
  { id: 'geography', name: 'جغرافيا', icon: '🌍', color: '#4CA6A8' },
  { id: 'history', name: 'تاريخ', icon: '📜', color: '#C9A24B' },
  { id: 'movies', name: 'أفلام', icon: '🎬', color: '#E5584D' },
  { id: 'anime', name: 'أنمي', icon: '⚔️', color: '#8B6FEC' },
  { id: 'science', name: 'علوم', icon: '🔬', color: '#4C8DFF' },
  { id: 'gaming', name: 'Gaming', icon: '🎮', color: '#2FA36B' },
  { id: 'countries', name: 'دول', icon: '🗺️', color: '#D4A657' },
  { id: 'spacetoon', name: 'سبيستون', icon: '📡', color: '#EC6FA0' },
  { id: 'guess', name: 'خمن', icon: '🔍', color: '#E3A93B' },
];
