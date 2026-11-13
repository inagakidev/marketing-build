/**
 * Tipos do motor de regras.
 *
 * REGRA DE OURO: nada em `src/core` importa Next, Prisma ou Supabase. O motor
 * recebe objetos simples e devolve objetos simples. Isso é o que permite
 * testá-lo sem banco e o que mantém a lógica de negócio independente da
 * camada de persistência.
 *
 * Os union types abaixo espelham os enums do Prisma de propósito, em vez de
 * importá-los: o core não deve depender do client gerado. O teste
 * `enums.test.ts` garante que os dois conjuntos não saiam de sincronia.
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

/** Texto e single_choice guardam string; multi_choice guarda string[]. */
export type AnswerValue = string | string[];

/** Uma opção de `single_choice`/`multi_choice`, como fica na coluna `options` (JSON). */
export interface QuestionOption {
  value: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Visibilidade condicional
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
 * `field` aceita duas formas:
 * - `"business_type"` — o tipo de negócio do briefing (atalho, já que é a
 *   pergunta de ramificação e fica desnormalizada no Briefing).
 * - `"answer:<questionKey>"` — o valor da resposta de outra pergunta.
 *
 * Referenciamos perguntas por `key` (slug estável), nunca por `id` de banco:
 * ids mudam a cada re-seed e quebrariam as regras já gravadas.
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
// Entrada do motor
// ---------------------------------------------------------------------------

/** Uma pergunta como o motor a enxerga — sem campos de persistência. */
export interface QuestionSpec {
  key: string;
  category: QuestionCategory;
  answerType: AnswerType;
  required: boolean;
  order: number;
  visibilityRule?: VisibilityRule | null;
}

/** Uma resposta como o motor a enxerga. */
export interface AnswerRecord {
  /** `Answer.id` no banco — propagado para `sourceAnswerIds`. */
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
// Saída do motor
// ---------------------------------------------------------------------------

/** O que uma regra devolve quando dispara. */
export interface SignalRuleHit {
  description: string;
  sourceAnswerIds: string[];
}

/**
 * Uma regra de sinal. `evaluate` é uma função pura: mesma entrada, mesma
 * saída, sem efeitos colaterais.
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
  /** Null quando `status === "gray"`: a categoria não foi pontuada. */
  score: number | null;
  status: DiagnosisStatus;
  signals: DetectedSignal[];
  /** Perguntas obrigatórias e visíveis que ficaram sem resposta. */
  missingRequiredKeys: string[];
}
