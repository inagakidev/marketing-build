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

describe("evaluateRule — missing rule", () => {
  it("treats the question as visible when there is no rule", () => {
    expect(evaluateRule(null, ctx())).toBe(true);
    expect(evaluateRule(undefined, ctx())).toBe(true);
  });
});

describe("evaluateRule — operators", () => {
  it("equals compares against the business type", () => {
    const rule = {
      field: "business_type",
      operator: "equals" as const,
      value: "local_business",
    };
    expect(evaluateRule(rule, ctx({}, "local_business"))).toBe(true);
    expect(evaluateRule(rule, ctx({}, "ecommerce"))).toBe(false);
    expect(evaluateRule(rule, ctx({}, null))).toBe(false);
  });

  it("equals ignores accents and case", () => {
    const rule = {
      field: "answer:frequencia",
      operator: "equals" as const,
      value: "esporadica",
    };
    expect(evaluateRule(rule, ctx({ frequencia: "Esporádica" }))).toBe(true);
  });

  it("not_equals is the complement of equals", () => {
    const rule = {
      field: "business_type",
      operator: "not_equals" as const,
      value: "ecommerce",
    };
    expect(evaluateRule(rule, ctx({}, "local_business"))).toBe(true);
    expect(evaluateRule(rule, ctx({}, "ecommerce"))).toBe(false);
  });

  it("not_empty distinguishes answered from empty", () => {
    const rule = { field: "answer:canais", operator: "not_empty" as const };
    expect(evaluateRule(rule, ctx({ canais: ["instagram"] }))).toBe(true);
    expect(evaluateRule(rule, ctx({ canais: [] }))).toBe(false);
    expect(evaluateRule(rule, ctx({ canais: "  " }))).toBe(false);
    expect(evaluateRule(rule, ctx({}))).toBe(false);
  });

  it("is_empty is the complement of not_empty", () => {
    const rule = { field: "answer:canais", operator: "is_empty" as const };
    expect(evaluateRule(rule, ctx({}))).toBe(true);
    expect(evaluateRule(rule, ctx({ canais: ["instagram"] }))).toBe(false);
  });

  it("in matches any value of a multiple choice", () => {
    const rule = {
      field: "answer:canais",
      operator: "in" as const,
      value: ["tiktok", "youtube"],
    };
    expect(evaluateRule(rule, ctx({ canais: ["instagram", "tiktok"] }))).toBe(true);
    expect(evaluateRule(rule, ctx({ canais: ["instagram"] }))).toBe(false);
  });

  it("not_in excludes anyone who picked one of the values", () => {
    const rule = {
      field: "answer:canais",
      operator: "not_in" as const,
      value: ["tiktok"],
    };
    expect(evaluateRule(rule, ctx({ canais: ["instagram"] }))).toBe(true);
    expect(evaluateRule(rule, ctx({ canais: ["tiktok"] }))).toBe(false);
  });

  it("contains_any searches for a substring in free text", () => {
    const rule = {
      field: "answer:descricao",
      operator: "contains_any" as const,
      value: ["clinica"],
    };
    expect(evaluateRule(rule, ctx({ descricao: "Sou dono de uma clínica" }))).toBe(true);
    expect(evaluateRule(rule, ctx({ descricao: "Vendo bolos" }))).toBe(false);
  });

  it("hides the question when the operator is unknown", () => {
    const rule = {
      field: "business_type",
      operator: "teleport" as never,
      value: "x",
    };
    expect(evaluateRule(rule, ctx({}, "local_business"))).toBe(false);
  });
});

describe("evaluateRule — combinators", () => {
  const isLocal = {
    field: "business_type",
    operator: "equals" as const,
    value: "local_business",
  };
  const hasChannels = {
    field: "answer:canais",
    operator: "not_empty" as const,
  };

  it("all requires every condition", () => {
    const rule = { all: [isLocal, hasChannels] };
    expect(evaluateRule(rule, ctx({ canais: ["ig"] }, "local_business"))).toBe(true);
    expect(evaluateRule(rule, ctx({}, "local_business"))).toBe(false);
    expect(evaluateRule(rule, ctx({ canais: ["ig"] }, "ecommerce"))).toBe(false);
  });

  it("any requires at least one", () => {
    const rule = { any: [isLocal, hasChannels] };
    expect(evaluateRule(rule, ctx({}, "local_business"))).toBe(true);
    expect(evaluateRule(rule, ctx({ canais: ["ig"] }, "ecommerce"))).toBe(true);
    expect(evaluateRule(rule, ctx({}, "ecommerce"))).toBe(false);
  });

  it("not inverts", () => {
    expect(evaluateRule({ not: isLocal }, ctx({}, "ecommerce"))).toBe(true);
    expect(evaluateRule({ not: isLocal }, ctx({}, "local_business"))).toBe(false);
  });

  it("nests combinators", () => {
    const rule = { all: [isLocal, { not: hasChannels }] };
    expect(evaluateRule(rule, ctx({}, "local_business"))).toBe(true);
    expect(evaluateRule(rule, ctx({ canais: ["ig"] }, "local_business"))).toBe(false);
  });
});

describe("resolveVisibility", () => {
  it("shows the business type's questions and hides the others'", () => {
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

  it("unlocks the dependent question only after the answer it depends on", () => {
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

  it("ignores the answer to a question that became invisible", () => {
    // Real scenario: the client picked local_business, answered the branch
    // question, then went back and switched to ecommerce. The orphan answer
    // is still in the database and must not unlock anything.
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
          answer("local_city", "Curitiba"), // orphan answer
        ],
      }),
    );

    expect(visible.has("local_city")).toBe(false);
    expect(visible.has("depende_da_cidade")).toBe(false);
  });

  it("doesn't let a rule see the answer to a later question", () => {
    // Resolution is single-pass in catalog order: conditioning display on
    // something that hasn't even been asked yet isn't supported.
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

  it("doesn't loop with mutually dependent rules", () => {
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

    // `a` is evaluated first, before `b` enters the context: visible.
    // `b` then sees `a` answered: invisible. Deterministic, no loop.
    expect(visible.has("a")).toBe(true);
    expect(visible.has("b")).toBe(false);
  });
});

describe("visibleQuestions", () => {
  it("returns the visible ones in order", () => {
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
