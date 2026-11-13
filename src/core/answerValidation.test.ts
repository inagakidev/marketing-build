import { describe, expect, it } from "vitest";
import { ANSWER_LIMITS, validateAnswerValue } from "./answerValidation";

const single = {
  answerType: "single_choice" as const,
  options: [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
  ],
};
const multi = { ...single, answerType: "multi_choice" as const };
const shortText = { answerType: "short_text" as const, options: null };
const longText = { answerType: "long_text" as const, options: null };

describe("validateAnswerValue (DATA-03 / FORM-05)", () => {
  it("accepts values compatible with the type and options", () => {
    expect(validateAnswerValue(single, "a")).toBeNull();
    expect(validateAnswerValue(multi, ["a", "b"])).toBeNull();
    expect(validateAnswerValue(shortText, "Padaria do bairro")).toBeNull();
    expect(validateAnswerValue(longText, "x".repeat(ANSWER_LIMITS.longText))).toBeNull();
  });

  it("rejects an option that doesn't exist in the catalog", () => {
    expect(validateAnswerValue(single, "c")).toMatch(/opç/i);
    expect(validateAnswerValue(multi, ["a", "zzz"])).toMatch(/opç/i);
  });

  it("rejects a shape mixed up between text/single choice and multiple choice", () => {
    expect(validateAnswerValue(single, ["a"])).not.toBeNull();
    expect(validateAnswerValue(shortText, ["texto"])).not.toBeNull();
    expect(validateAnswerValue(multi, "a")).not.toBeNull();
  });

  it("rejects a repeated option in multiple choice", () => {
    expect(validateAnswerValue(multi, ["a", "a"])).toMatch(/repetid/i);
  });

  it("respects the length limits per type", () => {
    expect(validateAnswerValue(shortText, "x".repeat(ANSWER_LIMITS.shortText + 1))).toMatch(/caracteres/);
    expect(validateAnswerValue(longText, "x".repeat(ANSWER_LIMITS.longText + 1))).toMatch(/caracteres/);
  });

  it("a choice question with no registered options rejects any value", () => {
    expect(validateAnswerValue({ answerType: "single_choice", options: null }, "a")).not.toBeNull();
  });
});
