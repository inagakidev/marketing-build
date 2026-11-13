import { prisma } from "./db";
import { buildSteps, type EvalContext, type FormStep } from "@/core";
import { valueToText } from "@/core/text";

/**
 * Public form payload: steps, questions and already saved answers.
 *
 * Contains only what the screen needs to draw. No diagnosis, signals or client
 * data — this payload goes to whoever holds the token, not to the admin.
 */

export interface PublicQuestion {
  key: string;
  text: string;
  helpText: string | null;
  answerType: string;
  required: boolean;
  options: { value: string; label: string }[] | null;
  /** Already stored answer, if any. */
  value: string | string[] | null;
}

export interface PublicForm {
  steps: FormStep[];
  questions: PublicQuestion[];
  /** Required keys still unanswered — the frontend uses them for the final step. */
  missingRequiredKeys: string[];
}

export async function buildPublicForm(ctx: EvalContext): Promise<PublicForm> {
  const steps = buildSteps(ctx);
  const visibleKeys = steps.flatMap((s) => s.questionKeys);

  const rows = await prisma.question.findMany({
    where: { key: { in: visibleKeys } },
    select: {
      key: true,
      text: true,
      helpText: true,
      answerType: true,
      required: true,
      options: true,
    },
  });
  const rowByKey = new Map(rows.map((r) => [r.key, r] as const));

  const questions: PublicQuestion[] = visibleKeys.flatMap((key) => {
    const row = rowByKey.get(key);
    if (!row) return [];

    return [
      {
        key: row.key,
        text: row.text,
        helpText: row.helpText,
        answerType: row.answerType,
        required: row.required,
        options: (row.options as PublicQuestion["options"]) ?? null,
        value: ctx.answersByKey[key]?.value ?? null,
      },
    ];
  });

  const missingRequiredKeys = questions
    .filter((q) => q.required)
    .filter((q) => valueToText(q.value).trim() === "")
    .map((q) => q.key);

  return { steps, questions, missingRequiredKeys };
}
