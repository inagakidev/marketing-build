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
  it("remove acentos e caixa", () => {
    expect(normalize("NÃO SEI")).toBe("nao sei");
    expect(normalize("Atenção")).toBe("atencao");
    expect(normalize("Ótimo Preço Justo")).toBe("otimo preco justo");
  });

  it("colapsa espaços e apara as pontas", () => {
    expect(normalize("  muitos   espaços \n aqui ")).toBe("muitos espacos aqui");
  });

  it("é idempotente", () => {
    const once = normalize("Coração  Válido");
    expect(normalize(once)).toBe(once);
  });
});

describe("isBlank", () => {
  it("trata nulos, string vazia e array vazio como vazios", () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank("")).toBe(true);
    expect(isBlank("   ")).toBe(true);
    expect(isBlank([])).toBe(true);
    expect(isBlank(["", "  "])).toBe(true);
  });

  it("reconhece conteúdo útil", () => {
    expect(isBlank("a")).toBe(false);
    expect(isBlank(["instagram"])).toBe(false);
  });
});

describe("valueToText", () => {
  it("achata multi_choice em texto único", () => {
    expect(valueToText(["instagram", "tiktok"])).toBe("instagram tiktok");
  });

  it("devolve string vazia para ausente", () => {
    expect(valueToText(null)).toBe("");
  });
});

describe("words e wordCount", () => {
  it("separa por qualquer caractere não alfanumérico", () => {
    expect(words("bolos, doces e tortas!")).toEqual([
      "bolos",
      "doces",
      "e",
      "tortas",
    ]);
  });

  it("conta palavras ignorando pontuação", () => {
    expect(wordCount("crescer muito!!!")).toBe(2);
    expect(wordCount("")).toBe(0);
  });
});

describe("hasDigit", () => {
  it("detecta número em qualquer posição", () => {
    expect(hasDigit("faturar 30 mil")).toBe(true);
    expect(hasDigit("R$5.000")).toBe(true);
    expect(hasDigit("crescer bastante")).toBe(false);
  });
});

describe("containsAny / matchedTerms", () => {
  it("casa termo isolado independente de acento e caixa", () => {
    expect(containsAny("Buscamos QUALIDADE acima de tudo", ["qualidade"])).toBe(
      true,
    );
  });

  it("respeita fronteira de palavra", () => {
    // "caro" não pode casar dentro de "carro"
    expect(containsAny("vendemos carro usado", ["caro"])).toBe(false);
    expect(containsAny("achei caro demais", ["caro"])).toBe(true);
  });

  it("casa expressões com espaço", () => {
    expect(containsAny("atendo todo mundo mesmo", ["todo mundo"])).toBe(true);
    expect(containsAny("atendo todo o bairro", ["todo mundo"])).toBe(false);
  });

  it("devolve quais termos casaram", () => {
    expect(
      matchedTerms("qualidade e bom atendimento", [
        "qualidade",
        "bom atendimento",
        "preco justo",
      ]),
    ).toEqual(["qualidade", "bom atendimento"]);
  });

  it("não casa nada em texto vazio", () => {
    expect(containsAny("", ["qualidade"])).toBe(false);
  });
});

describe("contentTokens", () => {
  it("descarta stopwords e tokens curtos", () => {
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
  it("dá 1 para textos com o mesmo vocabulário significativo", () => {
    expect(tokenOverlap("bolos artesanais caseiros", "bolos caseiros artesanais")).toBe(1);
  });

  it("dá 0 para textos sem nada em comum", () => {
    expect(tokenOverlap("padaria de bairro", "consultoria financeira")).toBe(0);
  });

  it("dá 0 quando um dos lados não tem conteúdo", () => {
    expect(tokenOverlap("", "consultoria")).toBe(0);
    expect(tokenOverlap("de a o para", "consultoria")).toBe(0);
  });

  it("fica entre 0 e 1 para sobreposição parcial", () => {
    const overlap = tokenOverlap(
      "bolos caseiros simples",
      "bolos sofisticados premium",
    );
    expect(overlap).toBeGreaterThan(0);
    expect(overlap).toBeLessThan(1);
  });
});
