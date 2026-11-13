/**
 * Conditional visibility engine — data-driven.
 *
 * There is no `if (businessType === "local_business")` here or anywhere else
 * in the code: each question's display condition lives in the
 * `questions.visibilityRule` (JSON) column. Adding or editing a branch is a
 * data change, not a code change, and needs no deploy.
 */

import type {
  AnswerValue,
  EvalContext,
  FieldRule,
  QuestionSpec,
  VisibilityRule,
} from "./types";
import { isBlank, normalize, valueToText } from "./text";

const BUSINESS_TYPE_FIELD = "business_type";
const ANSWER_FIELD_PREFIX = "answer:";

/**
 * Evaluates a rule. A missing rule (`null`/`undefined`) = always visible — the
 * case for the fixed core questions.
 */
export function evaluateRule(
  rule: VisibilityRule | null | undefined,
  ctx: VisibilityContext,
): boolean {
  if (rule == null) return true;

  if ("all" in rule) {
    return rule.all.every((sub) => evaluateRule(sub, ctx));
  }
  if ("any" in rule) {
    return rule.any.some((sub) => evaluateRule(sub, ctx));
  }
  if ("not" in rule) {
    return !evaluateRule(rule.not, ctx);
  }
  return evaluateFieldRule(rule, ctx);
}

/**
 * The subset of the context visibility needs. Typed separately because
 * `resolveVisibility` evaluates against a *filtered* set of answers, not the
 * raw context.
 */
export interface VisibilityContext {
  businessType: string | null;
  /** Values by `questionKey`. Missing = unanswered. */
  values: Record<string, AnswerValue | undefined>;
}

function evaluateFieldRule(rule: FieldRule, ctx: VisibilityContext): boolean {
  const actual = resolveField(rule.field, ctx);

  switch (rule.operator) {
    case "not_empty":
      return !isBlank(actual);
    case "is_empty":
      return isBlank(actual);
    case "equals":
      return asList(actual).some((v) => v === normalizeScalar(rule.value));
    case "not_equals":
      return !asList(actual).some((v) => v === normalizeScalar(rule.value));
    case "in":
      return asList(actual).some((v) => asRuleList(rule.value).includes(v));
    case "not_in":
      return !asList(actual).some((v) => asRuleList(rule.value).includes(v));
    case "contains_any": {
      // Substring search in the flattened text — meant for free-text answers,
      // unlike `in`, which compares whole options.
      const haystack = normalize(valueToText(actual));
      if (!haystack) return false;
      return asRuleList(rule.value).some(
        (term) => term !== "" && haystack.includes(term),
      );
    }
    default: {
      // Unknown operator (rule stored by a future version): hiding is safer
      // than showing a question out of context.
      return false;
    }
  }
}

function resolveField(
  field: string,
  ctx: VisibilityContext,
): AnswerValue | undefined {
  if (field === BUSINESS_TYPE_FIELD) {
    return ctx.businessType ?? undefined;
  }
  if (field.startsWith(ANSWER_FIELD_PREFIX)) {
    return ctx.values[field.slice(ANSWER_FIELD_PREFIX.length)];
  }
  return undefined;
}

/** An answer's normalized values, for equality comparison. */
function asList(value: AnswerValue | undefined): string[] {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((v) => normalize(v));
}

/** The rule's `value`, accepted as a scalar or a list. */
function asRuleList(value: unknown): string[] {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map(normalizeScalar);
}

function normalizeScalar(value: unknown): string {
  return normalize(String(value ?? ""));
}

/**
 * Resolves which questions are visible, in a single pass in catalog order.
 *
 * Two important properties:
 *
 * 1. **An invisible question's answer doesn't count.** Consider: the client
 *    picks `local_business`, answers "in-person service?", then goes back and
 *    switches to `ecommerce`. The old answer is still in the database, but the
 *    question became invisible — and a rule depending on it would see a ghost
 *    value. Here it's treated as missing.
 *
 * 2. **A rule only sees earlier questions** in the ordering. That makes
 *    resolution deterministic and single-pass, and mirrors the real flow: the
 *    form is filled top to bottom, so conditioning display on an answer that
 *    hasn't even been asked yet makes no sense. An alternative would be to
 *    iterate to a fixed point, but mutually dependent rules (A visible if B is
 *    empty, B visible if A is empty) would oscillate without converging.
 */
export function resolveVisibility(ctx: EvalContext): Set<string> {
  const ordered = [...ctx.questions].sort((a, b) => a.order - b.order);
  const visible = new Set<string>();

  // Accumulates only values already released by earlier visible questions.
  const values: Record<string, AnswerValue | undefined> = {};
  const visibilityCtx: VisibilityContext = {
    businessType: ctx.businessType,
    values,
  };

  for (const question of ordered) {
    if (!evaluateRule(question.visibilityRule, visibilityCtx)) continue;

    visible.add(question.key);

    const answer = ctx.answersByKey[question.key];
    if (answer && !isBlank(answer.value)) {
      values[question.key] = answer.value;
    }
  }

  return visible;
}

/** The visible questions, in catalog order. */
export function visibleQuestions(ctx: EvalContext): QuestionSpec[] {
  const visible = resolveVisibility(ctx);
  return ctx.questions
    .filter((q) => visible.has(q.key))
    .sort((a, b) => a.order - b.order);
}
