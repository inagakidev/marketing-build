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
 * Integração da camada de servidor contra o Postgres real.
 *
 * Cobre o que os testes unitários não alcançam: as migrations batem com o
 * schema, o driver adapter conecta, o upsert do autosave funciona, e o
 * resultado do motor sobrevive à ida e volta do banco.
 *
 * Cada execução cria os próprios dados sob um usuário descartável e apaga tudo
 * no fim (cascata a partir de `User`).
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

describe("ciclo de vida do briefing", () => {
  it("cria um briefing com token único e prazo", async () => {
    const briefing = await createBriefing(clientId, 15);

    expect(briefing.token).toHaveLength(24);
    expect(briefing.status).toBe("awaiting_response");
    expect(briefing.expiresAt).toBeInstanceOf(Date);

    const outro = await createBriefing(clientId);
    expect(outro.token).not.toBe(briefing.token);
  });

  it("aceita o link enquanto está aberto e recusa depois de expirado", async () => {
    const briefing = await createBriefing(clientId);

    const aberto = await loadBriefingByToken(briefing.token);
    expect(aberto.problem).toBeNull();
    // O formulário público expõe o nome, não o e-mail nem as notas internas.
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

  it("salva respostas por upsert e sincroniza o tipo de negócio", async () => {
    const briefing = await createBriefing(clientId);

    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_NAME, value: "Doce Vida" },
      { questionKey: Q.BUSINESS_TYPE, value: "local_business" },
    ]);

    let atualizado = await prisma.briefing.findUniqueOrThrow({
      where: { id: briefing.id },
    });
    expect(atualizado.businessType).toBe("local_business");
    // A primeira resposta tira o briefing de "aguardando".
    expect(atualizado.status).toBe("in_progress");

    // Regravar a mesma pergunta atualiza em vez de duplicar.
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

    // Trocar o tipo de negócio reflete no briefing.
    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_TYPE, value: "ecommerce" },
    ]);
    atualizado = await prisma.briefing.findUniqueOrThrow({
      where: { id: briefing.id },
    });
    expect(atualizado.businessType).toBe("ecommerce");
  });

  it("apaga a resposta quando o campo é limpo", async () => {
    const briefing = await createBriefing(clientId);

    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_NAME, value: "Algo" },
    ]);
    expect(await prisma.answer.count({ where: { briefingId: briefing.id } })).toBe(1);

    // "Respondida e depois apagada" precisa virar o mesmo estado que
    // "nunca respondida", senão o motor veria uma string vazia.
    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_NAME, value: "   " },
    ]);
    expect(await prisma.answer.count({ where: { briefingId: briefing.id } })).toBe(0);
  });

  it("recusa pergunta que não existe no catálogo", async () => {
    const briefing = await createBriefing(clientId);
    await expect(
      saveAnswers(briefing.id, [
        { questionKey: "pergunta_inventada", value: "x" },
      ]),
    ).rejects.toThrow(/desconhecidas/);
  });
});

describe("formulário público", () => {
  it("mostra a ramificação do tipo escolhido e esconde as demais", async () => {
    const briefing = await createBriefing(clientId);
    await saveAnswers(briefing.id, [
      { questionKey: Q.BUSINESS_TYPE, value: "local_business" },
    ]);

    const form = await buildPublicForm(await loadEvalContext(briefing.id));
    const keys = form.questions.map((q) => q.key);

    expect(keys).toContain(Q.LOCAL_CITY_REGION);
    expect(keys).not.toContain(Q.ECOM_SHIPPING);
    expect(keys).not.toContain(Q.B2B_DECISION_CYCLE);

    // Perguntas trazem texto e opções para desenhar a tela.
    const tipo = form.questions.find((q) => q.key === Q.BUSINESS_TYPE);
    expect(tipo?.text).toBeTruthy();
    expect(tipo?.options?.length).toBe(6);
    expect(tipo?.value).toBe("local_business");
  });

  it("libera a frequência de publicação só após marcar um canal", async () => {
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

describe("envio e diagnóstico", () => {
  /** Respostas mínimas para passar da validação de obrigatórias. */
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

  it("recusa o envio enquanto faltam obrigatórias", async () => {
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

    // Continua aberto: nada foi fechado à toa.
    const estado = await prisma.briefing.findUniqueOrThrow({
      where: { id: briefing.id },
    });
    expect(estado.status).toBe("in_progress");
    expect(estado.submittedAt).toBeNull();
  });

  it("fecha o briefing e grava sinais e diagnóstico", async () => {
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

    // Rastreabilidade: os ids gravados existem mesmo como respostas.
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

    // Link fechado não aceita mais resposta.
    const acesso = await loadBriefingByToken(briefing.token);
    expect(acesso.problem).toBe("already_submitted");
  });

  it("reprocessar é idempotente e não duplica registros", async () => {
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

  it("monta a visão do painel com respostas por categoria e sumário", async () => {
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

    // current_marketing (20) é o pior; positioning (50) não é vermelho.
    expect(detail.summary.problems[0]?.category).toBe("current_marketing");
    expect(detail.summary.problems[0]?.signals.length).toBeGreaterThan(0);

    // Os sinais gravados foram reidratados junto do diagnóstico.
    const marketing = detail.diagnoses.find(
      (d) => d.category === "current_marketing",
    );
    expect(marketing?.signals.map((s) => s.code).sort()).toEqual([
      "goal_behavior_contradiction",
      "vague_goal",
    ]);
  });

  it("não devolve briefing de outra conta", async () => {
    const briefing = await createBriefing(clientId);
    const detail = await loadBriefingDetail(briefing.id, "usuario-inexistente");
    expect(detail).toBeNull();
  });
});
