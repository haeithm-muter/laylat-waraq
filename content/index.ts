import { POINTS_BY_DIFFICULTY, Question, Difficulty } from './types';

import sports from './seed/sports.json';
import general from './seed/general.json';
import religion from './seed/religion.json';
import series from './seed/series.json';
import geography from './seed/geography.json';
import history from './seed/history.json';
import movies from './seed/movies.json';
import anime from './seed/anime.json';
import science from './seed/science.json';
import gaming from './seed/gaming.json';
import countries from './seed/countries.json';
import spacetoon from './seed/spacetoon.json';
import guess from './seed/guess.json';

/**
 * Shape as authored in the JSON files — points are derived, not stored, and
 * `difficulty` is a plain string here because that is how TypeScript infers
 * it from an imported .json (it cannot narrow to the union on its own).
 */
interface RawQuestion {
  id: string;
  category: string;
  subcategory: string;
  question: string;
  answer: string;
  difficulty: string;
}

// Metro resolves `require`/`import` statically, so the category -> file map
// has to be spelled out rather than built from a glob. Day 4 expands each
// entry from one seed file into that category's full subcategory set.
const RAW_BANK: Record<string, RawQuestion[]> = {
  sports,
  general,
  religion,
  series,
  geography,
  history,
  movies,
  anime,
  science,
  gaming,
  countries,
  spacetoon,
  guess,
};

function isDifficulty(value: string): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

function hydrate(raw: RawQuestion): Question {
  const difficulty: Difficulty = isDifficulty(raw.difficulty) ? raw.difficulty : 'easy';
  return { ...raw, difficulty, points: POINTS_BY_DIFFICULTY[difficulty] };
}

export const QUESTION_BANK: Record<string, Question[]> = Object.fromEntries(
  Object.entries(RAW_BANK).map(([categoryId, questions]) => [categoryId, questions.map(hydrate)])
);

export function getQuestionsForCategory(categoryId: string): Question[] {
  return QUESTION_BANK[categoryId] ?? [];
}

export * from './types';
