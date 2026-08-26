import { create } from 'zustand';
import { Question } from '@/content/types';
import { RuleDefinition } from '@/content/rules';
import { buildDecks, QuestionDecks, remainingCounts, totalRemaining } from '@/utils/questionLoader';
import { scoreForAnswer } from '@/utils/scoreCalculator';
import {
  drawRule,
  needsPostAnswerPopup,
  onDrawEffects,
  resolvePostAnswer,
  resolvePreReveal,
  RuleContext,
  RuleEffects,
  RuleOutcome,
  RulesMode,
  scoringAdjustment,
} from '@/utils/ruleEngine';

export type GameMode = 'server' | 'friends';

/**
 * PRD §4.8 shows scores per "team" while §4.10 awards points to the player who
 * answered. For a party game run off one device both collapse to the same
 * thing, so a participant is the single scoring entity — one per lobby player,
 * or exactly two in "مع الأصدقاء".
 */
export interface Participant {
  id: string;
  name: string;
  score: number;
  correctCount: number;
  /** Turns this participant was the one on the clock. Denominator for §4.13's "Intelligence Score". */
  attemptedCount: number;
}

export type GamePhase =
  | 'category_pick'
  | 'betting'
  | 'question'
  | 'reveal'
  /** A rule that fires after "من جاوب؟" is waiting on the host. */
  | 'rule_post'
  | 'game_over';

/** A physical challenge a tracker triggered (rules 21 and 22). */
export interface PendingChallenge {
  text: string;
  participantId: string;
  timerSec?: number;
}

/** Everything undo has to restore. Snapshotted before each scoring action. */
interface Snapshot {
  participants: Participant[];
  decks: QuestionDecks;
  turnIndex: number;
  questionNumber: number;
  phase: GamePhase;
  currentCategoryId: string | null;
  currentQuestion: Question | null;
  didBet: boolean;
  currentRule: RuleDefinition | null;
  ruleResolution: RuleOutcome | null;
  ruleNotice: string | null;
  restrictAnswerTo: string | null;
  divertQuestionPointsTo: string | null;
  consecutiveCorrect: Record<string, number>;
  wrongCounts: Record<string, number>;
  violationCounts: Record<string, number>;
  lockedNextTurn: string[];
  sacrifices: Record<string, number>;
  categoryChooserId: string | null;
  pendingChallenge: PendingChallenge | null;
  pendingEarned: number;
  isTiebreaker: boolean;
}

interface GameState {
  mode: GameMode;
  phase: GamePhase;
  participants: Participant[];
  turnIndex: number;

  activeCategoryIds: string[];
  decks: QuestionDecks;
  questionTimeSec: number;
  bettingEnabled: boolean;
  rulesMode: RulesMode;

  currentCategoryId: string | null;
  currentQuestion: Question | null;
  didBet: boolean;
  questionNumber: number;

  // ---- rules ----
  currentRule: RuleDefinition | null;
  /** Outcome the host reported for the current rule's pre-reveal popup. */
  ruleResolution: RuleOutcome | null;
  ruleNotice: string | null;
  restrictAnswerTo: string | null;
  divertQuestionPointsTo: string | null;

  // ---- cross-turn trackers ----
  consecutiveCorrect: Record<string, number>;
  wrongCounts: Record<string, number>;
  violationCounts: Record<string, number>;
  lockedNextTurn: string[];
  /** participantId -> turns still sat out (rule 18). */
  sacrifices: Record<string, number>;
  /** Set by rules 13/28 — this player picks the next category. */
  categoryChooserId: string | null;
  pendingChallenge: PendingChallenge | null;
  /** What the active player just earned, held for rule 30's counter-wager. */
  pendingEarned: number;
  /** Sudden-death question (PRD §4.13) — no clock, no rule, no bet. */
  isTiebreaker: boolean;

  lastDelta: { participantId: string; amount: number } | null;
  undoStack: Snapshot[];

  startGame: (params: {
    mode: GameMode;
    participants: { id: string; name: string }[];
    activeCategoryIds: string[];
    questionTimeSec: number;
    bettingEnabled?: boolean;
    rulesMode?: RulesMode;
  }) => void;

  pickCategory: (categoryId: string) => void;
  placeBet: (didBet: boolean) => void;
  resolveCurrentRule: (outcome: RuleOutcome) => void;
  stealQuestion: (participantId: string) => void;
  revealAnswer: () => void;
  awardTo: (participantId: string | null, isPartial?: boolean) => void;
  resolvePostAnswerRule: (outcome: RuleOutcome) => void;
  dismissChallenge: () => void;
  adjustScore: (participantId: string, delta: number) => void;
  recordViolation: (participantId: string) => void;
  undoLast: () => void;
  recycleQuestions: () => void;
  startTiebreaker: () => void;
  endGame: () => void;
  resetGame: () => void;
}

const MAX_UNDO_DEPTH = 20;
/** Rule 22 fires on this cadence. */
const CHALLENGE_EVERY_N_QUESTIONS = 10;
/** Rule 21's threshold before the squat-jump challenge. */
const WRONG_ANSWERS_BEFORE_CHALLENGE = 3;

function snapshot(state: GameState): Snapshot {
  return {
    // Deep-copy the parts undo mutates: participant objects are replaced on
    // score changes, and each deck array is shifted when a question is drawn.
    participants: state.participants.map((p) => ({ ...p })),
    decks: Object.fromEntries(Object.entries(state.decks).map(([id, deck]) => [id, [...deck]])),
    turnIndex: state.turnIndex,
    questionNumber: state.questionNumber,
    phase: state.phase,
    currentCategoryId: state.currentCategoryId,
    currentQuestion: state.currentQuestion,
    didBet: state.didBet,
    currentRule: state.currentRule,
    ruleResolution: state.ruleResolution,
    ruleNotice: state.ruleNotice,
    restrictAnswerTo: state.restrictAnswerTo,
    divertQuestionPointsTo: state.divertQuestionPointsTo,
    consecutiveCorrect: { ...state.consecutiveCorrect },
    wrongCounts: { ...state.wrongCounts },
    violationCounts: { ...state.violationCounts },
    lockedNextTurn: [...state.lockedNextTurn],
    sacrifices: { ...state.sacrifices },
    categoryChooserId: state.categoryChooserId,
    pendingChallenge: state.pendingChallenge,
    pendingEarned: state.pendingEarned,
    isTiebreaker: state.isTiebreaker,
  };
}

function applyDeltas(
  participants: Participant[],
  deltas: { participantId: string; amount: number }[]
): Participant[] {
  if (deltas.length === 0) return participants;
  const byId = new Map<string, number>();
  for (const { participantId, amount } of deltas) {
    byId.set(participantId, (byId.get(participantId) ?? 0) + amount);
  }
  return participants.map((p) => {
    const delta = byId.get(p.id);
    return delta ? { ...p, score: p.score + delta } : p;
  });
}

/**
 * Advances the turn, skipping anyone sitting out (rule 18) or locked out of
 * the next round (rules 23/25). Falls back to the plain next seat if everyone
 * is blocked, so the loop can never stall.
 */
function nextTurnIndex(
  participants: Participant[],
  from: number,
  sacrifices: Record<string, number>,
  locked: string[]
): number {
  const count = participants.length;
  if (count === 0) return 0;
  for (let step = 1; step <= count; step++) {
    const index = (from + step) % count;
    const id = participants[index].id;
    if ((sacrifices[id] ?? 0) > 0) continue;
    if (locked.includes(id)) continue;
    return index;
  }
  return (from + 1) % count;
}

function ruleContext(state: GameState): RuleContext {
  return {
    activeParticipantId: state.participants[state.turnIndex]?.id ?? '',
    participantIds: state.participants.map((p) => p.id),
    questionPoints: state.currentQuestion?.points ?? 0,
  };
}

const initialState = {
  mode: 'server' as GameMode,
  phase: 'category_pick' as GamePhase,
  participants: [] as Participant[],
  turnIndex: 0,
  activeCategoryIds: [] as string[],
  decks: {} as QuestionDecks,
  questionTimeSec: 40,
  bettingEnabled: true,
  rulesMode: 'random' as RulesMode,
  currentCategoryId: null as string | null,
  currentQuestion: null as Question | null,
  didBet: false,
  questionNumber: 0,
  currentRule: null as RuleDefinition | null,
  ruleResolution: null as RuleOutcome | null,
  ruleNotice: null as string | null,
  restrictAnswerTo: null as string | null,
  divertQuestionPointsTo: null as string | null,
  consecutiveCorrect: {} as Record<string, number>,
  wrongCounts: {} as Record<string, number>,
  violationCounts: {} as Record<string, number>,
  lockedNextTurn: [] as string[],
  sacrifices: {} as Record<string, number>,
  categoryChooserId: null as string | null,
  pendingChallenge: null as PendingChallenge | null,
  pendingEarned: 0,
  isTiebreaker: false,
  lastDelta: null as GameState['lastDelta'],
  undoStack: [] as Snapshot[],
};

export const useGameStore = create<GameState>()((set, get) => ({
  ...initialState,

  startGame: ({
    mode,
    participants,
    activeCategoryIds,
    questionTimeSec,
    bettingEnabled = true,
    rulesMode = 'random',
  }) => {
    set({
      ...initialState,
      mode,
      questionTimeSec,
      bettingEnabled,
      rulesMode,
      activeCategoryIds,
      decks: buildDecks(activeCategoryIds),
      participants: participants.map((p) => ({
        ...p,
        score: 0,
        correctCount: 0,
        attemptedCount: 0,
      })),
      phase: 'category_pick',
    });
  },

  pickCategory: (categoryId) => {
    const state = get();
    const deck = state.decks[categoryId];
    if (!deck || deck.length === 0) return;

    const [question, ...rest] = deck;
    const rule = drawRule(state.rulesMode);

    // Rules that pay out the instant they are drawn settle here, before the
    // host has anything to decide.
    const immediate = onDrawEffects(rule, {
      ...ruleContext(state),
      questionPoints: question.points,
    });

    set({
      decks: { ...state.decks, [categoryId]: rest },
      currentCategoryId: categoryId,
      currentQuestion: question,
      didBet: false,
      questionNumber: state.questionNumber + 1,
      currentRule: rule,
      ruleResolution: null,
      ruleNotice: immediate.notice ?? null,
      restrictAnswerTo: null,
      divertQuestionPointsTo: null,
      categoryChooserId: null,
      participants: applyDeltas(state.participants, immediate.deltas),
      // Betting happens before the question is visible; skip straight to it
      // when the host turned betting off in settings.
      phase: state.bettingEnabled ? 'betting' : 'question',
    });
  },

  placeBet: (didBet) => set({ didBet, phase: 'question' }),

  resolveCurrentRule: (outcome) => {
    const state = get();
    const rule = state.currentRule;
    if (!rule) return;

    const effects: RuleEffects = resolvePreReveal(rule, outcome, ruleContext(state));
    const sacrifices = effects.sacrifice
      ? { ...state.sacrifices, [effects.sacrifice.participantId]: effects.sacrifice.turns }
      : state.sacrifices;

    set({
      ruleResolution: outcome,
      ruleNotice: effects.notice ?? 'تم',
      restrictAnswerTo: effects.restrictAnswerTo ?? state.restrictAnswerTo,
      divertQuestionPointsTo: effects.divertQuestionPointsTo ?? state.divertQuestionPointsTo,
      sacrifices,
      participants: applyDeltas(state.participants, effects.deltas),
    });
  },

  /** Rule 11 — a rival grabs the question after the silence window. */
  stealQuestion: (participantId) => {
    set({
      restrictAnswerTo: participantId,
      ruleNotice: 'تم خطف السؤال',
      ruleResolution: { kind: 'select', participantId },
    });
  },

  revealAnswer: () => {
    if (get().phase !== 'question') return;
    set({ phase: 'reveal' });
  },

  awardTo: (participantId, isPartial = false) => {
    const state = get();
    const question = state.currentQuestion;
    if (!question || state.phase !== 'reveal') return;

    const undoStack = [...state.undoStack, snapshot(state)].slice(-MAX_UNDO_DEPTH);
    const ctx = ruleContext(state);
    const activeId = ctx.activeParticipantId;
    const answeredCorrectly = participantId !== null;

    const adjustment = scoringAdjustment(
      state.currentRule,
      state.ruleResolution,
      ctx,
      participantId,
      isPartial
    );

    const baseDelta = adjustment.suppressQuestionPoints
      ? 0
      : scoreForAnswer(question.points, state.didBet, answeredCorrectly);

    // The bet is the active player's wager, so a lost stake always comes off
    // their score — even though the points for a correct answer go to whoever
    // actually answered. Rule 1 can divert that payout to a rival.
    const payoutTarget = answeredCorrectly
      ? state.divertQuestionPointsTo ?? participantId
      : activeId;

    let participants = applyDeltas(
      state.participants,
      baseDelta !== 0 ? [{ participantId: payoutTarget, amount: baseDelta }] : []
    );
    participants = applyDeltas(participants, adjustment.deltas);

    participants = participants.map((p) => {
      let next = p;
      if (p.id === participantId) next = { ...next, correctCount: next.correctCount + 1 };
      if (p.id === activeId) next = { ...next, attemptedCount: next.attemptedCount + 1 };
      return next;
    });

    // ---- trackers ----
    const consecutiveCorrect = { ...state.consecutiveCorrect };
    for (const p of state.participants) {
      consecutiveCorrect[p.id] = p.id === participantId ? (consecutiveCorrect[p.id] ?? 0) + 1 : 0;
    }

    const wrongCounts = { ...state.wrongCounts };
    if (!answeredCorrectly) {
      wrongCounts[activeId] = (wrongCounts[activeId] ?? 0) + 1;
    }

    // Rule 23 locks whoever just answered out of the next round.
    const lockedNextTurn =
      state.currentRule?.id === 23 && participantId ? [participantId] : [];

    // Rules 21 and 22 raise a physical challenge from pure bookkeeping.
    let pendingChallenge: PendingChallenge | null = null;
    if (
      state.currentRule?.id === 21 &&
      (wrongCounts[activeId] ?? 0) >= WRONG_ANSWERS_BEFORE_CHALLENGE
    ) {
      pendingChallenge = { text: '10 قفزات سكوات', participantId: activeId };
      wrongCounts[activeId] = 0;
    } else if (
      state.currentRule?.id === 22 &&
      state.questionNumber % CHALLENGE_EVERY_N_QUESTIONS === 0
    ) {
      const lowest = [...participants].sort((a, b) => a.score - b.score)[0];
      if (lowest) {
        pendingChallenge = { text: 'بلانك 30 ثانية', participantId: lowest.id, timerSec: 30 };
      }
    }

    const earnedAmount = Math.max(0, baseDelta);
    const showPostPopup =
      needsPostAnswerPopup(state.currentRule, participantId) &&
      // Rule 20 only triggers once the streak actually reaches two.
      (state.currentRule?.id !== 20 || (consecutiveCorrect[activeId] ?? 0) >= 2);

    if (showPostPopup) {
      set({
        participants,
        undoStack,
        consecutiveCorrect,
        wrongCounts,
        lockedNextTurn,
        pendingChallenge,
        lastDelta: baseDelta !== 0 ? { participantId: payoutTarget, amount: baseDelta } : null,
        ruleNotice: adjustment.notice ?? state.ruleNotice,
        phase: 'rule_post',
        pendingEarned: earnedAmount,
      });
      return;
    }

    finalizeTurn(set, get, {
      participants,
      undoStack,
      consecutiveCorrect,
      wrongCounts,
      lockedNextTurn,
      pendingChallenge,
      lastDelta: baseDelta !== 0 ? { participantId: payoutTarget, amount: baseDelta } : null,
      notice: adjustment.notice ?? null,
    });
  },

  resolvePostAnswerRule: (outcome) => {
    const state = get();
    const rule = state.currentRule;
    if (!rule || state.phase !== 'rule_post') return;

    const effects = resolvePostAnswer(rule, outcome, ruleContext(state), state.pendingEarned);

    const categoryChooserId =
      rule.id === 13 || rule.id === 28 ? ruleContext(state).activeParticipantId : null;

    finalizeTurn(set, get, {
      participants: applyDeltas(state.participants, effects.deltas),
      undoStack: state.undoStack,
      consecutiveCorrect: state.consecutiveCorrect,
      wrongCounts: state.wrongCounts,
      lockedNextTurn: state.lockedNextTurn,
      pendingChallenge: state.pendingChallenge,
      lastDelta: null,
      notice: effects.notice ?? null,
      categoryChooserId,
    });
  },

  dismissChallenge: () => set({ pendingChallenge: null }),

  adjustScore: (participantId, delta) => {
    const state = get();
    const undoStack = [...state.undoStack, snapshot(state)].slice(-MAX_UNDO_DEPTH);
    set({
      undoStack,
      lastDelta: { participantId, amount: delta },
      participants: applyDeltas(state.participants, [{ participantId, amount: delta }]),
    });
  },

  /** Rule 25 — the host logs a broken rule; the second one costs a turn. */
  recordViolation: (participantId) => {
    const state = get();
    const count = (state.violationCounts[participantId] ?? 0) + 1;
    set({
      violationCounts: { ...state.violationCounts, [participantId]: count },
      lockedNextTurn:
        count >= 2 && !state.lockedNextTurn.includes(participantId)
          ? [...state.lockedNextTurn, participantId]
          : state.lockedNextTurn,
      ruleNotice: count >= 2 ? 'مخالفة ثانية — توقيف الجولة الجاية' : 'تم تسجيل المخالفة',
    });
  },

  undoLast: () => {
    const state = get();
    const previous = state.undoStack[state.undoStack.length - 1];
    if (!previous) return;
    set({
      ...previous,
      undoStack: state.undoStack.slice(0, -1),
      lastDelta: null,
    });
  },

  recycleQuestions: () => {
    const state = get();
    set({
      decks: buildDecks(state.activeCategoryIds),
      phase: 'category_pick',
      undoStack: [],
    });
  },

  /**
   * Sudden death: draw one more question from any category that still has
   * one, refilling the decks first if the game ran dry. No timer, no rule
   * and no wager — it exists purely to break a tie.
   */
  startTiebreaker: () => {
    const state = get();
    let decks = state.decks;
    if (totalRemaining(decks) === 0) decks = buildDecks(state.activeCategoryIds);

    const categoryId = Object.keys(decks).find((id) => decks[id].length > 0);
    if (!categoryId) return;

    const [question, ...rest] = decks[categoryId];
    set({
      decks: { ...decks, [categoryId]: rest },
      currentCategoryId: categoryId,
      currentQuestion: question,
      currentRule: null,
      ruleResolution: null,
      ruleNotice: null,
      restrictAnswerTo: null,
      divertQuestionPointsTo: null,
      didBet: false,
      isTiebreaker: true,
      questionNumber: state.questionNumber + 1,
      phase: 'question',
    });
  },

  endGame: () => set({ phase: 'game_over' }),

  resetGame: () => set({ ...initialState }),
}));

/** Shared tail of a turn: rotate the seat, clear per-turn rule state, check for the end. */
function finalizeTurn(
  set: (partial: Partial<GameState>) => void,
  get: () => GameState,
  args: {
    participants: Participant[];
    undoStack: Snapshot[];
    consecutiveCorrect: Record<string, number>;
    wrongCounts: Record<string, number>;
    lockedNextTurn: string[];
    pendingChallenge: PendingChallenge | null;
    lastDelta: GameState['lastDelta'];
    notice: string | null;
    categoryChooserId?: string | null;
  }
) {
  const state = get();

  // Everyone sitting out burns one of their turns.
  const sacrifices: Record<string, number> = {};
  for (const [id, turns] of Object.entries(state.sacrifices)) {
    if (turns > 1) sacrifices[id] = turns - 1;
  }

  const turnIndex = nextTurnIndex(
    args.participants,
    state.turnIndex,
    sacrifices,
    args.lockedNextTurn
  );

  set({
    participants: args.participants,
    undoStack: args.undoStack,
    consecutiveCorrect: args.consecutiveCorrect,
    wrongCounts: args.wrongCounts,
    lockedNextTurn: args.lockedNextTurn,
    sacrifices,
    pendingChallenge: args.pendingChallenge,
    lastDelta: args.lastDelta,
    ruleNotice: args.notice,
    categoryChooserId: args.categoryChooserId ?? null,
    turnIndex,
    currentQuestion: null,
    currentCategoryId: null,
    currentRule: null,
    ruleResolution: null,
    restrictAnswerTo: null,
    divertQuestionPointsTo: null,
    didBet: false,
    isTiebreaker: false,
    // A sudden-death question always returns to the results screen.
    phase:
      state.isTiebreaker || totalRemaining(state.decks) === 0 ? 'game_over' : 'category_pick',
  });
}

/**
 * Returns an existing participant object, so it is reference-stable between
 * renders and safe to use directly as a zustand selector.
 *
 * Note there is deliberately no `selectRemainingByCategory` selector here:
 * it would build a fresh object on every call, and zustand v5 compares
 * snapshots with Object.is, so subscribing to it would re-render forever.
 * Subscribe to `decks` (a stable reference) and derive counts with useMemo.
 */
export function selectActiveParticipant(state: GameState): Participant | undefined {
  return state.participants[state.turnIndex];
}

export { remainingCounts, totalRemaining };
