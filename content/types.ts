export type Difficulty = 'easy' | 'medium' | 'hard';

/** Matches the JSON shape in PRD §7.1. */
export interface Question {
  id: string;
  category: string;
  subcategory: string;
  question: string;
  answer: string;
  points: number;
  difficulty: Difficulty;
}

/** PRD §13 — points are derived from difficulty, not authored per question. */
export const POINTS_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 200,
  medium: 300,
  hard: 400,
};
