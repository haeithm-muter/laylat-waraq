import { RULES, RuleDefinition } from '@/content/rules';

export type RulesMode = 'random' | 'manual' | 'off';

/** What the host reported back from a rule's popup. */
export type RuleOutcome =
  | { kind: 'done' }
  | { kind: 'not_done' }
  /** Duel winner, chosen answerer, steal target, sacrificed player… */
  | { kind: 'select'; participantId: string };

export interface RuleContext {
  activeParticipantId: string;
  participantIds: string[];
  questionPoints: number;
}

/** Immediate, unconditional consequences of resolving a rule's popup. */
export interface RuleEffects {
  deltas: { participantId: string; amount: number }[];
  /** Only this participant may be credited in "من جاوب؟" this turn. */
  restrictAnswerTo?: string;
  /** Whoever is credited hands the question's points to this participant instead (rule 1). */
  divertQuestionPointsTo?: string;
  /** Rule 18 — this player sits out the next N turns. */
  sacrifice?: { participantId: string; turns: number };
  notice?: string;
}

/** Adjustments layered on top of the base award once the answer is known. */
export interface ScoringAdjustment {
  /** Rule 14/19 — the answerer earns nothing from the question itself. */
  suppressQuestionPoints: boolean;
  deltas: { participantId: string; amount: number }[];
  notice?: string;
}

const EMPTY_EFFECTS: RuleEffects = { deltas: [] };

export function drawRule(mode: RulesMode): RuleDefinition | null {
  // 'manual' means the host announces a rule themselves, so the app draws
  // nothing; 'off' disables the mechanic entirely (PRD §8).
  if (mode !== 'random') return null;
  return RULES[Math.floor(Math.random() * RULES.length)];
}

function opponentsOf(ctx: RuleContext): string[] {
  return ctx.participantIds.filter((id) => id !== ctx.activeParticipantId);
}

/** True when the rule needs the host to act before the answer is revealed. */
export function needsPreRevealPopup(rule: RuleDefinition | null): boolean {
  return Boolean(rule && rule.timing === 'pre_reveal');
}

/**
 * Rules that fire the moment they are drawn, with nothing for the host to
 * decide (rule 29 hands over points on sight).
 */
export function onDrawEffects(rule: RuleDefinition | null, ctx: RuleContext): RuleEffects {
  if (!rule) return EMPTY_EFFECTS;
  if (rule.id === 29) {
    return {
      deltas: [{ participantId: ctx.activeParticipantId, amount: rule.amount ?? 200 }],
      notice: `+${rule.amount ?? 200} نقطة مباشرة`,
    };
  }
  return EMPTY_EFFECTS;
}

export function resolvePreReveal(
  rule: RuleDefinition,
  outcome: RuleOutcome,
  ctx: RuleContext
): RuleEffects {
  const active = ctx.activeParticipantId;
  const amount = rule.amount ?? 0;

  switch (rule.id) {
    // Hand slap — if a rival took it, the question's points go to them.
    case 1:
      return outcome.kind === 'select'
        ? { deltas: [], divertQuestionPointsTo: outcome.participantId, notice: 'نقاط السؤال تروح للخصم' }
        : EMPTY_EFFECTS;

    // Age/height restrictions the app can't verify — the host adjudicates.
    case 4:
    case 8:
    case 15:
      return { deltas: [], notice: 'القيد مطبّق — الحكم للمضيف' };

    // Team nominates its answerer before seeing the question.
    case 5:
      return outcome.kind === 'select'
        ? { deltas: [], restrictAnswerTo: outcome.participantId, notice: 'هذا اللاعب هو الوحيد اللي يجاوب' }
        : EMPTY_EFFECTS;

    // Physical challenges — paid out regardless of the answer.
    case 6:
    case 7:
    case 16:
      return outcome.kind === 'done'
        ? { deltas: [{ participantId: active, amount }], notice: `+${amount} نقطة على التحدي` }
        : EMPTY_EFFECTS;

    // Outside help — allowed, no score movement of its own.
    case 9:
    case 17:
      return { deltas: [], notice: 'تم استخدام المساعدة' };

    // "No alif" — host judges violations.
    case 10:
      return { deltas: [], notice: 'ممنوع حرف الألف — الحكم للمضيف' };

    // A rival grabbed the question after the silence window.
    case 11:
      return outcome.kind === 'select'
        ? { deltas: [], restrictAnswerTo: outcome.participantId, notice: 'تم خطف السؤال' }
        : EMPTY_EFFECTS;

    // Thumb wrestle — winner takes the bounty.
    case 12:
      return outcome.kind === 'select'
        ? { deltas: [{ participantId: outcome.participantId, amount }], notice: `+${amount} للفائز` }
        : EMPTY_EFFECTS;

    // Sacrifice a player for two turns.
    case 18:
      return outcome.kind === 'select'
        ? {
            deltas: [],
            sacrifice: { participantId: outcome.participantId, turns: 2 },
            notice: 'اللاعب خارج الدورين الجايين',
          }
        : EMPTY_EFFECTS;

    // RPS before reveal — the winner is remembered and settled at scoring.
    case 19:
      return outcome.kind === 'select' ? { deltas: [], notice: 'نتيجة الجولة محفوظة' } : EMPTY_EFFECTS;

    default:
      return EMPTY_EFFECTS;
  }
}

/**
 * Applied once "من جاوب؟" resolves. `answeredById` is null when nobody scored.
 * `resolution` is whatever the pre-reveal popup returned, for rules whose
 * payout depends on both the duel result and the answer (rule 19).
 */
export function scoringAdjustment(
  rule: RuleDefinition | null,
  resolution: RuleOutcome | null,
  ctx: RuleContext,
  answeredById: string | null,
  isPartial: boolean
): ScoringAdjustment {
  const base: ScoringAdjustment = { suppressQuestionPoints: false, deltas: [] };
  if (!rule) return base;

  const active = ctx.activeParticipantId;
  const amount = rule.amount ?? 0;
  const opponents = opponentsOf(ctx);

  switch (rule.id) {
    // Wrong answer costs a flat 200.
    case 2:
      return answeredById === null
        ? { ...base, deltas: [{ participantId: active, amount: -amount }], notice: `-${amount} إجابة خاطئة` }
        : base;

    // Nobody on turn knew it but a rival did — rival banks 100.
    case 3:
      return answeredById !== null && answeredById !== active
        ? { ...base, deltas: [{ participantId: answeredById, amount }], notice: `+${amount} للخصم` }
        : base;

    // Correct answer earns nothing but drains every opponent.
    case 14:
      return answeredById !== null
        ? {
            suppressQuestionPoints: true,
            deltas: opponents.map((id) => ({ participantId: id, amount: -amount })),
            notice: `-${amount} من كل خصم`,
          }
        : base;

    // RPS: winning then answering right scores nothing; winning then missing costs 100.
    case 19: {
      const wonDuel = resolution?.kind === 'select' && resolution.participantId === active;
      if (!wonDuel) return base;
      return answeredById !== null
        ? { ...base, suppressQuestionPoints: true, notice: 'فزت بالجولة — بدون نقاط' }
        : { ...base, deltas: [{ participantId: active, amount: -amount }], notice: `-${amount}` };
    }

    // Partial credit is a host judgement call surfaced as its own button.
    case 24:
      return isPartial && answeredById !== null
        ? {
            suppressQuestionPoints: true,
            deltas: [{ participantId: answeredById, amount: Math.round(ctx.questionPoints / 2) }],
            notice: 'إجابة جزئية — نصف النقاط',
          }
        : base;

    default:
      return base;
  }
}

/** Whether this rule opens a popup after the answer is settled. */
export function needsPostAnswerPopup(
  rule: RuleDefinition | null,
  answeredById: string | null
): boolean {
  if (!rule || rule.timing !== 'post_answer') return false;
  switch (rule.id) {
    case 13: // pick the opponent's next category
    case 25: // record a repeated violation
      return true;
    case 20: // only fires on a 2-answer streak — the store gates this
    case 28: // reward for a correct answer
    case 30: // RPS after a correct answer
      return answeredById !== null;
    case 26: // punishment for a miss
    case 27:
      return answeredById === null;
    default:
      return false;
  }
}

export function resolvePostAnswer(
  rule: RuleDefinition,
  outcome: RuleOutcome,
  ctx: RuleContext,
  earnedAmount: number
): RuleEffects {
  const active = ctx.activeParticipantId;

  switch (rule.id) {
    // Winner of the chase takes back what the active player just earned.
    case 30:
      if (outcome.kind === 'select' && outcome.participantId === active && earnedAmount > 0) {
        const target = opponentsOf(ctx)[0];
        return target
          ? { deltas: [{ participantId: target, amount: -earnedAmount }], notice: `-${earnedAmount} من الخصم` }
          : EMPTY_EFFECTS;
      }
      return EMPTY_EFFECTS;

    // Everything else here is an instruction the host carries out at the table.
    default:
      return { deltas: [], notice: 'تم' };
  }
}
