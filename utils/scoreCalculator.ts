/**
 * Betting math (PRD §4.9 — "راهن بضعف النقاط قبل ما تشوف السؤال").
 *
 * The bet is placed before the question is shown, and it is double-or-nothing:
 *   no bet + correct  → +points
 *   no bet + no one   → 0        (a plain miss costs nothing)
 *   bet    + correct  → +2×points
 *   bet    + no one   → −points  (the stake is lost)
 *
 * The −200 penalty for a wrong answer in PRD §6 belongs to rule card #2 and is
 * applied by the rule engine on top of this (Day 4), not here.
 */
export function scoreForAnswer(points: number, didBet: boolean, answeredCorrectly: boolean): number {
  if (answeredCorrectly) return didBet ? points * 2 : points;
  return didBet ? -points : 0;
}

/** PRD §4.13 — "Intelligence Score" (% correct), used on the results screen. */
export function intelligenceScore(correctCount: number, attemptedCount: number): number {
  if (attemptedCount <= 0) return 0;
  return Math.round((correctCount / attemptedCount) * 100);
}
