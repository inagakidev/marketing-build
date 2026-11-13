import { beforeEach, describe, expect, it } from "vitest";
import { answer, context, question, resetQuestionOrder } from "../testing/fixtures";
import type { DetectedSignal, DiagnosisCategory } from "../types";
import { buildDiagnosis, scoreToStatus, SEVERITY_PENALTY } from "./score";
import { buildSummary } from "./summary";

beforeEach(resetQuestionOrder);

function signal(
  code: string,
  category: DiagnosisCategory,
  severity: DetectedSignal["severity"],
): DetectedSignal {
  return {
    code,
    category,
    severity,
    description: `sinal ${code}`,
    sourceAnswerIds: [],
  };
}

/** Pega o resultado de uma categoria específica. */
function forCategory(
  diagnoses: ReturnType<typeof buildDiagnosis>,
  category: DiagnosisCategory,
) {
  const found = diagnoses.find((d) => d.category === category);
  if (!found) throw new Error(`categoria ausente: ${category}`);
  return found;
}

describe("scoreToStatus — faixas", () => {
  it("mapeia as três faixas pelos seus limites", () => {
    expect(scoreToStatus(100)).toBe("green");
    expect(scoreToStatus(80)).toBe("green");
    expect(scoreToStatus(79)).toBe("yellow");
    expect(scoreToStatus(50)).toBe("yellow");
    expect(scoreToStatus(49)).toBe("red");
    expect(scoreToStatus(0)).toBe("red");
  });
});

describe("penalidades", () => {
  it("usa os pesos da especificação", () => {
    expect(SEVERITY_PENALTY.light).toBe(15);
    expect(SEVERITY_PENALTY.moderate).toBe(25);
    expect(SEVERITY_PENALTY.strong).toBe(40);
  });
});

describe("buildDiagnosis", () => {
  it("avalia sempre as 5 categorias", () => {
    const diagnoses = buildDiagnosis(context({}), []);
    expect(diagnoses.map((d) => d.category)).toEqual([
      "positioning",
      "audience",
      "offer",
      "digital_presence",
      "current_marketing",
    ]);
  });

  it("categoria sem nenhum sinal fica verde com 100", () => {
    const diagnoses = buildDiagnosis(context({}), []);
    const positioning = forCategory(diagnoses, "positioning");

    expect(positioning.score).toBe(100);
    expect(positioning.status).toBe("green");
    expect(positioning.signals).toEqual([]);
  });

  it("um sinal strong derruba para 60 — amarelo, não vermelho", () => {
    // DIVERGÊNCIA DOCUMENTADA: a especificação pedia que um sinal strong
    // resultasse em `red`, mas 100 − 40 = 60, que cai na faixa amarela
    // (50–79) definida pela própria especificação. Seguimos a aritmética.
    // Para que um strong virasse vermelho, a penalidade teria de ser ≥ 51
    // ou a faixa amarela começar em 65.
    const diagnoses = buildDiagnosis(context({}), [
      signal("broad_audience", "audience", "strong"),
    ]);
    const audience = forCategory(diagnoses, "audience");

    expect(audience.score).toBe(60);
    expect(audience.status).toBe("yellow");
  });

  it("dois sinais strong derrubam para 20 — vermelho", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "audience", "strong"),
      signal("b", "audience", "strong"),
    ]);
    const audience = forCategory(diagnoses, "audience");

    expect(audience.score).toBe(20);
    expect(audience.status).toBe("red");
  });

  it("um strong e um moderate derrubam para 35 — vermelho", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "offer", "strong"),
      signal("b", "offer", "moderate"),
    ]);
    expect(forCategory(diagnoses, "offer").score).toBe(35);
    expect(forCategory(diagnoses, "offer").status).toBe("red");
  });

  it("um sinal light mantém a categoria verde", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "digital_presence", "light"),
    ]);
    expect(forCategory(diagnoses, "digital_presence").score).toBe(85);
    expect(forCategory(diagnoses, "digital_presence").status).toBe("green");
  });

  it("a pontuação nunca fica abaixo de 0", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "positioning", "strong"),
      signal("b", "positioning", "strong"),
      signal("c", "positioning", "strong"),
      signal("d", "positioning", "moderate"),
    ]);
    // 100 − 145 seria negativo.
    expect(forCategory(diagnoses, "positioning").score).toBe(0);
    expect(forCategory(diagnoses, "positioning").status).toBe("red");
  });

  it("sinais de uma categoria não afetam as outras", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "audience", "strong"),
    ]);
    expect(forCategory(diagnoses, "audience").score).toBe(60);
    expect(forCategory(diagnoses, "positioning").score).toBe(100);
    expect(forCategory(diagnoses, "offer").score).toBe(100);
  });

  it("obrigatória sem resposta deixa a categoria cinza, ignorando sinais", () => {
    const questions = [
      question("ideal_client", { category: "audience", required: true }),
    ];
    const diagnoses = buildDiagnosis(
      context({ questions, answers: [] }),
      [signal("broad_audience", "audience", "strong")],
    );
    const audience = forCategory(diagnoses, "audience");

    expect(audience.status).toBe("gray");
    expect(audience.score).toBeNull();
    expect(audience.missingRequiredKeys).toEqual(["ideal_client"]);
    // O sinal continua listado para consulta, mas não foi pontuado.
    expect(audience.signals).toHaveLength(1);
  });

  it("resposta em branco conta como não respondida", () => {
    const questions = [
      question("ideal_client", { category: "audience", required: true }),
    ];
    const diagnoses = buildDiagnosis(
      context({ questions, answers: [answer("ideal_client", "   ")] }),
      [],
    );
    expect(forCategory(diagnoses, "audience").status).toBe("gray");
  });

  it("obrigatória respondida devolve a categoria à pontuação normal", () => {
    const questions = [
      question("ideal_client", { category: "audience", required: true }),
    ];
    const diagnoses = buildDiagnosis(
      context({
        questions,
        answers: [answer("ideal_client", "Noivas da zona sul")],
      }),
      [signal("broad_audience", "audience", "strong")],
    );
    const audience = forCategory(diagnoses, "audience");

    expect(audience.status).toBe("yellow");
    expect(audience.score).toBe(60);
  });

  it("não cobra obrigatória que está invisível para este briefing", () => {
    // A ramificação de e-commerce é obrigatória no catálogo, mas o briefing é
    // de negócio local: cobrá-la deixaria `offer` permanentemente cinza.
    const questions = [
      question("business_type", { order: 1, answerType: "single_choice" }),
      question("ecom_shipping", {
        order: 2,
        category: "offer",
        required: true,
        visibilityRule: {
          field: "business_type",
          operator: "equals",
          value: "ecommerce",
        },
      }),
    ];

    const diagnoses = buildDiagnosis(
      context({
        businessType: "local_business",
        questions,
        answers: [answer("business_type", "local_business")],
      }),
      [],
    );

    expect(forCategory(diagnoses, "offer").status).toBe("green");
    expect(forCategory(diagnoses, "offer").score).toBe(100);
  });

  it("perguntas de `closing` não afetam nenhuma categoria", () => {
    const questions = [
      question("anything_else", { category: "closing", required: true }),
    ];
    const diagnoses = buildDiagnosis(context({ questions, answers: [] }), []);

    // Nenhuma das 5 categorias fica cinza por causa de `closing`.
    expect(diagnoses.every((d) => d.status === "green")).toBe(true);
  });

  it("agrega as categorias de pergunta que alimentam positioning", () => {
    // business, brand e competition alimentam a mesma categoria: basta uma
    // obrigatória pendente em qualquer delas para deixá-la cinza.
    const questions = [
      question("desired_perception", { category: "brand", required: true }),
    ];
    const diagnoses = buildDiagnosis(context({ questions, answers: [] }), []);

    expect(forCategory(diagnoses, "positioning").status).toBe("gray");
    expect(forCategory(diagnoses, "positioning").missingRequiredKeys).toEqual([
      "desired_perception",
    ]);
  });
});

describe("buildSummary", () => {
  it("lista os problemas da pior categoria para a menos pior", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "audience", "strong"),
      signal("b", "audience", "strong"), // audience = 20
      signal("c", "offer", "strong"),
      signal("d", "offer", "moderate"), // offer = 35
    ]);

    const { problems } = buildSummary(context({}), diagnoses);

    expect(problems.map((p) => p.category)).toEqual(["audience", "offer"]);
    expect(problems.map((p) => p.score)).toEqual([20, 35]);
  });

  it("ordena os sinais de um problema pelo peso, do maior para o menor", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("leve", "audience", "light"),
      signal("forte", "audience", "strong"),
      signal("medio", "audience", "moderate"),
    ]);

    const { problems } = buildSummary(context({}), diagnoses);
    expect(problems[0].signals.map((s) => s.code)).toEqual([
      "forte",
      "medio",
      "leve",
    ]);
  });

  it("não lista categorias cinzas como problema", () => {
    const questions = [
      question("ideal_client", { category: "audience", required: true }),
    ];
    const ctx = context({ questions, answers: [] });
    const diagnoses = buildDiagnosis(ctx, [
      signal("a", "audience", "strong"),
      signal("b", "audience", "strong"),
    ]);

    expect(buildSummary(ctx, diagnoses).problems).toEqual([]);
  });

  it("lista categorias verdes como oportunidade", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "audience", "strong"),
    ]);
    const { opportunities } = buildSummary(context({}), diagnoses);

    // audience está amarela; as outras quatro seguem verdes.
    expect(opportunities.map((o) => o.category)).toEqual([
      "positioning",
      "offer",
      "digital_presence",
      "current_marketing",
    ]);
  });

  it("inclui o que já funcionou como oportunidade", () => {
    const ctx = context({
      answers: [answer("what_worked", "Parceria com o café da esquina")],
    });
    const diagnoses = buildDiagnosis(ctx, []);
    const { opportunities } = buildSummary(ctx, diagnoses);

    const relatada = opportunities.find((o) => o.category == null);
    expect(relatada?.detail).toBe("Parceria com o café da esquina");
  });
});
