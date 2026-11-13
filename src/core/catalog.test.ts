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
 * Testes sobre o CATÁLOGO REAL que vai para o banco.
 *
 * Os testes de `visibility.test.ts` e `rules.test.ts` usam catálogos
 * artificiais para isolar comportamento. Estes aqui checam o dado de verdade:
 * uma regra apontando para uma chave que não existe não quebra nada em tempo
 * de execução — a pergunta apenas nunca aparece, silenciosamente. É o tipo de
 * defeito que só apareceria num briefing real, com o cliente do outro lado.
 */

const ALL: QuestionSeed[] = [...CORE_QUESTIONS, ...BRANCH_QUESTIONS];
const ALL_KEYS = new Set(ALL.map((q) => q.key));

/** Reproduz a atribuição de `order` feita pelo seed. */
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

/** Todas as chaves referenciadas por uma regra, recursivamente. */
function referencedKeys(rule: VisibilityRule): string[] {
  if ("all" in rule) return rule.all.flatMap(referencedKeys);
  if ("any" in rule) return rule.any.flatMap(referencedKeys);
  if ("not" in rule) return referencedKeys(rule.not);
  return rule.field.startsWith("answer:")
    ? [rule.field.slice("answer:".length)]
    : [];
}

describe("integridade do catálogo", () => {
  it("tem 30 fixas e 21 ramificadas", () => {
    expect(CORE_QUESTIONS).toHaveLength(30);
    expect(BRANCH_QUESTIONS).toHaveLength(21);
  });

  it("não repete chaves", () => {
    const keys = ALL.map((q) => q.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("usa apenas chaves declaradas em questionKeys.ts", () => {
    const declared = new Set<string>(Object.values(Q));
    for (const question of ALL) {
      expect(declared, `chave não declarada: ${question.key}`).toContain(
        question.key,
      );
    }
  });

  it("declara toda chave de questionKeys.ts no catálogo", () => {
    for (const key of Object.values(Q)) {
      expect(ALL_KEYS, `chave sem pergunta: ${key}`).toContain(key);
    }
  });

  it("usa apenas categorias conhecidas", () => {
    for (const question of ALL) {
      expect(QUESTION_CATEGORY_ORDER).toContain(question.category);
    }
  });

  it("só oferece opções em perguntas de escolha, e nunca as omite", () => {
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

  it("não repete valores dentro de uma mesma pergunta", () => {
    for (const question of ALL) {
      const values = (question.options ?? []).map((o) => o.value);
      expect(new Set(values).size, `opções repetidas em ${question.key}`).toBe(
        values.length,
      );
    }
  });

  it("só referencia perguntas que existem nas regras de visibilidade", () => {
    for (const question of ALL) {
      if (!question.visibilityRule) continue;
      for (const key of referencedKeys(question.visibilityRule)) {
        expect(ALL_KEYS, `${question.key} referencia ${key}, que não existe`).toContain(
          key,
        );
      }
    }
  });

  it("só referencia perguntas ANTERIORES nas regras de visibilidade", () => {
    // A resolução de visibilidade é de passada única: uma regra que aponta
    // para uma pergunta posterior nunca seria satisfeita.
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

  it("mantém as ramificadas opcionais", () => {
    // Obrigatória e invisível para os demais tipos de negócio deixaria a
    // categoria cinza sem que o cliente pudesse fazer nada.
    for (const question of BRANCH_QUESTIONS) {
      expect(question.required ?? false, `${question.key} não deveria ser obrigatória`).toBe(
        false,
      );
    }
  });

  it("dá regra de visibilidade a toda pergunta ramificada", () => {
    for (const question of BRANCH_QUESTIONS) {
      expect(question.visibilityRule, `${question.key} sem regra`).toBeDefined();
    }
  });
});

describe("visibilidade sobre o catálogo real", () => {
  const specs = toSpecs();

  const BUSINESS_TYPES: BusinessType[] = [
    "local_business",
    "ecommerce",
    "info_product",
    "freelancer",
    "b2b_service",
    "other",
  ];

  it("mostra as 30 fixas para qualquer tipo de negócio", () => {
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
        // `posting_frequency` depende de haver canal marcado.
        if (question.key === Q.POSTING_FREQUENCY) continue;
        expect(visible, `${question.key} sumiu para ${businessType}`).toContain(
          question.key,
        );
      }
    }
  });

  it("mostra a cada tipo de negócio apenas a sua ramificação", () => {
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

  it("libera a frequência de publicação só depois de marcar um canal", () => {
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

describe("motor completo sobre o catálogo real", () => {
  const specs = toSpecs();

  it("um briefing vazio deixa cinza toda categoria que tem obrigatória", () => {
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

    // `digital_presence` é a exceção: no catálogo atual ela não tem nenhuma
    // pergunta obrigatória, então nunca fica cinza — sem respostas, também não
    // há sinal a detectar, e ela fica verde. É o comportamento correto, mas
    // vale saber que "verde" aqui significa "nada a apontar", não
    // "bem trabalhada". Tornar alguma pergunta do bloco obrigatória mudaria
    // isso, e este teste quebraria para avisar.
    expect(byCategory.digital_presence.status).toBe("green");
    expect(byCategory.digital_presence.score).toBe(100);
  });

  it("um briefing vago dispara os sinais esperados", () => {
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

    // digital_presence não tem obrigatórias e não disparou sinal.
    expect(byCategory.digital_presence.status).toBe("green");
  });

  it("um briefing bem preenchido não dispara sinal nenhum", () => {
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
