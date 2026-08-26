import { QUESTION_BANK } from './index';
import { CATEGORIES, type Category } from '@/constants/categories';

/** Questions drawn per chosen topic, and topics required to start a game. */
export const QUESTIONS_PER_TOPIC = 8;
export const TOPICS_PER_GAME = 6;

/**
 * A selectable (category, subcategory) pair — e.g. category "series",
 * subcategory "Breaking Bad". Shape-compatible with `Category` (id/name/
 * icon/color) so it drops into `CategoryCard`/`CategoryGrid` unchanged.
 */
export interface Topic extends Category {
  categoryId: string;
  subcategory: string;
  questionCount: number;
}

function buildTopics(): Topic[] {
  const topics: Topic[] = [];
  for (const category of CATEGORIES) {
    const counts = new Map<string, number>();
    for (const q of QUESTION_BANK[category.id] ?? []) {
      counts.set(q.subcategory, (counts.get(q.subcategory) ?? 0) + 1);
    }
    for (const [subcategory, questionCount] of counts) {
      topics.push({
        id: `${category.id}::${subcategory}`,
        name: subcategory,
        icon: category.icon,
        color: category.color,
        categoryId: category.id,
        subcategory,
        questionCount,
      });
    }
  }
  return topics;
}

export const ALL_TOPICS: Topic[] = buildTopics();

/** Only topics with enough questions to fill a full round without repeats. */
export const SELECTABLE_TOPICS: Topic[] = ALL_TOPICS.filter(
  (t) => t.questionCount >= QUESTIONS_PER_TOPIC
);

export function getTopicById(id: string): Topic | undefined {
  return SELECTABLE_TOPICS.find((t) => t.id === id);
}
