import { describe, expect, it } from "vitest";
import { CORE_QUESTIONS } from "../../prisma/seed/questions.core";
import { BRANCH_QUESTIONS } from "../../prisma/seed/questions.branch";
import type { QuestionSeed } from "../../prisma/seed/types";
import { Q } from "./questionKeys";
import { QUESTION_CATEGORY_ORDER } from "./diagnosis/categoryMap";
import type { BusinessType, QuestionSpec, VisibilityRule } from "./types";
import { buildContext, processBriefing } from "./index";
import { resolveVisibility } from "./visibility";

/**
 * Tests on the REAL catalog that goes into the database.
 *
 * `visibility.test.ts` and `rules.test.ts` use artificial catalogs to isolate
 * behavior. These check the actual data: a rule pointing to a key that
 * doesn't exist breaks nothing at runtime — the question just silently never
 * appears. It's the kind of defect that would only show up in a real
 * briefing, with the client on the other side.
 */

const ALL: QuestionSeed[] = [...CORE_QUESTIONS, ...BRANCH_QUESTIONS];
const ALL_KEYS = new Set(ALL.map((q) => q.key));

/** Reproduces the `order` assignment done by the seed. */
function toSpecs(): QuestionSpec[] {
  return ALL.map((q, index) => ({
    key: q.key,
    category: q.category,
    answerType: q.answerType,
    required: q.required ?? false,
    order: (index + 1) * 10,
    visibilityRule: q.visibilityRule ?? null,
  }));
}

/** Every key referenced by a rule, recursively. */
function referencedKeys(rule: VisibilityRule): string[] {
  if ("all" in rule) return rule.all.flatMap(referencedKeys);
  if ("any" in rule) return rule.any.flatMap(referencedKeys);
  if ("not" in rule) return referencedKeys(rule.not);
  return rule.field.startsWith("answer:")
    ? [rule.field.slice("answer:".length)]
    : [];
}

describe("catalog integrity", () => {
  it("has 30 fixed and 21 branch questions", () => {
    expect(CORE_QUESTIONS).toHaveLength(30);
    expect(BRANCH_QUESTIONS).toHaveLength(21);
  });

  it("doesn't repeat keys", () => {
    const keys = ALL.map((q) => q.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses only keys declared in questionKeys.ts", () => {
    const declared = new Set<string>(Object.values(Q));
    for (const question of ALL) {
      expect(declared, `chave não declarada: ${question.key}`).toContain(
        question.key,
      );
    }
  });

  it("declares every questionKeys.ts key in the catalog", () => {
    for (const key of Object.values(Q)) {
      expect(ALL_KEYS, `chave sem pergunta: ${key}`).toContain(key);
    }
  });

  it("uses only known categories", () => {
    for (const question of ALL) {
      expect(QUESTION_CATEGORY_ORDER).toContain(question.category);
    }
  });

  it("offers options only on choice questions, and never omits them", () => {
    for (const question of ALL) {
      const isChoice =
        question.answerType === "single_choice" ||
        question.answerType === "multi_choice";

      if (isChoice) {
        expect(
          question.options?.length ?? 0,
          `${question.key} é de escolha e precisa de opções`,
        ).toBeGreaterThan(1);
      } else {
        expect(
          question.options,
          `${question.key} não é de escolha e não deveria ter opções`,
        ).toBeUndefined();
      }
    }
  });

  it("doesn't repeat values within the same question", () => {
    for (const question of ALL) {
      const values = (question.options ?? []).map((o) => o.value);
      expect(new Set(values).size, `opções repetidas em ${question.key}`).toBe(
        values.length,
      );
    }
  });

  it("references only existing questions in visibility rules", () => {
    for (const question of ALL) {
      if (!question.visibilityRule) continue;
      for (const key of referencedKeys(question.visibilityRule)) {
        expect(ALL_KEYS, `${question.key} referencia ${key}, que não existe`).toContain(
          key,
        );
      }
    }
  });

  it("references only EARLIER questions in visibility rules", () => {
    // Visibility resolution is single-pass: a rule pointing to a later
    // question would never be satisfied.
    const position = new Map(ALL.map((q, i) => [q.key, i]));

    for (const question of ALL) {
      if (!question.visibilityRule) continue;
      const self = position.get(question.key) as number;
      for (const key of referencedKeys(question.visibilityRule)) {
        expect(
          position.get(key) as number,
          `${question.key} depende de ${key}, que vem depois dela`,
        ).toBeLessThan(self);
      }
    }
  });

  it("keeps branch questions optional", () => {
    // Required and invisible for other business types would leave the
    // category gray with nothing the client could do about it.
    for (const question of BRANCH_QUESTIONS) {
      expect(question.required ?? false, `${question.key} não deveria ser obrigatória`).toBe(
        false,
      );
    }
  });

  it("gives every branch question a visibility rule", () => {
    for (const question of BRANCH_QUESTIONS) {
      expect(question.visibilityRule, `${question.key} sem regra`).toBeDefined();
    }
  });
});

describe("visibility on the real catalog", () => {
  const specs = toSpecs();

  const BUSINESS_TYPES: BusinessType[] = [
    "local_business",
    "ecommerce",
    "info_product",
    "freelancer",
    "b2b_service",
    "other",
  ];

  it("shows the 30 fixed questions for any business type", () => {
    for (const businessType of BUSINESS_TYPES) {
      const visible = resolveVisibility(
        buildContext({
          businessType,
          questions: specs,
          answers: [
            { id: "a1", questionKey: Q.BUSINESS_TYPE, value: businessType },
          ],
        }),
      );

      for (const question of CORE_QUESTIONS) {
        // `posting_frequency` depends on a channel being checked.
        if (question.key === Q.POSTING_FREQUENCY) continue;
        expect(visible, `${question.key} sumiu para ${businessType}`).toContain(
          question.key,
        );
      }
    }
  });

  it("shows each business type only its own branch", () => {
    const expectedCounts: Record<string, number> = {
      local_business: 5,
      ecommerce: 4,
      info_product: 4,
      freelancer: 4,
      b2b_service: 4,
      other: 0,
    };

    for (const businessType of BUSINESS_TYPES) {
      const visible = resolveVisibility(
        buildContext({
          businessType,
          questions: specs,
          answers: [
            { id: "a1", questionKey: Q.BUSINESS_TYPE, value: businessType },
          ],
        }),
      );

      const branchVisible = BRANCH_QUESTIONS.filter((q) => visible.has(q.key));
      expect(branchVisible, `ramificação errada para ${businessType}`).toHaveLength(
        expectedCounts[businessType],
      );
    }
  });

  it("unlocks posting frequency only after a channel is checked", () => {
    const base = {
      businessType: "local_business" as const,
      questions: specs,
    };

    const semCanal = resolveVisibility(
      buildContext({ ...base, answers: [] }),
    );
    expect(semCanal.has(Q.POSTING_FREQUENCY)).toBe(false);

    const comCanal = resolveVisibility(
      buildContext({
        ...base,
        answers: [
          { id: "a1", questionKey: Q.ACTIVE_CHANNELS, value: ["instagram"] },
        ],
      }),
    );
    expect(comCanal.has(Q.POSTING_FREQUENCY)).toBe(true);
  });
});

describe("full engine on the real catalog", () => {
  const specs = toSpecs();

  it("an empty briefing turns gray every category that has a required question", () => {
    const { diagnoses } = processBriefing(
      buildContext({ businessType: null, questions: specs, answers: [] }),
    );
    const byCategory = Object.fromEntries(
      diagnoses.map((d) => [d.category, d]),
    );

    for (const category of [
      "positioning",
      "audience",
      "offer",
      "current_marketing",
    ] as const) {
      expect(byCategory[category].status, category).toBe("gray");
      expect(byCategory[category].score, category).toBeNull();
    }

    // `digital_presence` is the exception: in the current catalog it has no
    // required question, so it never turns gray — with no answers there's no
    // signal to detect either, and it stays green. That's correct, but worth
    // knowing that "green" here means "nothing to point out", not "well
    // handled". Making any question in the block required would change that,
    // and this test would break to warn us.
    expect(byCategory.digital_presence.status).toBe("green");
    expect(byCategory.digital_presence.score).toBe(100);
  });

  it("a vague briefing fires the expected signals", () => {
    const answers = [
      { id: "1", questionKey: Q.BUSINESS_NAME, value: "Doce Vida" },
      { id: "2", questionKey: Q.BUSINESS_DESCRIPTION, value: "Faço bolos" },
      { id: "3", questionKey: Q.BUSINESS_TYPE, value: "local_business" },
      { id: "4", questionKey: Q.BUSINESS_AGE, value: "1_a_3_anos" },
      { id: "5", questionKey: Q.PRODUCTS_SERVICES, value: "Bolos e doces" },
      { id: "6", questionKey: Q.DIFFERENTIATOR, value: "Qualidade e bom atendimento" },
      { id: "7", questionKey: Q.MARKETING_REASON, value: "As vendas caíram muito" },
      { id: "8", questionKey: Q.SUCCESS_6_MONTHS, value: "Quero crescer" },
      { id: "9", questionKey: Q.CLOSEST_GOAL, value: "vendas" },
      { id: "10", questionKey: Q.MAIN_PAIN, value: "Ninguém me acha" },
      { id: "11", questionKey: Q.IDEAL_CLIENT, value: "Todo mundo" },
      { id: "12", questionKey: Q.AUDIENCE_PAIN, value: "Querem doce bom" },
      { id: "13", questionKey: Q.CURRENT_PERCEPTION, value: "Padaria simples de bairro" },
      { id: "14", questionKey: Q.DESIRED_PERCEPTION, value: "Confeitaria autoral sofisticada" },
      { id: "15", questionKey: Q.MAIN_OFFER, value: "Bolo de festa" },
    ];

    const { signals, diagnoses } = processBriefing(
      buildContext({
        businessType: "local_business",
        questions: specs,
        answers,
      }),
    );

    const codes = signals.map((s) => s.code).sort();
    expect(codes).toEqual(
      [
        "broad_audience",
        "generic_differentiator",
        "goal_behavior_contradiction",
        "positioning_gap",
        "unclear_conversion",
        "vague_goal",
      ].sort(),
    );

    const byCategory = Object.fromEntries(
      diagnoses.map((d) => [d.category, d]),
    );

    // positioning: generic_differentiator + positioning_gap = 100 − 50
    expect(byCategory.positioning.score).toBe(50);
    expect(byCategory.positioning.status).toBe("yellow");

    // audience: broad_audience (strong) = 100 − 40
    expect(byCategory.audience.score).toBe(60);

    // current_marketing: vague_goal + goal_behavior_contradiction = 100 − 80
    expect(byCategory.current_marketing.score).toBe(20);
    expect(byCategory.current_marketing.status).toBe("red");

    // digital_presence has no required questions and fired no signal.
    expect(byCategory.digital_presence.status).toBe("green");
  });

  it("a well-filled briefing fires no signal at all", () => {
    const answers = [
      { id: "1", questionKey: Q.BUSINESS_NAME, value: "Doce Vida" },
      {
        id: "2",
        questionKey: Q.BUSINESS_DESCRIPTION,
        value: "Confeitaria artesanal especializada em bolos de casamento",
      },
      { id: "3", questionKey: Q.BUSINESS_TYPE, value: "local_business" },
      { id: "4", questionKey: Q.BUSINESS_AGE, value: "mais_3_anos" },
      {
        id: "5",
        questionKey: Q.PRODUCTS_SERVICES,
        value: "Bolos de casamento, mesa de doces e degustação para noivos",
      },
      {
        id: "6",
        questionKey: Q.DIFFERENTIATOR,
        value:
          "Sou a única confeiteira da região que faz degustação guiada com harmonização de vinhos e entrega montagem no local",
      },
      {
        id: "7",
        questionKey: Q.MARKETING_REASON,
        value: "Quero depender menos de indicação e ter previsibilidade de agenda",
      },
      {
        id: "8",
        questionKey: Q.SUCCESS_6_MONTHS,
        value: "Fechar 12 casamentos por semestre com ticket acima de 4 mil reais",
      },
      { id: "9", questionKey: Q.CLOSEST_GOAL, value: "leads" },
      {
        id: "10",
        questionKey: Q.MAIN_PAIN,
        value: "Recebo muita mensagem de curioso que some quando vê o preço",
      },
      {
        id: "11",
        questionKey: Q.IDEAL_CLIENT,
        value:
          "Noivas entre 28 e 38 anos da zona sul que planejam casamento intimista e valorizam confeitaria artesanal acima de preço baixo",
      },
      {
        id: "12",
        questionKey: Q.AUDIENCE_PAIN,
        value: "Medo de que o bolo do casamento não seja bonito nem gostoso",
      },
      {
        id: "13",
        questionKey: Q.CURRENT_PERCEPTION,
        value: "Uma confeitaria artesanal cara e boa, conhecida por indicação",
      },
      {
        id: "14",
        questionKey: Q.DESIRED_PERCEPTION,
        value: "A confeitaria artesanal de referência para casamentos na região",
      },
      { id: "15", questionKey: Q.MAIN_OFFER, value: "Pacote de bolo de casamento" },
      {
        id: "16",
        questionKey: Q.PURCHASE_PROCESS,
        value:
          "A noiva chama no WhatsApp, agendo degustação no ateliê, envio proposta em 48 horas e fecho com 30% de sinal por pix",
      },
      { id: "17", questionKey: Q.ACTIVE_CHANNELS, value: ["instagram", "site"] },
      { id: "18", questionKey: Q.POSTING_FREQUENCY, value: "semanal" },
      {
        id: "19",
        questionKey: Q.PAID_TRAFFIC,
        value: "Investi R$ 800 em anúncio e vieram 15 orçamentos",
      },
      {
        id: "20",
        questionKey: Q.WHAT_WORKED,
        value: "Stories de bastidores com chamada para agendar degustação",
      },
    ];

    const { signals, diagnoses } = processBriefing(
      buildContext({
        businessType: "local_business",
        questions: specs,
        answers,
      }),
    );

    expect(signals).toEqual([]);
    expect(diagnoses.every((d) => d.status === "green")).toBe(true);
    expect(diagnoses.every((d) => d.score === 100)).toBe(true);
  });
});
