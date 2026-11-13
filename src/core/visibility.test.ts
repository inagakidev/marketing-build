import { beforeEach, describe, expect, it } from "vitest";
import { evaluateRule, resolveVisibility, visibleQuestions } from "./visibility";
import type { VisibilityContext } from "./visibility";
import { answer, context, question, resetQuestionOrder } from "./testing/fixtures";

beforeEach(resetQuestionOrder);

function ctx(
  values: Record<string, string | string[]> = {},
  businessType: string | null = null,
): VisibilityContext {
  return { businessType, values };
}

describe("evaluateRule — regra ausente", () => {
  it("considera visível quando não há regra", () => {
    expect(evaluateRule(null, ctx())).toBe(true);
    expect(evaluateRule(undefined, ctx())).toBe(true);
  });
});

describe("evaluateRule — operadores", () => {
  it("equals compara contra o tipo de negócio", () => {
    const rule = {
      field: "business_type",
      operator: "equals" as const,
      value: "local_business",
    };
    expect(evaluateRule(rule, ctx({}, "local_business"))).toBe(true);
    expect(evaluateRule(rule, ctx({}, "ecommerce"))).toBe(false);
    expect(evaluateRule(rule, ctx({}, null))).toBe(false);
  });

  it("equals ignora acento e caixa", () => {
    const rule = {
      field: "answer:frequencia",
      operator: "equals" as const,
      value: "esporadica",
    };
    expect(evaluateRule(rule, ctx({ frequencia: "Esporádica" }))).toBe(true);
  });

  it("not_equals é o complemento de equals", () => {
    const rule = {
      field: "business_type",
      operator: "not_equals" as const,
      value: "ecommerce",
    };
    expect(evaluateRule(rule, ctx({}, "local_business"))).toBe(true);
    expect(evaluateRule(rule, ctx({}, "ecommerce"))).toBe(false);
  });

  it("not_empty distingue respondida de vazia", () => {
    const rule = { field: "answer:canais", operator: "not_empty" as const };
    expect(evaluateRule(rule, ctx({ canais: ["instagram"] }))).toBe(true);
    expect(evaluateRule(rule, ctx({ canais: [] }))).toBe(false);
    expect(evaluateRule(rule, ctx({ canais: "  " }))).toBe(false);
    expect(evaluateRule(rule, ctx({}))).toBe(false);
  });

  it("is_empty é o complemento de not_empty", () => {
    const rule = { field: "answer:canais", operator: "is_empty" as const };
    expect(evaluateRule(rule, ctx({}))).toBe(true);
    expect(evaluateRule(rule, ctx({ canais: ["instagram"] }))).toBe(false);
  });

  it("in casa qualquer valor de uma múltipla escolha", () => {
    const rule = {
      field: "answer:canais",
      operator: "in" as const,
      value: ["tiktok", "youtube"],
    };
    expect(evaluateRule(rule, ctx({ canais: ["instagram", "tiktok"] }))).toBe(true);
    expect(evaluateRule(rule, ctx({ canais: ["instagram"] }))).toBe(false);
  });

  it("not_in exclui quem marcou algum dos valores", () => {
    const rule = {
      field: "answer:canais",
      operator: "not_in" as const,
      value: ["tiktok"],
    };
    expect(evaluateRule(rule, ctx({ canais: ["instagram"] }))).toBe(true);
    expect(evaluateRule(rule, ctx({ canais: ["tiktok"] }))).toBe(false);
  });

  it("contains_any busca substring em texto livre", () => {
    const rule = {
      field: "answer:descricao",
      operator: "contains_any" as const,
      value: ["clinica"],
    };
    expect(evaluateRule(rule, ctx({ descricao: "Sou dono de uma clínica" }))).toBe(true);
    expect(evaluateRule(rule, ctx({ descricao: "Vendo bolos" }))).toBe(false);
  });

  it("esconde a pergunta quando o operador é desconhecido", () => {
    const rule = {
      field: "business_type",
      operator: "teleport" as never,
      value: "x",
    };
    expect(evaluateRule(rule, ctx({}, "local_business"))).toBe(false);
  });
});

describe("evaluateRule — combinadores", () => {
  const isLocal = {
    field: "business_type",
    operator: "equals" as const,
    value: "local_business",
  };
  const hasChannels = {
    field: "answer:canais",
    operator: "not_empty" as const,
  };

  it("all exige todas as condições", () => {
    const rule = { all: [isLocal, hasChannels] };
    expect(evaluateRule(rule, ctx({ canais: ["ig"] }, "local_business"))).toBe(true);
    expect(evaluateRule(rule, ctx({}, "local_business"))).toBe(false);
    expect(evaluateRule(rule, ctx({ canais: ["ig"] }, "ecommerce"))).toBe(false);
  });

  it("any exige ao menos uma", () => {
    const rule = { any: [isLocal, hasChannels] };
    expect(evaluateRule(rule, ctx({}, "local_business"))).toBe(true);
    expect(evaluateRule(rule, ctx({ canais: ["ig"] }, "ecommerce"))).toBe(true);
    expect(evaluateRule(rule, ctx({}, "ecommerce"))).toBe(false);
  });

  it("not inverte", () => {
    expect(evaluateRule({ not: isLocal }, ctx({}, "ecommerce"))).toBe(true);
    expect(evaluateRule({ not: isLocal }, ctx({}, "local_business"))).toBe(false);
  });

  it("aninha combinadores", () => {
    const rule = { all: [isLocal, { not: hasChannels }] };
    expect(evaluateRule(rule, ctx({}, "local_business"))).toBe(true);
    expect(evaluateRule(rule, ctx({ canais: ["ig"] }, "local_business"))).toBe(false);
  });
});

describe("resolveVisibility", () => {
  it("mostra as perguntas do tipo de negócio e esconde as dos outros", () => {
    const questions = [
      question("business_type", { order: 1, answerType: "single_choice" }),
      question("local_city", {
        order: 2,
        visibilityRule: {
          field: "business_type",
          operator: "equals",
          value: "local_business",
        },
      }),
      question("ecom_shipping", {
        order: 3,
        visibilityRule: {
          field: "business_type",
          operator: "equals",
          value: "ecommerce",
        },
      }),
    ];

    const visible = resolveVisibility(
      context({
        businessType: "local_business",
        questions,
        answers: [answer("business_type", "local_business")],
      }),
    );

    expect(visible.has("business_type")).toBe(true);
    expect(visible.has("local_city")).toBe(true);
    expect(visible.has("ecom_shipping")).toBe(false);
  });

  it("libera a pergunta dependente só depois da resposta que a condiciona", () => {
    const questions = [
      question("active_channels", { order: 1, answerType: "multi_choice" }),
      question("posting_frequency", {
        order: 2,
        visibilityRule: {
          field: "answer:active_channels",
          operator: "not_empty",
        },
      }),
    ];

    const semCanais = resolveVisibility(context({ questions, answers: [] }));
    expect(semCanais.has("posting_frequency")).toBe(false);

    const comCanais = resolveVisibility(
      context({
        questions,
        answers: [answer("active_channels", ["instagram"])],
      }),
    );
    expect(comCanais.has("posting_frequency")).toBe(true);
  });

  it("ignora a resposta de uma pergunta que ficou invisível", () => {
    // Cenário real: o cliente marcou local_business, respondeu a pergunta
    // ramificada, e depois voltou e trocou para ecommerce. A resposta órfã
    // continua no banco e não pode liberar nada.
    const questions = [
      question("business_type", { order: 1, answerType: "single_choice" }),
      question("local_city", {
        order: 2,
        visibilityRule: {
          field: "business_type",
          operator: "equals",
          value: "local_business",
        },
      }),
      question("depende_da_cidade", {
        order: 3,
        visibilityRule: { field: "answer:local_city", operator: "not_empty" },
      }),
    ];

    const visible = resolveVisibility(
      context({
        businessType: "ecommerce",
        questions,
        answers: [
          answer("business_type", "ecommerce"),
          answer("local_city", "Curitiba"), // resposta órfã
        ],
      }),
    );

    expect(visible.has("local_city")).toBe(false);
    expect(visible.has("depende_da_cidade")).toBe(false);
  });

  it("não deixa uma regra enxergar resposta de pergunta posterior", () => {
    // A resolução é de passada única na ordem do catálogo: condicionar a
    // exibição a algo que ainda nem foi perguntado não é suportado.
    const questions = [
      question("depende_do_futuro", {
        order: 1,
        visibilityRule: { field: "answer:vem_depois", operator: "not_empty" },
      }),
      question("vem_depois", { order: 2 }),
    ];

    const visible = resolveVisibility(
      context({ questions, answers: [answer("vem_depois", "respondida")] }),
    );

    expect(visible.has("depende_do_futuro")).toBe(false);
  });

  it("não entra em laço com regras mutuamente dependentes", () => {
    const questions = [
      question("a", {
        order: 1,
        visibilityRule: { field: "answer:b", operator: "is_empty" },
      }),
      question("b", {
        order: 2,
        visibilityRule: { field: "answer:a", operator: "is_empty" },
      }),
    ];

    const visible = resolveVisibility(
      context({
        questions,
        answers: [answer("a", "x"), answer("b", "y")],
      }),
    );

    // `a` é avaliada primeiro, quando `b` ainda não entrou no contexto: visível.
    // `b` então enxerga `a` respondida: invisível. Determinístico, sem laço.
    expect(visible.has("a")).toBe(true);
    expect(visible.has("b")).toBe(false);
  });
});

describe("visibleQuestions", () => {
  it("devolve as visíveis ordenadas", () => {
    const questions = [
      question("terceira", { order: 30 }),
      question("primeira", { order: 10 }),
      question("segunda", { order: 20 }),
      question("escondida", {
        order: 15,
        visibilityRule: {
          field: "business_type",
          operator: "equals",
          value: "ecommerce",
        },
      }),
    ];

    const result = visibleQuestions(
      context({ businessType: "local_business", questions }),
    );

    expect(result.map((q) => q.key)).toEqual([
      "primeira",
      "segunda",
      "terceira",
    ]);
  });
});
