/**
 * The 30 twist cards (PRD §6).
 *
 * `type` picks which popup template renders the card's buttons, `tone` picks
 * its color (🔴 penalty / 🟢 bonus / 🔵 control), and `timing` decides when in
 * the turn the card demands an interaction.
 */

export type RuleType =
  | 'auto' // 🔢 system handles it, no buttons
  | 'physical' // 💪 ✅ فعلت / ❌ لم أفعل
  | 'hand_slap' // 👋 تم / لم يتم
  | 'steal' // ⚡ خطف السؤال
  | 'duel' // 🤜 winner per participant
  | 'who_answers' // 👤 restriction / pick a player
  | 'external' // 📞 outside help, sometimes timed
  | 'control'; // ⚙️ round control

export type RuleTone = 'red' | 'green' | 'blue';

export type RuleTiming =
  /** Resolved before the answer is revealed. */
  | 'pre_reveal'
  /** Lives on the question screen while the clock runs (the steal). */
  | 'in_question'
  /** Resolved after "من جاوب؟" is answered. */
  | 'post_answer'
  /** No popup — applied automatically by the engine or a tracker. */
  | 'passive';

export interface RuleDefinition {
  id: number;
  text: string;
  type: RuleType;
  tone: RuleTone;
  timing: RuleTiming;
  /** Runs the popup's own countdown, in seconds (rules 16, 17, 22). */
  timerSec?: number;
  /** Points the rule itself moves, separate from the question's value. */
  amount?: number;
}

export const RULES: RuleDefinition[] = [
  {
    id: 1,
    text: 'الخصم يتطوّع لضربة كف قبل كشف الإجابة — إذا تمّت، ياخذ نقاط السؤال',
    type: 'hand_slap',
    tone: 'red',
    timing: 'pre_reveal',
  },
  {
    id: 2,
    text: 'إجابة خاطئة = خصم 200 نقطة',
    type: 'auto',
    tone: 'red',
    timing: 'passive',
    amount: 200,
  },
  {
    id: 3,
    text: 'ما عرفت الإجابة والخصم جاوبها = +100 نقطة للخصم',
    type: 'auto',
    tone: 'green',
    timing: 'passive',
    amount: 100,
  },
  {
    id: 4,
    text: 'أصغر لاعب بالعمر هو الوحيد اللي يقدر يجاوب',
    type: 'who_answers',
    tone: 'red',
    timing: 'pre_reveal',
  },
  {
    id: 5,
    text: 'الفريق يختار لاعب واحد يجاوب — قبل ما يشوفوا السؤال',
    type: 'who_answers',
    tone: 'blue',
    timing: 'pre_reveal',
  },
  {
    id: 6,
    text: 'سوِّ 5 ضغطات وخذ +200 نقطة، سواء جاوبت صح أو غلط',
    type: 'physical',
    tone: 'green',
    timing: 'pre_reveal',
    amount: 200,
  },
  {
    id: 7,
    text: 'سوِّ 15 ضغطة وخذ +200 نقطة، سواء جاوبت صح أو غلط',
    type: 'physical',
    tone: 'green',
    timing: 'pre_reveal',
    amount: 200,
  },
  {
    id: 8,
    text: 'أقصر لاعب هو الوحيد اللي يقدر يجاوب',
    type: 'who_answers',
    tone: 'red',
    timing: 'pre_reveal',
  },
  {
    id: 9,
    text: 'تقدر تسأل أحد المتفرجين يساعدك',
    type: 'external',
    tone: 'green',
    timing: 'pre_reveal',
  },
  {
    id: 10,
    text: 'ممنوع تنطق حرف الألف "ا" في إجابتك',
    type: 'control',
    tone: 'red',
    timing: 'pre_reveal',
  },
  {
    id: 11,
    text: 'الخصم يقدر يخطف السؤال بعد 10 ثواني صمت',
    type: 'steal',
    tone: 'blue',
    timing: 'in_question',
  },
  {
    id: 12,
    text: 'مصارعة إبهام قبل الكشف — الفائز ياخذ +200 نقطة',
    type: 'duel',
    tone: 'green',
    timing: 'pre_reveal',
    amount: 200,
  },
  {
    id: 13,
    text: 'إنت اللي تختار فئة السؤال القادم للخصم',
    type: 'control',
    tone: 'blue',
    timing: 'post_answer',
  },
  {
    id: 14,
    text: 'إذا جاوبت صح: ما تاخذ نقاط، لكن تخصم 200 من الخصم',
    type: 'auto',
    tone: 'green',
    timing: 'passive',
    amount: 200,
  },
  {
    id: 15,
    text: 'أكبر لاعب بالعمر هو الوحيد اللي يقدر يجاوب',
    type: 'who_answers',
    tone: 'red',
    timing: 'pre_reveal',
  },
  {
    id: 16,
    text: 'بلانك 20 ثانية وخذ +200 نقطة، سواء جاوبت صح أو غلط',
    type: 'physical',
    tone: 'green',
    timing: 'pre_reveal',
    timerSec: 20,
    amount: 200,
  },
  {
    id: 17,
    text: 'اتصل بأي شخص واستعن فيه — عندك دقيقة وحدة',
    type: 'external',
    tone: 'green',
    timing: 'pre_reveal',
    timerSec: 60,
  },
  {
    id: 18,
    text: 'ضحِّ بلاعب لدورين وخذ الإجابة مع الخصم — إذا كسبت +100 نقطة',
    type: 'external',
    tone: 'green',
    timing: 'pre_reveal',
    amount: 100,
  },
  {
    id: 19,
    text: 'حجرة ورقة مقص قبل الكشف: فزت وجاوبت صح = بدون نقاط، فزت وجاوبت غلط = -100',
    type: 'duel',
    tone: 'red',
    timing: 'pre_reveal',
    amount: 100,
  },
  {
    id: 20,
    text: 'جاوبت صح مرتين متتاليتين؟ اختر عقوبة خفيفة للخصم',
    type: 'control',
    tone: 'green',
    timing: 'post_answer',
  },
  {
    id: 21,
    text: 'كل إجابة خاطئة = نقطة خسارة، وعند 3 نقاط: 10 قفزات سكوات',
    type: 'physical',
    tone: 'red',
    timing: 'passive',
  },
  {
    id: 22,
    text: 'كل 10 أسئلة: صاحب أقل نقاط يسوي بلانك 30 ثانية',
    type: 'control',
    tone: 'blue',
    timing: 'passive',
    timerSec: 30,
  },
  {
    id: 23,
    text: 'اللي جاوب هالجولة ما يقدر يجاوب الجولة الجاية',
    type: 'control',
    tone: 'red',
    timing: 'passive',
  },
  {
    id: 24,
    text: 'إجابة جزئية = نصف النقاط (بالاتفاق بينكم)',
    type: 'auto',
    tone: 'blue',
    timing: 'passive',
  },
  {
    id: 25,
    text: 'إذا كسرت نفس القانون مرتين: توقيف مؤقت الجولة الجاية',
    type: 'control',
    tone: 'red',
    timing: 'post_answer',
  },
  {
    id: 26,
    text: 'إجابة خاطئة: بدّل لاعب مع الفريق الخصم',
    type: 'control',
    tone: 'red',
    timing: 'post_answer',
  },
  {
    id: 27,
    text: 'إجابة خاطئة: قف على رجل وحدة في الزاوية',
    type: 'physical',
    tone: 'red',
    timing: 'post_answer',
  },
  {
    id: 28,
    text: 'إجابة صحيحة: إنت اللي تختار فئة السؤال الجاي',
    type: 'control',
    tone: 'green',
    timing: 'post_answer',
  },
  {
    id: 29,
    text: 'خذ 200 نقطة مباشرة',
    type: 'auto',
    tone: 'green',
    timing: 'passive',
    amount: 200,
  },
  {
    id: 30,
    text: 'بعد إجابة صحيحة: حجرة ورقة مقص ضد الفريق التالي — إذا فزت تخصم منهم النقاط اللي كسبتها',
    type: 'duel',
    tone: 'green',
    timing: 'post_answer',
  },
];

export const RULES_BY_ID: Record<number, RuleDefinition> = Object.fromEntries(
  RULES.map((rule) => [rule.id, rule])
);

export const RULE_TONE_COLORS: Record<RuleTone, string> = {
  red: '#E5584D',
  green: '#3FBE7A',
  blue: '#4C8DFF',
};

export const RULE_TYPE_ICONS: Record<RuleType, string> = {
  auto: '🔢',
  physical: '💪',
  hand_slap: '👋',
  steal: '⚡',
  duel: '🤜',
  who_answers: '👤',
  external: '📞',
  control: '⚙️',
};
