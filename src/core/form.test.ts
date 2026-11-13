import { beforeEach, describe, expect, it } from "vitest";
import { buildSteps, MAX_QUESTIONS_PER_STEP } from "./form";
import { answer, context, question, resetQuestionOrder } from "./testing/fixtures";
import { CORE_QUESTIONS } from "../../prisma/seed/questions.core";
import { BRANCH_QUESTIONS } from "../../prisma/seed/questions.branch";
import { Q } from "./questionKeys";
import type { QuestionSpec } from "./types";

beforeEach(resetQuestionOrder);

describe("buildSteps", () => {
  it("groups by category, in form order", () => {
    const questions = [
      question("oferta1", { category: "offer", order: 10 }),
      question("negocio1", { category: "business", order: 20 }),
      question("objetivo1", { category: "goals", order: 30 }),
    ];

    const steps = buildSteps(context({ questions }));

    expect(steps.map((s) => s.category)).toEqual(["business", "goals", "offer"]);
    expect(steps.map((s) => s.index)).toEqual([1, 2, 3]);
  });

  it("splits a large category into several steps", () => {
    const questions = Array.from({ length: 14 }, (_, i) =>
      question(`p${i}`, { category: "business", order: i }),
    );

    const steps = buildSteps(context({ questions }));

    expect(steps).toHaveLength(3); // 6 + 6 + 2
    expect(steps.map((s) => s.questionKeys.length)).toEqual([6, 6, 2]);
    expect(steps.map((s) => s.continued)).toEqual([false, true, true]);
  });

  it("never exceeds the cap of questions per step", () => {
    const questions = Array.from({ length: 25 }, (_, i) =>
      question(`p${i}`, { category: "audience", order: i }),
    );

    for (const step of buildSteps(context({ questions }))) {
      expect(step.questionKeys.length).toBeLessThanOrEqual(
        MAX_QUESTIONS_PER_STEP,
      );
    }
  });

  it("skips categories without a visible question", () => {
    const questions = [
      question("visivel", { category: "business", order: 1 }),
      question("escondida", {
        category: "offer",
        order: 2,
        visibilityRule: {
          field: "business_type",
          operator: "equals",
          value: "ecommerce",
        },
      }),
    ];

    const steps = buildSteps(
      context({ businessType: "local_business", questions }),
    );

    expect(steps.map((s) => s.category)).toEqual(["business"]);
  });

  it("numbers the steps without gaps", () => {
    const questions = Array.from({ length: 20 }, (_, i) =>
      question(`p${i}`, { category: i < 10 ? "business" : "offer", order: i }),
    );

    const steps = buildSteps(context({ questions }));
    expect(steps.map((s) => s.index)).toEqual(
      Array.from({ length: steps.length }, (_, i) => i + 1),
    );
  });
});

describe("buildSteps on the real catalog", () => {
  const specs: QuestionSpec[] = [...CORE_QUESTIONS, ...BRANCH_QUESTIONS].map(
    (q, index) => ({
      key: q.key,
      category: q.category,
      answerType: q.answerType,
      required: q.required ?? false,
      order: (index + 1) * 10,
      visibilityRule: q.visibilityRule ?? null,
    }),
  );

  it("the number of steps grows after choosing the business model", () => {
    // Expected behavior, and the reason the UI needs to warn: the form gets
    // bigger halfway through.
    const antes = buildSteps(context({ questions: specs, answers: [] }));

    const depois = buildSteps(
      context({
        businessType: "local_business",
        questions: specs,
        answers: [answer(Q.BUSINESS_TYPE, "local_business")],
      }),
    );

    expect(depois.length).toBeGreaterThan(antes.length);
  });

  it("covers every visible question exactly once", () => {
    const steps = buildSteps(
      context({
        businessType: "ecommerce",
        questions: specs,
        answers: [
          answer(Q.BUSINESS_TYPE, "ecommerce"),
          answer(Q.ACTIVE_CHANNELS, ["instagram"]),
        ],
      }),
    );

    const keys = steps.flatMap((s) => s.questionKeys);
    expect(new Set(keys).size).toBe(keys.length);

    // 30 fixed + 4 e-commerce = 34 (posting_frequency unlocked by the channel).
    expect(keys).toHaveLength(34);
  });
});
