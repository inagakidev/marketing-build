import { prisma } from "./db";
import { buildSteps, type EvalContext, type FormStep } from "@/core";
import { valueToText } from "@/core/text";

/**
 * Payload do formulário público: etapas, perguntas e respostas já salvas.
 *
 * Contém apenas o que a tela precisa desenhar. Nada de diagnóstico, sinais ou
 * dados do cliente — este payload vai para quem tem o token, não para a
 * administradora.
 */

export interface PublicQuestion {
  key: string;
  text: string;
  helpText: string | null;
  answerType: string;
  required: boolean;
  options: { value: string; label: string }[] | null;
  /** Resposta já gravada, se houver. */
  value: string | string[] | null;
}

export interface PublicForm {
  steps: FormStep[];
  questions: PublicQuestion[];
  /** Chaves obrigatórias ainda sem resposta — o front usa para o passo final. */
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
