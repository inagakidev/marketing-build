import { describe, expect, it } from "vitest";
import * as PrismaEnums from "../generated/prisma/enums";
import { DIAGNOSIS_CATEGORIES, QUESTION_CATEGORY_ORDER } from "./diagnosis/categoryMap";
import { QUESTION_TO_DIAGNOSIS_CATEGORY } from "./diagnosis/categoryMap";
import { SEVERITY_PENALTY } from "./diagnosis/score";
import type {
  AnswerType,
  BusinessType,
  DiagnosisStatus,
  SignalSeverity,
} from "./types";

/**
 * `src/core` declara seus próprios union types em vez de importar os enums do
 * Prisma — é o que mantém o motor livre de dependência do client gerado.
 * O preço disso é a possibilidade de os dois conjuntos divergirem em silêncio:
 * alguém adiciona um valor no schema, o motor nunca fica sabendo, e a regra
 * correspondente simplesmente não roda.
 *
 * Estes testes são a trava. Se algum falhar, atualize `src/core/types.ts` para
 * refletir o schema — não o contrário.
 */

function values(prismaEnum: Record<string, string>): string[] {
  return Object.values(prismaEnum).sort();
}

describe("enums do core x schema do Prisma", () => {
  it("QuestionCategory bate", () => {
    expect([...QUESTION_CATEGORY_ORDER].sort()).toEqual(
      values(PrismaEnums.QuestionCategory),
    );
  });

  it("DiagnosisCategory bate", () => {
    expect([...DIAGNOSIS_CATEGORIES].sort()).toEqual(
      values(PrismaEnums.DiagnosisCategory),
    );
  });

  it("SignalSeverity bate e toda severidade tem penalidade definida", () => {
    const severities = values(PrismaEnums.SignalSeverity);
    expect(Object.keys(SEVERITY_PENALTY).sort()).toEqual(severities);

    for (const severity of severities) {
      expect(SEVERITY_PENALTY[severity as SignalSeverity]).toBeGreaterThan(0);
    }
  });

  it("DiagnosisStatus bate", () => {
    const fromCore: DiagnosisStatus[] = ["green", "yellow", "red", "gray"];
    expect([...fromCore].sort()).toEqual(values(PrismaEnums.DiagnosisStatus));
  });

  it("BusinessType bate", () => {
    const fromCore: BusinessType[] = [
      "local_business",
      "ecommerce",
      "info_product",
      "freelancer",
      "b2b_service",
      "other",
    ];
    expect([...fromCore].sort()).toEqual(values(PrismaEnums.BusinessType));
  });

  it("AnswerType bate", () => {
    const fromCore: AnswerType[] = [
      "short_text",
      "long_text",
      "single_choice",
      "multi_choice",
    ];
    expect([...fromCore].sort()).toEqual(values(PrismaEnums.AnswerType));
  });
});

describe("mapa de categorias", () => {
  it("cobre toda categoria de pergunta", () => {
    for (const category of QUESTION_CATEGORY_ORDER) {
      expect(QUESTION_TO_DIAGNOSIS_CATEGORY).toHaveProperty(category);
    }
  });

  it("aponta apenas para categorias de diagnóstico válidas", () => {
    for (const target of Object.values(QUESTION_TO_DIAGNOSIS_CATEGORY)) {
      if (target == null) continue;
      expect(DIAGNOSIS_CATEGORIES).toContain(target);
    }
  });

  it("alimenta cada categoria de diagnóstico a partir de ao menos uma de pergunta", () => {
    // Uma categoria de diagnóstico sem origem nunca ficaria cinza por falta de
    // dado obrigatório — provavelmente um erro de mapeamento.
    const covered = new Set(Object.values(QUESTION_TO_DIAGNOSIS_CATEGORY));
    for (const category of DIAGNOSIS_CATEGORIES) {
      expect(covered.has(category)).toBe(true);
    }
  });
});
