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
 * `src/core` declares its own union types instead of importing the Prisma
 * enums — that's what keeps the engine free of the generated client. The price
 * is that the two sets can drift silently: someone adds a value to the schema,
 * the engine never finds out, and the corresponding rule simply doesn't run.
 *
 * These tests are the lock. If one fails, update `src/core/types.ts` to match
 * the schema — not the other way around.
 */

function values(prismaEnum: Record<string, string>): string[] {
  return Object.values(prismaEnum).sort();
}

describe("core enums vs Prisma schema", () => {
  it("QuestionCategory matches", () => {
    expect([...QUESTION_CATEGORY_ORDER].sort()).toEqual(
      values(PrismaEnums.QuestionCategory),
    );
  });

  it("DiagnosisCategory matches", () => {
    expect([...DIAGNOSIS_CATEGORIES].sort()).toEqual(
      values(PrismaEnums.DiagnosisCategory),
    );
  });

  it("SignalSeverity matches and every severity has a defined penalty", () => {
    const severities = values(PrismaEnums.SignalSeverity);
    expect(Object.keys(SEVERITY_PENALTY).sort()).toEqual(severities);

    for (const severity of severities) {
      expect(SEVERITY_PENALTY[severity as SignalSeverity]).toBeGreaterThan(0);
    }
  });

  it("DiagnosisStatus matches", () => {
    const fromCore: DiagnosisStatus[] = ["green", "yellow", "red", "gray"];
    expect([...fromCore].sort()).toEqual(values(PrismaEnums.DiagnosisStatus));
  });

  it("BusinessType matches", () => {
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

  it("AnswerType matches", () => {
    const fromCore: AnswerType[] = [
      "short_text",
      "long_text",
      "single_choice",
      "multi_choice",
    ];
    expect([...fromCore].sort()).toEqual(values(PrismaEnums.AnswerType));
  });
});

describe("category map", () => {
  it("covers every question category", () => {
    for (const category of QUESTION_CATEGORY_ORDER) {
      expect(QUESTION_TO_DIAGNOSIS_CATEGORY).toHaveProperty(category);
    }
  });

  it("points only to valid diagnosis categories", () => {
    for (const target of Object.values(QUESTION_TO_DIAGNOSIS_CATEGORY)) {
      if (target == null) continue;
      expect(DIAGNOSIS_CATEGORIES).toContain(target);
    }
  });

  it("feeds each diagnosis category from at least one question category", () => {
    // A diagnosis category with no source would never turn gray for missing
    // required data — most likely a mapping mistake.
    const covered = new Set(Object.values(QUESTION_TO_DIAGNOSIS_CATEGORY));
    for (const category of DIAGNOSIS_CATEGORIES) {
      expect(covered.has(category)).toBe(true);
    }
  });
});
