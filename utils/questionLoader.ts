import { Question } from '@/content/types';
import { getQuestionsForCategory } from '@/content';
import { getTopicById, QUESTIONS_PER_TOPIC } from '@/content/topics';

/** Fisher–Yates. Returns a new array; never mutates the source bank. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Per-session deck: each chosen topic gets its own shuffled queue capped at
 * QUESTIONS_PER_TOPIC, and questions are dealt off the front. That guarantees
 * both no repeats within a session and a fixed, predictable game length.
 */
export type QuestionDecks = Record<string, Question[]>;

export function buildDecks(topicIds: string[]): QuestionDecks {
  const decks: QuestionDecks = {};
  for (const topicId of topicIds) {
    const topic = getTopicById(topicId);
    if (!topic) continue;
    const pool = getQuestionsForCategory(topic.categoryId).filter(
      (q) => q.subcategory === topic.subcategory
    );
    decks[topicId] = shuffle(pool).slice(0, QUESTIONS_PER_TOPIC);
  }
  return decks;
}

export function remainingCounts(decks: QuestionDecks): Record<string, number> {
  return Object.fromEntries(Object.entries(decks).map(([id, deck]) => [id, deck.length]));
}

export function totalRemaining(decks: QuestionDecks): number {
  return Object.values(decks).reduce((sum, deck) => sum + deck.length, 0);
}
