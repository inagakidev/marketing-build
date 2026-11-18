import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./db";
import {
  createBriefing,
  loadBriefingByToken,
  loadEvalContext,
  missingRequiredKeys,
  processAndPersist,
  saveAnswers,
  submitBriefing,
} from "./briefing";
import { loadBriefingDetail } from "./briefingDetail";
import { buildPublicForm } from "./publicForm";
import { Q } from "@/core";

/**
 * Server layer integration against a real Postgres.
 *
 * Covers what unit tests can't reach: migrations match the schema, the driver
 * adapter connects, the autosave upsert works, and the engine's result
 * survives the round trip to the database.
 *
 * Each run creates its own data under a throwaway user and deletes everything
 * at the end (cascading from `User`).
 */

const SUFFIX = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let userId: string;
let clientId: string;

beforeAll(async () => {
  const questionCount = await prisma.question.count();
  if (questionCount === 0) {
    throw new Error(
      "Catálogo vazio. Rode `npm run db:seed` antes dos testes de integração.",
    );
  }

  const user = await prisma.user.create({
    data: {
      supabaseAuthId: `auth-${SUFFIX}`,
      name: "Administradora de Teste",
      email: `${SUFFIX}@exemplo.test`,
    },
  });
  userId = user.id;

  const client = await prisma.client.create({
    data: {
      userId,
      name: "Doce Vida",
      contactEmail: `cliente-${SUFFIX}@exemplo.test`,
    },
  });
  clientId = client.id;
});

afterAll(async () => {
  if (userId) {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  }
  await prisma.$disconnect();
});

describe("briefing lifecycle", () => {
  it("creates a briefing with a unique token and an expiry", async () => {
    const briefing = await createBriefing(clientId, 15);

    expect(briefing.token).toHaveLength(24);
    expect(briefing.status).toBe("awaiting_response");
    expect(briefing.expiresAt).toBeInstanceOf(Date);

    const outro = await createBriefing(clientId);
    expect(outro.token).not.toBe(briefing.token);
  });

  it("accepts the link while open and rejects it once expired", async () => {
    const briefing = await createBriefing(clientId);

    const aberto = await loadBriefingByToken(briefing.token);
    expect(aberto.problem).toBeNull();
    // The public form exposes the name, not the email or internal notes.
    expect(aberto.briefing?.client.name).toBe("Doce Vida");

    await prisma.briefing.update({
      where: { id: briefing.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const expirado = await loadBriefingByToken(briefing.token);
    expect(expirado.problem).toBe("expired");

    const inexistente = await loadBriefingByToken("token-que-nao-existe");
    expect(inexistente.problem).toBe("not_found");
  });

  it("saves answers by upsert and syncs the business type", async () => {
    const briefing = await createBriefing(clientId);

    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_NAME, value: "Doce Vida" },
      { questionKey: Q.BUSINESS_TYPE, value: "local_business" },
    ]);

    let atualizado = await prisma.briefing.findUniqueOrThrow({
      where: { id: briefing.id },
    });
    expect(atualizado.businessType).toBe("local_business");
    // The first answer moves the briefing out of "awaiting".
    expect(atualizado.status).toBe("in_progress");

    // Saving the same question again updates instead of duplicating.
    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_NAME, value: "Doce Vida Confeitaria" },
    ]);

    const answers = await prisma.answer.findMany({
      where: { briefingId: briefing.id },
      select: { value: true, question: { select: { key: true } } },
    });
    expect(answers).toHaveLength(2);
    expect(
      answers.find((a) => a.question.key === Q.BUSINESS_NAME)?.value,
    ).toBe("Doce Vida Confeitaria");

    // Changing the business type is reflected on the briefing.
    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_TYPE, value: "ecommerce" },
    ]);
    atualizado = await prisma.briefing.findUniqueOrThrow({
      where: { id: briefing.id },
    });
    expect(atualizado.businessType).toBe("ecommerce");
  });

  it("deletes the answer when the field is cleared", async () => {
    const briefing = await createBriefing(clientId);

    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_NAME, value: "Algo" },
    ]);
    expect(await prisma.answer.count({ where: { briefingId: briefing.id } })).toBe(1);

    // "Answered then cleared" must become the same state as "never
    // answered", otherwise the engine would see an empty string.
    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_NAME, value: "   " },
    ]);
    expect(await prisma.answer.count({ where: { briefingId: briefing.id } })).toBe(0);
  });

  it("rejects a question that doesn't exist in the catalog", async () => {
    const briefing = await createBriefing(clientId);
    await expect(
      saveAnswers(briefing.id, [
        { questionKey: "pergunta_inventada", value: "x" },
      ]),
    ).rejects.toThrow(/Unknown questions/);
  });
});

describe("public form", () => {
  it("shows the chosen type's branch and hides the others", async () => {
    const briefing = await createBriefing(clientId);
    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_TYPE, value: "local_business" },
    ]);

    const form = await buildPublicForm(await loadEvalContext(briefing.id));
    const keys = form.questions.map((q) => q.key);

    expect(keys).toContain(Q.LOCAL_CITY_REGION);
    expect(keys).not.toContain(Q.ECOM_SHIPPING);
    expect(keys).not.toContain(Q.B2B_DECISION_CYCLE);

    // Questions carry text and options to draw the screen.
    const tipo = form.questions.find((q) => q.key === Q.BUSINESS_TYPE);
    expect(tipo?.text).toBeTruthy();
    expect(tipo?.options?.length).toBe(6);
    expect(tipo?.value).toBe("local_business");
  });

  it("unlocks posting frequency only after a channel is checked", async () => {
    const briefing = await createBriefing(clientId);

    const antes = await buildPublicForm(await loadEvalContext(briefing.id));
    expect(antes.questions.map((q) => q.key)).not.toContain(Q.POSTING_FREQUENCY);

    await saveAnswers(briefing.id, [
      { questionKey: Q.ACTIVE_CHANNELS, value: ["instagram"] },
    ]);

    const depois = await buildPublicForm(await loadEvalContext(briefing.id));
    expect(depois.questions.map((q) => q.key)).toContain(Q.POSTING_FREQUENCY);
  });
});

describe("submission and diagnosis", () => {
  /** Minimal answers to pass required-question validation. */
  function respostasVagas() {
    return [
      { questionKey: Q.BUSINESS_NAME, value: "Doce Vida" },
      { questionKey: Q.BUSINESS_DESCRIPTION, value: "Faço bolos" },
      { questionKey: Q.BUSINESS_TYPE, value: "local_business" },
      { questionKey: Q.BUSINESS_AGE, value: "1_a_3_anos" },
      { questionKey: Q.PRODUCTS_SERVICES, value: "Bolos e doces" },
      { questionKey: Q.DIFFERENTIATOR, value: "Qualidade e bom atendimento" },
      { questionKey: Q.MARKETING_REASON, value: "As vendas caíram" },
      { questionKey: Q.SUCCESS_6_MONTHS, value: "Quero crescer" },
      { questionKey: Q.CLOSEST_GOAL, value: "vendas" },
      { questionKey: Q.MAIN_PAIN, value: "Ninguém me acha" },
      { questionKey: Q.IDEAL_CLIENT, value: "Todo mundo" },
      { questionKey: Q.AUDIENCE_PAIN, value: "Querem doce bom" },
      { questionKey: Q.CURRENT_PERCEPTION, value: "Padaria simples de bairro" },
      {
        questionKey: Q.DESIRED_PERCEPTION,
        value: "Confeitaria autoral sofisticada",
      },
      { questionKey: Q.MAIN_OFFER, value: "Bolo de festa" },
    ];
  }

  it("rejects submission while required questions are missing", async () => {
    const briefing = await createBriefing(clientId);
    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_NAME, value: "Doce Vida" },
      { questionKey: Q.BUSINESS_TYPE, value: "local_business" },
    ]);

    const resultado = await submitBriefing(briefing.id);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok && "missing" in resultado) {
      expect(resultado.missing).toContain(Q.SUCCESS_6_MONTHS);
      expect(resultado.missing).toContain(Q.IDEAL_CLIENT);
    }

    // Still open: nothing was closed by mistake.
    const estado = await prisma.briefing.findUniqueOrThrow({
      where: { id: briefing.id },
    });
    expect(estado.status).toBe("in_progress");
    expect(estado.submittedAt).toBeNull();
  });

  it("closes the briefing and stores signals and diagnosis", async () => {
    const briefing = await createBriefing(clientId);
    await saveAnswers(briefing.id, respostasVagas());

    const ctx = await loadEvalContext(briefing.id);
    expect(missingRequiredKeys(ctx)).toEqual([]);

    const resultado = await submitBriefing(briefing.id);
    expect(resultado.ok).toBe(true);

    const estado = await prisma.briefing.findUniqueOrThrow({
      where: { id: briefing.id },
    });
    expect(estado.status).toBe("ready_for_review");
    expect(estado.submittedAt).toBeInstanceOf(Date);

    const signals = await prisma.signal.findMany({
      where: { briefingId: briefing.id },
    });
    const codes = signals.map((s) => s.code).sort();
    expect(codes).toEqual(
      [
        "broad_audience",
        "generic_differentiator",
        "goal_behavior_contradiction",
        "positioning_gap",
        "unclear_conversion",
        "vague_goal",
      ].sort(),
    );

    // Traceability: the stored ids really exist as answers.
    const answerIds = new Set(
      (
        await prisma.answer.findMany({
          where: { briefingId: briefing.id },
          select: { id: true },
        })
      ).map((a) => a.id),
    );
    for (const signal of signals) {
      for (const id of signal.sourceAnswerIds) {
        expect(answerIds.has(id)).toBe(true);
      }
    }

    const diagnoses = await prisma.diagnosis.findMany({
      where: { briefingId: briefing.id },
    });
    expect(diagnoses).toHaveLength(5);

    const porCategoria = Object.fromEntries(
      diagnoses.map((d) => [d.category, d]),
    );
    expect(porCategoria.current_marketing.score).toBe(20);
    expect(porCategoria.current_marketing.status).toBe("red");
    expect(porCategoria.audience.score).toBe(60);
    expect(porCategoria.positioning.score).toBe(50);

    // A closed link no longer accepts answers.
    const acesso = await loadBriefingByToken(briefing.token);
    expect(acesso.problem).toBe("already_submitted");
  });

  it("reprocessing is idempotent and doesn't duplicate records", async () => {
    const briefing = await createBriefing(clientId);
    await saveAnswers(briefing.id, respostasVagas());
    await submitBriefing(briefing.id);

    const antes = await prisma.signal.count({
      where: { briefingId: briefing.id },
    });

    await processAndPersist(briefing.id);
    await processAndPersist(briefing.id);

    expect(await prisma.signal.count({ where: { briefingId: briefing.id } })).toBe(
      antes,
    );
    expect(
      await prisma.diagnosis.count({ where: { briefingId: briefing.id } }),
    ).toBe(5);
  });

  it("builds the panel view with answers by category and summary", async () => {
    const briefing = await createBriefing(clientId);
    await saveAnswers(briefing.id, respostasVagas());
    await submitBriefing(briefing.id);

    const detail = await loadBriefingDetail(briefing.id, userId);
    expect(detail).not.toBeNull();
    if (!detail) return;

    expect(detail.categories.map((c) => c.category)).toEqual([
      "business",
      "goals",
      "audience",
      "brand",
      "competition",
      "digital_presence",
      "offer",
      "closing",
    ]);

    expect(detail.diagnoses).toHaveLength(5);
    expect(detail.missingRequiredKeys).toEqual([]);
    expect(detail.answeredCount).toBe(15);

    // current_marketing (20) is the worst; positioning (50) isn't red.
    expect(detail.summary.problems[0]?.category).toBe("current_marketing");
    expect(detail.summary.problems[0]?.signals.length).toBeGreaterThan(0);

    // The stored signals were rehydrated along with the diagnosis.
    const marketing = detail.diagnoses.find(
      (d) => d.category === "current_marketing",
    );
    expect(marketing?.signals.map((s) => s.code).sort()).toEqual([
      "goal_behavior_contradiction",
      "vague_goal",
    ]);
  });

  it("tells which required answers a category is missing after a reprocess", async () => {
    const briefing = await createBriefing(clientId);
    await saveAnswers(briefing.id, respostasVagas());
    await submitBriefing(briefing.id);

    // The catalog or the rules can change after submission; a reprocess then
    // finds a required answer missing and the category becomes "gray".
    await prisma.answer.deleteMany({
      where: { briefingId: briefing.id, question: { key: Q.IDEAL_CLIENT } },
    });
    await processAndPersist(briefing.id);

    const detail = await loadBriefingDetail(briefing.id, userId);
    const audience = detail?.diagnoses.find((d) => d.category === "audience");
    expect(audience?.status).toBe("gray");
    expect(audience?.missingRequiredKeys).toEqual([Q.IDEAL_CLIENT]);
    expect(detail?.questionTextByKey[Q.IDEAL_CLIENT]).toBeTruthy();
  });

  it("doesn't return another account's briefing", async () => {
    const briefing = await createBriefing(clientId);
    const detail = await loadBriefingDetail(briefing.id, "usuario-inexistente");
    expect(detail).toBeNull();
  });
});
