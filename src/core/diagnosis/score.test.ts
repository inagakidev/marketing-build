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

/** Gets the result for a specific category. */
function forCategory(
  diagnoses: ReturnType<typeof buildDiagnosis>,
  category: DiagnosisCategory,
) {
  const found = diagnoses.find((d) => d.category === category);
  if (!found) throw new Error(`missing category: ${category}`);
  return found;
}

describe("scoreToStatus — bands", () => {
  it("maps the three bands by their limits", () => {
    expect(scoreToStatus(100)).toBe("green");
    expect(scoreToStatus(80)).toBe("green");
    expect(scoreToStatus(79)).toBe("yellow");
    expect(scoreToStatus(50)).toBe("yellow");
    expect(scoreToStatus(49)).toBe("red");
    expect(scoreToStatus(0)).toBe("red");
  });
});

describe("penalties", () => {
  it("uses the specified weights", () => {
    expect(SEVERITY_PENALTY.light).toBe(15);
    expect(SEVERITY_PENALTY.moderate).toBe(25);
    expect(SEVERITY_PENALTY.strong).toBe(40);
  });
});

describe("buildDiagnosis", () => {
  it("always evaluates the 5 categories", () => {
    const diagnoses = buildDiagnosis(context({}), []);
    expect(diagnoses.map((d) => d.category)).toEqual([
      "positioning",
      "audience",
      "offer",
      "digital_presence",
      "current_marketing",
    ]);
  });

  it("a category with no signal is green at 100", () => {
    const diagnoses = buildDiagnosis(context({}), []);
    const positioning = forCategory(diagnoses, "positioning");

    expect(positioning.score).toBe(100);
    expect(positioning.status).toBe("green");
    expect(positioning.signals).toEqual([]);
  });

  it("one strong signal drops it to 60 — yellow, not red", () => {
    // DOCUMENTED DIVERGENCE: the spec asked for one strong signal to result in
    // `red`, but 100 − 40 = 60, which falls in the yellow band (50–79) the
    // spec itself defines. We follow the arithmetic. For one strong signal to
    // turn red, the penalty would have to be ≥ 51 or the yellow band would
    // have to start at 65.
    const diagnoses = buildDiagnosis(context({}), [
      signal("broad_audience", "audience", "strong"),
    ]);
    const audience = forCategory(diagnoses, "audience");

    expect(audience.score).toBe(60);
    expect(audience.status).toBe("yellow");
  });

  it("two strong signals drop it to 20 — red", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "audience", "strong"),
      signal("b", "audience", "strong"),
    ]);
    const audience = forCategory(diagnoses, "audience");

    expect(audience.score).toBe(20);
    expect(audience.status).toBe("red");
  });

  it("one strong and one moderate drop it to 35 — red", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "offer", "strong"),
      signal("b", "offer", "moderate"),
    ]);
    expect(forCategory(diagnoses, "offer").score).toBe(35);
    expect(forCategory(diagnoses, "offer").status).toBe("red");
  });

  it("one light signal keeps the category green", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "digital_presence", "light"),
    ]);
    expect(forCategory(diagnoses, "digital_presence").score).toBe(85);
    expect(forCategory(diagnoses, "digital_presence").status).toBe("green");
  });

  it("the score never goes below 0", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "positioning", "strong"),
      signal("b", "positioning", "strong"),
      signal("c", "positioning", "strong"),
      signal("d", "positioning", "moderate"),
    ]);
    // 100 − 145 would be negative.
    expect(forCategory(diagnoses, "positioning").score).toBe(0);
    expect(forCategory(diagnoses, "positioning").status).toBe("red");
  });

  it("one category's signals don't affect the others", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "audience", "strong"),
    ]);
    expect(forCategory(diagnoses, "audience").score).toBe(60);
    expect(forCategory(diagnoses, "positioning").score).toBe(100);
    expect(forCategory(diagnoses, "offer").score).toBe(100);
  });

  it("an unanswered required question turns the category gray, ignoring signals", () => {
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
    // The signal is still listed for reference, but wasn't scored.
    expect(audience.signals).toHaveLength(1);
  });

  it("a blank answer counts as unanswered", () => {
    const questions = [
      question("ideal_client", { category: "audience", required: true }),
    ];
    const diagnoses = buildDiagnosis(
      context({ questions, answers: [answer("ideal_client", "   ")] }),
      [],
    );
    expect(forCategory(diagnoses, "audience").status).toBe("gray");
  });

  it("answering the required question restores normal scoring", () => {
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

  it("doesn't demand a required question invisible to this briefing", () => {
    // The e-commerce branch is required in the catalog, but the briefing is
    // for a local business: demanding it would leave `offer` permanently gray.
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

  it("`closing` questions don't affect any category", () => {
    const questions = [
      question("anything_else", { category: "closing", required: true }),
    ];
    const diagnoses = buildDiagnosis(context({ questions, answers: [] }), []);

    // None of the 5 categories turns gray because of `closing`.
    expect(diagnoses.every((d) => d.status === "green")).toBe(true);
  });

  it("aggregates the question categories that feed positioning", () => {
    // business, brand and competition feed the same category: one pending
    // required question in any of them is enough to turn it gray.
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
  it("lists problems from the worst category to the least bad", () => {
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

  it("sorts a problem's signals by weight, heaviest first", () => {
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

  it("doesn't list gray categories as problems", () => {
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

  it("lists green categories as opportunities", () => {
    const diagnoses = buildDiagnosis(context({}), [
      signal("a", "audience", "strong"),
    ]);
    const { opportunities } = buildSummary(context({}), diagnoses);

    // audience is yellow; the other four stay green.
    expect(opportunities.map((o) => o.category)).toEqual([
      "positioning",
      "offer",
      "digital_presence",
      "current_marketing",
    ]);
  });

  it("includes what has already worked as an opportunity", () => {
    const ctx = context({
      answers: [answer("what_worked", "Parceria com o café da esquina")],
    });
    const diagnoses = buildDiagnosis(ctx, []);
    const { opportunities } = buildSummary(ctx, diagnoses);

    const relatada = opportunities.find((o) => o.category == null);
    expect(relatada?.detail).toBe("Parceria com o café da esquina");
  });
});
