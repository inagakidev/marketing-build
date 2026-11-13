/**
 * Motor de visibilidade condicional — orientado a dados.
 *
 * Não existe nenhum `if (businessType === "local_business")` aqui nem em
 * qualquer outro lugar do código: a condição de exibição de cada pergunta vive
 * na coluna `questions.visibilityRule` (JSON). Adicionar ou editar uma
 * ramificação é uma alteração de dados, não de código, e não exige deploy.
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
 * Avalia uma regra. Regra ausente (`null`/`undefined`) = sempre visível — é o
 * caso das perguntas do núcleo fixo.
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
 * O subconjunto do contexto de que a visibilidade precisa. Tipado à parte
 * porque `resolveVisibility` avalia contra um conjunto de respostas *filtrado*,
 * não contra o contexto bruto.
 */
export interface VisibilityContext {
  businessType: string | null;
  /** Valores por `questionKey`. Ausente = não respondida. */
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
      // Busca por substring no texto achatado — serve para respostas livres,
      // diferente de `in`, que compara opções inteiras.
      const haystack = normalize(valueToText(actual));
      if (!haystack) return false;
      return asRuleList(rule.value).some(
        (term) => term !== "" && haystack.includes(term),
      );
    }
    default: {
      // Operador desconhecido (regra gravada por uma versão futura): esconder é
      // mais seguro do que mostrar uma pergunta fora de contexto.
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

/** Valores normalizados de uma resposta, para comparação de igualdade. */
function asList(value: AnswerValue | undefined): string[] {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((v) => normalize(v));
}

/** O `value` da regra, aceito como escalar ou lista. */
function asRuleList(value: unknown): string[] {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map(normalizeScalar);
}

function normalizeScalar(value: unknown): string {
  return normalize(String(value ?? ""));
}

/**
 * Resolve quais perguntas estão visíveis, em passada única na ordem do
 * catálogo.
 *
 * Duas propriedades importantes:
 *
 * 1. **A resposta de uma pergunta invisível não conta.** Considere: o cliente
 *    marca `local_business`, responde "atende presencial?", depois volta e
 *    troca para `ecommerce`. A resposta antiga continua no banco, mas a
 *    pergunta ficou invisível — e uma regra que dependesse dela passaria a
 *    enxergar um valor fantasma. Aqui ela é tratada como ausente.
 *
 * 2. **Uma regra só enxerga perguntas anteriores** na ordenação. Isso torna a
 *    resolução determinística e de passada única, e reflete o fluxo real: o
 *    formulário é preenchido de cima para baixo, então condicionar a exibição
 *    a uma resposta que ainda nem foi pedida não faria sentido. Uma alternativa
 *    seria iterar até um ponto fixo, mas regras mutuamente dependentes
 *    (A visível se B vazia, B visível se A vazia) oscilariam sem convergir.
 */
export function resolveVisibility(ctx: EvalContext): Set<string> {
  const ordered = [...ctx.questions].sort((a, b) => a.order - b.order);
  const visible = new Set<string>();

  // Acumula apenas os valores já liberados por perguntas visíveis e anteriores.
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

/** As perguntas visíveis, na ordem do catálogo. */
export function visibleQuestions(ctx: EvalContext): QuestionSpec[] {
  const visible = resolveVisibility(ctx);
  return ctx.questions
    .filter((q) => visible.has(q.key))
    .sort((a, b) => a.order - b.order);
}
