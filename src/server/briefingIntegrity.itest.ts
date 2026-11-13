import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./db";
import {
  BriefingClosedError,
  createBriefing,
  InvalidAnswersError,
  loadEvalContext,
  saveAnswers,
  submitBriefing,
} from "./briefing";
import { processBriefing, Q } from "@/core";

/**
 * Invariantes de integridade do briefing (EP-02): envio atômico (DATA-01) e
 * validação semântica das respostas (DATA-03), contra o Postgres real.
 */

const SUFFIX = `integ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let userId: string;
let clientId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { supabaseAuthId: `auth-${SUFFIX}`, name: "Teste", email: `${SUFFIX}@exemplo.test` },
  });
  userId = user.id;
  const client = await prisma.client.create({
    data: { userId, name: "Doce Vida", contactEmail: `c-${SUFFIX}@exemplo.test` },
  });
  clientId = client.id;
});

afterAll(async () => {
  if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
});

function respostasCompletas() {
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
    { questionKey: Q.DESIRED_PERCEPTION, value: "Confeitaria autoral sofisticada" },
    { questionKey: Q.MAIN_OFFER, value: "Bolo de festa" },
  ];
}

async function storedSignalCodes(briefingId: string): Promise<string[]> {
  const rows = await prisma.signal.findMany({ where: { briefingId }, select: { code: true } });
  return rows.map((r) => r.code).sort();
}

describe("envio atômico (DATA-01)", () => {
  it("envios simultâneos fecham o briefing uma única vez, sem erro", async () => {
    const briefing = await createBriefing(clientId);
    await saveAnswers(briefing.id, respostasCompletas());

    const outcomes = await Promise.all([
      submitBriefing(briefing.id),
      submitBriefing(briefing.id),
      submitBriefing(briefing.id),
    ]);

    expect(outcomes.every((o) => o.ok)).toBe(true);
    const fresh = outcomes.filter((o) => o.ok && !o.alreadySubmitted);
    expect(fresh).toHaveLength(1);
    expect(await prisma.diagnosis.count({ where: { briefingId: briefing.id } })).toBe(5);
  });

  it("autosave depois do envio é recusado e não altera respostas", async () => {
    const briefing = await createBriefing(clientId);
    await saveAnswers(briefing.id, respostasCompletas());
    await submitBriefing(briefing.id);

    await expect(
      saveAnswers(briefing.id, [{ questionKey: Q.IDEAL_CLIENT, value: "Outra coisa" }]),
    ).rejects.toBeInstanceOf(BriefingClosedError);

    const answer = await prisma.answer.findFirstOrThrow({
      where: { briefingId: briefing.id, question: { key: Q.IDEAL_CLIENT } },
    });
    expect(answer.value).toBe("Todo mundo");
  });

  it("autosave concorrente com o envio: o diagnóstico reflete exatamente as respostas gravadas", async () => {
    const briefing = await createBriefing(clientId);
    await saveAnswers(briefing.id, respostasCompletas());

    const especifico =
      "Mulheres de 30 a 45 anos, moradoras da zona sul, que encomendam bolos para festas infantis";
    await Promise.allSettled([
      submitBriefing(briefing.id),
      saveAnswers(briefing.id, [{ questionKey: Q.IDEAL_CLIENT, value: especifico }]),
    ]);

    // Seja qual for a ordem, o que foi gravado e o que foi diagnosticado
    // precisam bater: recalcular a partir das respostas finais dá o mesmo.
    const expected = processBriefing(await loadEvalContext(briefing.id))
      .signals.map((s) => s.code)
      .sort();
    expect(await storedSignalCodes(briefing.id)).toEqual(expected);
  });

  it("envio com link expirado é recusado sem fechar o briefing", async () => {
    const briefing = await createBriefing(clientId);
    await saveAnswers(briefing.id, respostasCompletas());
    await prisma.briefing.update({
      where: { id: briefing.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const outcome = await submitBriefing(briefing.id);
    expect(outcome).toEqual({ ok: false, problem: "expired" });
    const estado = await prisma.briefing.findUniqueOrThrow({ where: { id: briefing.id } });
    expect(estado.submittedAt).toBeNull();
    expect(await prisma.signal.count({ where: { briefingId: briefing.id } })).toBe(0);
  });
});

describe("validação semântica das respostas (DATA-03)", () => {
  it("recusa o lote inteiro quando uma resposta é inválida, sem gravar nada", async () => {
    const briefing = await createBriefing(clientId);

    const error = await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_NAME, value: "Doce Vida" },
      { questionKey: Q.BUSINESS_TYPE, value: "tipo_inventado" },
    ]).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(InvalidAnswersError);
    expect((error as InvalidAnswersError).issues).toHaveProperty(Q.BUSINESS_TYPE);
    expect(await prisma.answer.count({ where: { briefingId: briefing.id } })).toBe(0);
    const estado = await prisma.briefing.findUniqueOrThrow({ where: { id: briefing.id } });
    expect(estado.businessType).toBeNull();
  });

  it("recusa lista em pergunta de escolha única", async () => {
    const briefing = await createBriefing(clientId);
    await expect(
      saveAnswers(briefing.id, [{ questionKey: Q.BUSINESS_TYPE, value: ["local_business"] }]),
    ).rejects.toBeInstanceOf(InvalidAnswersError);
  });
});
