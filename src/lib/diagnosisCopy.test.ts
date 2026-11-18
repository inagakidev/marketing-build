import { describe, expect, it } from "vitest";
import { describeCategory } from "./diagnosisCopy";

const signal = (severity: "light" | "moderate" | "strong") => ({ severity });
const texts: Record<string, string> = {
  site: "Site principal",
  posts: "Frequência de posts",
  bio: "Descrição do perfil",
};

describe("describeCategory (DS v2 frame 04, microcopy)", () => {
  it("says there's nothing to flag when no signal fired", () => {
    expect(describeCategory({ status: "green", signals: [], missingRequiredKeys: [] }, texts)).toBe(
      "Nenhum sinal de alerta.",
    );
  });

  it("counts signals by severity, strongest first", () => {
    expect(
      describeCategory(
        { status: "red", signals: [signal("light"), signal("strong"), signal("moderate"), signal("strong")], missingRequiredKeys: [] },
        texts,
      ),
    ).toBe("4 sinais: 2 fortes, 1 moderado, 1 leve.");
    expect(describeCategory({ status: "yellow", signals: [signal("moderate")], missingRequiredKeys: [] }, texts)).toBe(
      "1 sinal moderado.",
    );
  });

  it("names the missing answers when there isn't enough data", () => {
    expect(
      describeCategory({ status: "gray", signals: [], missingRequiredKeys: ["site", "posts"] }, texts),
    ).toBe("Faltam 2 respostas: “Site principal” e “Frequência de posts”.");
    expect(describeCategory({ status: "gray", signals: [], missingRequiredKeys: ["site"] }, texts)).toBe(
      "Falta 1 resposta: “Site principal”.",
    );
    expect(
      describeCategory({ status: "gray", signals: [], missingRequiredKeys: ["site", "posts", "bio", "x"] }, texts),
    ).toBe("Faltam 4 respostas, entre elas “Site principal” e “Frequência de posts”.");
  });

  it("names only the answers it knows, without breaking the sentence", () => {
    expect(
      describeCategory({ status: "gray", signals: [], missingRequiredKeys: ["site", "unknown"] }, texts),
    ).toBe("Faltam 2 respostas, entre elas “Site principal”.");
  });

  it("falls back to a generic line when it doesn't know which answers are missing", () => {
    expect(describeCategory({ status: "gray", signals: [], missingRequiredKeys: [] }, texts)).toBe(
      "Faltam respostas obrigatórias para avaliar esta categoria.",
    );
  });
});
