import { describe, expect, it } from "vitest";
import {
  containsAny,
  contentTokens,
  hasDigit,
  isBlank,
  matchedTerms,
  normalize,
  tokenOverlap,
  valueToText,
  wordCount,
  words,
} from "./text";

describe("normalize", () => {
  it("removes accents and case", () => {
    expect(normalize("NÃO SEI")).toBe("nao sei");
    expect(normalize("Atenção")).toBe("atencao");
    expect(normalize("Ótimo Preço Justo")).toBe("otimo preco justo");
  });

  it("collapses whitespace and trims the ends", () => {
    expect(normalize("  muitos   espaços \n aqui ")).toBe("muitos espacos aqui");
  });

  it("is idempotent", () => {
    const once = normalize("Coração  Válido");
    expect(normalize(once)).toBe(once);
  });
});

describe("isBlank", () => {
  it("treats nulls, empty string and empty array as blank", () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank("")).toBe(true);
    expect(isBlank("   ")).toBe(true);
    expect(isBlank([])).toBe(true);
    expect(isBlank(["", "  "])).toBe(true);
  });

  it("recognizes useful content", () => {
    expect(isBlank("a")).toBe(false);
    expect(isBlank(["instagram"])).toBe(false);
  });
});

describe("valueToText", () => {
  it("flattens multi_choice into a single string", () => {
    expect(valueToText(["instagram", "tiktok"])).toBe("instagram tiktok");
  });

  it("returns an empty string when missing", () => {
    expect(valueToText(null)).toBe("");
  });
});

describe("words and wordCount", () => {
  it("splits on any non-alphanumeric character", () => {
    expect(words("bolos, doces e tortas!")).toEqual([
      "bolos",
      "doces",
      "e",
      "tortas",
    ]);
  });

  it("counts words ignoring punctuation", () => {
    expect(wordCount("crescer muito!!!")).toBe(2);
    expect(wordCount("")).toBe(0);
  });
});

describe("hasDigit", () => {
  it("detects a number in any position", () => {
    expect(hasDigit("faturar 30 mil")).toBe(true);
    expect(hasDigit("R$5.000")).toBe(true);
    expect(hasDigit("crescer bastante")).toBe(false);
  });
});

describe("containsAny / matchedTerms", () => {
  it("matches a single term regardless of accents and case", () => {
    expect(containsAny("Buscamos QUALIDADE acima de tudo", ["qualidade"])).toBe(
      true,
    );
  });

  it("respects word boundaries", () => {
    // "caro" must not match inside "carro"
    expect(containsAny("vendemos carro usado", ["caro"])).toBe(false);
    expect(containsAny("achei caro demais", ["caro"])).toBe(true);
  });

  it("matches phrases with spaces", () => {
    expect(containsAny("atendo todo mundo mesmo", ["todo mundo"])).toBe(true);
    expect(containsAny("atendo todo o bairro", ["todo mundo"])).toBe(false);
  });

  it("returns which terms matched", () => {
    expect(
      matchedTerms("qualidade e bom atendimento", [
        "qualidade",
        "bom atendimento",
        "preco justo",
      ]),
    ).toEqual(["qualidade", "bom atendimento"]);
  });

  it("matches nothing in empty text", () => {
    expect(containsAny("", ["qualidade"])).toBe(false);
  });
});

describe("contentTokens", () => {
  it("drops stopwords and short tokens", () => {
    const tokens = contentTokens("a marca de bolos para as festas");
    expect(tokens.has("marca")).toBe(true);
    expect(tokens.has("bolos")).toBe(true);
    expect(tokens.has("festas")).toBe(true);
    expect(tokens.has("de")).toBe(false);
    expect(tokens.has("para")).toBe(false);
    expect(tokens.has("as")).toBe(false);
  });
});

describe("tokenOverlap", () => {
  it("gives 1 for texts with the same meaningful vocabulary", () => {
    expect(tokenOverlap("bolos artesanais caseiros", "bolos caseiros artesanais")).toBe(1);
  });

  it("gives 0 for texts with nothing in common", () => {
    expect(tokenOverlap("padaria de bairro", "consultoria financeira")).toBe(0);
  });

  it("gives 0 when one side has no content", () => {
    expect(tokenOverlap("", "consultoria")).toBe(0);
    expect(tokenOverlap("de a o para", "consultoria")).toBe(0);
  });

  it("stays between 0 and 1 for partial overlap", () => {
    const overlap = tokenOverlap(
      "bolos caseiros simples",
      "bolos sofisticados premium",
    );
    expect(overlap).toBeGreaterThan(0);
    expect(overlap).toBeLessThan(1);
  });
});
