/**
 * Rules engine types.
 *
 * GOLDEN RULE: nothing in `src/core` imports Next, Prisma or Supabase. The
 * engine takes plain objects and returns plain objects. That's what lets us
 * test it without a database and keeps business logic independent of the
 * persistence layer.
 *
 * The union types below mirror the Prisma enums on purpose instead of
 * importing them: core must not depend on the generated client. The
 * `enums.test.ts` test guarantees the two sets don't drift apart.
 */

export type QuestionCategory =
  | "business"
  | "goals"
  | "audience"
  | "brand"
  | "competition"
  | "digital_presence"
  | "offer"
  | "closing";

export type DiagnosisCategory =
  | "positioning"
  | "audience"
  | "offer"
  | "digital_presence"
  | "current_marketing";

export type AnswerType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multi_choice";

export type BusinessType =
  | "local_business"
  | "ecommerce"
  | "info_product"
  | "freelancer"
  | "b2b_service"
  | "other";

export type SignalSeverity = "light" | "moderate" | "strong";

export type DiagnosisStatus = "green" | "yellow" | "red" | "gray";

/** Text and single_choice store a string; multi_choice stores string[]. */
export type AnswerValue = string | string[];

/** A `single_choice`/`multi_choice` option, as stored in the `options` (JSON) column. */
export interface QuestionOption {
  value: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Conditional visibility
// ---------------------------------------------------------------------------

export type ComparisonOperator =
  | "equals"
  | "not_equals"
  | "in"
  | "not_in"
  | "contains_any"
  | "not_empty"
  | "is_empty";

/**
 * `field` accepts two forms:
 * - `"business_type"` — the briefing's business type (a shortcut, since it's
 *   the branching question and is denormalized onto Briefing).
 * - `"answer:<questionKey>"` — the value of another question's answer.
 *
 * Questions are referenced by `key` (a stable slug), never by database `id`:
 * ids change on every re-seed and would break the stored rules.
 */
export interface FieldRule {
  field: string;
  operator: ComparisonOperator;
  value?: unknown;
}

export interface AllRule {
  all: VisibilityRule[];
}

export interface AnyRule {
  any: VisibilityRule[];
}

export interface NotRule {
  not: VisibilityRule;
}

export type VisibilityRule = FieldRule | AllRule | AnyRule | NotRule;

// ---------------------------------------------------------------------------
// Engine input
// ---------------------------------------------------------------------------

/** A question as the engine sees it — no persistence fields. */
export interface QuestionSpec {
  key: string;
  category: QuestionCategory;
  answerType: AnswerType;
  required: boolean;
  order: number;
  visibilityRule?: VisibilityRule | null;
}

/** An answer as the engine sees it. */
export interface AnswerRecord {
  /** `Answer.id` in the database — propagated into `sourceAnswerIds`. */
  id: string;
  questionKey: string;
  value: AnswerValue;
}

export interface EvalContext {
  businessType: BusinessType | null;
  questions: QuestionSpec[];
  answersByKey: Record<string, AnswerRecord>;
}

// ---------------------------------------------------------------------------
// Engine output
// ---------------------------------------------------------------------------

/** What a rule returns when it fires. */
export interface SignalRuleHit {
  description: string;
  sourceAnswerIds: string[];
}

/**
 * A signal rule. `evaluate` is a pure function: same input, same output, no
 * side effects.
 */
export interface SignalRule {
  code: string;
  category: DiagnosisCategory;
  severity: SignalSeverity;
  evaluate: (ctx: EvalContext) => SignalRuleHit | null;
}

export interface DetectedSignal {
  code: string;
  category: DiagnosisCategory;
  severity: SignalSeverity;
  description: string;
  sourceAnswerIds: string[];
}

export interface CategoryDiagnosis {
  category: DiagnosisCategory;
  /** Null when `status === "gray"`: the category wasn't scored. */
  score: number | null;
  status: DiagnosisStatus;
  signals: DetectedSignal[];
  /** Visible required questions left unanswered. */
  missingRequiredKeys: string[];
}
