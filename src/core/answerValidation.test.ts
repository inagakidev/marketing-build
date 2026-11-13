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
  it("aceita valores compatíveis com o tipo e as opções", () => {
    expect(validateAnswerValue(single, "a")).toBeNull();
    expect(validateAnswerValue(multi, ["a", "b"])).toBeNull();
    expect(validateAnswerValue(shortText, "Padaria do bairro")).toBeNull();
    expect(validateAnswerValue(longText, "x".repeat(ANSWER_LIMITS.longText))).toBeNull();
  });

  it("recusa opção que não existe no catálogo", () => {
    expect(validateAnswerValue(single, "c")).toMatch(/opç/i);
    expect(validateAnswerValue(multi, ["a", "zzz"])).toMatch(/opç/i);
  });

  it("recusa formato trocado entre texto/escolha única e múltipla escolha", () => {
    expect(validateAnswerValue(single, ["a"])).not.toBeNull();
    expect(validateAnswerValue(shortText, ["texto"])).not.toBeNull();
    expect(validateAnswerValue(multi, "a")).not.toBeNull();
  });

  it("recusa opção repetida na múltipla escolha", () => {
    expect(validateAnswerValue(multi, ["a", "a"])).toMatch(/repetid/i);
  });

  it("respeita os limites de tamanho por tipo", () => {
    expect(validateAnswerValue(shortText, "x".repeat(ANSWER_LIMITS.shortText + 1))).toMatch(/caracteres/);
    expect(validateAnswerValue(longText, "x".repeat(ANSWER_LIMITS.longText + 1))).toMatch(/caracteres/);
  });

  it("pergunta de escolha sem opções cadastradas recusa qualquer valor", () => {
    expect(validateAnswerValue({ answerType: "single_choice", options: null }, "a")).not.toBeNull();
  });
});
