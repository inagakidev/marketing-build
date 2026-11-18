import { describe, expect, it } from "vitest";
import { describeStepProgress, stepProgress } from "./briefingProgress";

const questions = new Map([
  ["a", { required: true }],
  ["b", { required: true }],
  ["c", { required: false }],
  ["d", { required: false }],
]);

describe("stepProgress (DS v2 F3)", () => {
  it("counts answered questions, blank optionals and missing required ones", () => {
    expect(stepProgress(["a", "b", "c", "d"], questions, { a: "sim", c: ["x"], d: "  " })).toEqual({
      answered: 2,
      total: 4,
      optionalBlank: 1,
      requiredMissing: 1,
    });
  });

  it("treats empty lists and whitespace as unanswered", () => {
    expect(stepProgress(["a", "c"], questions, { a: " ", c: [] })).toMatchObject({
      answered: 0,
      requiredMissing: 1,
      optionalBlank: 1,
    });
  });
});

describe("describeStepProgress", () => {
  it("reads like the review screen", () => {
    expect(describeStepProgress({ answered: 6, total: 6, optionalBlank: 0, requiredMissing: 0 })).toBe(
      "6 de 6 respondidas",
    );
    expect(describeStepProgress({ answered: 4, total: 5, optionalBlank: 1, requiredMissing: 0 })).toBe(
      "4 de 5 · 1 opcional em branco",
    );
    expect(describeStepProgress({ answered: 3, total: 6, optionalBlank: 2, requiredMissing: 1 })).toBe(
      "3 de 6 · falta 1 obrigatória",
    );
    expect(describeStepProgress({ answered: 2, total: 6, optionalBlank: 1, requiredMissing: 3 })).toBe(
      "2 de 6 · faltam 3 obrigatórias",
    );
  });
});
