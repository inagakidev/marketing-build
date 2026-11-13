import { beforeEach, describe, expect, it } from "vitest";
import { GOAL, POSTING, Q } from "../questionKeys";
import { answer, context, question, resetQuestionOrder } from "../testing/fixtures";
import type { AnswerRecord, BusinessType, SignalRule } from "../types";
import { broadAudienceRule } from "./rules/broadAudience";
import { genericDifferentiatorRule } from "./rules/genericDifferentiator";
import { goalBehaviorContradictionRule } from "./rules/goalBehaviorContradiction";
import { inconsistentPresenceRule } from "./rules/inconsistentPresence";
import { paidTrafficNoMetricsRule } from "./rules/paidTrafficNoMetrics";
import { positioningGapRule } from "./rules/positioningGap";
import { regulatedProfessionFlagRule } from "./rules/regulatedProfessionFlag";
import { unclearConversionRule } from "./rules/unclearConversion";
import { vagueGoalRule } from "./rules/vagueGoal";
import { SIGNAL_RULES } from "./registry";
import { runSignals } from "./run";

beforeEach(resetQuestionOrder);

/**
 * Aplica uma regra a um conjunto de respostas. As perguntas são inferidas e
 * ficam todas visíveis, isolando a regra do motor de visibilidade — que tem
 * testes próprios.
 */
function evaluate(
  rule: SignalRule,
  answers: AnswerRecord[],
  businessType: BusinessType | null = null,
) {
  return rule.evaluate(context({ businessType, answers }));
}

describe("vague_goal", () => {
  it("dispara por termo genérico mesmo em resposta longa", () => {
    // Longa o bastante (>15 palavras) para não cair no critério de tamanho:
    // isola o caminho da lista de palavras-chave.
    const hit = evaluate(vagueGoalRule, [
      answer(
        Q.SUCCESS_6_MONTHS,
        "Eu queria muito que o negócio pudesse crescer bastante nos próximos meses e que a gente conseguisse bombar de vez por aqui",
      ),
    ]);
    expect(hit).not.toBeNull();
    expect(hit?.description).toContain("crescer");
    expect(hit?.sourceAnswerIds).toEqual([`ans-${Q.SUCCESS_6_MONTHS}`]);
  });

  it("dispara com resposta curta demais, mesmo sem termo da lista", () => {
    const hit = evaluate(vagueGoalRule, [
      answer(Q.SUCCESS_6_MONTHS, "Ir bem."),
    ]);
    expect(hit).not.toBeNull();
  });

  it("não dispara quando há número", () => {
    expect(
      evaluate(vagueGoalRule, [
        answer(Q.SUCCESS_6_MONTHS, "Quero crescer para 30 clientes por mês"),
      ]),
    ).toBeNull();
  });

  it("não dispara com meta longa e específica", () => {
    expect(
      evaluate(vagueGoalRule, [
        answer(
          Q.SUCCESS_6_MONTHS,
          "Ter agenda cheia de casamentos na alta temporada e fechar contrato fixo com dois buffets da região",
        ),
      ]),
    ).toBeNull();
  });

  it("não dispara quando a pergunta não foi respondida", () => {
    expect(evaluate(vagueGoalRule, [])).toBeNull();
    expect(
      evaluate(vagueGoalRule, [answer(Q.SUCCESS_6_MONTHS, "   ")]),
    ).toBeNull();
  });
});

describe("broad_audience", () => {
  it("dispara por termo amplo mesmo em resposta longa", () => {
    // Longa o bastante para não cair no critério de tamanho: isola o caminho
    // da lista de palavras-chave.
    const hit = evaluate(broadAudienceRule, [
      answer(
        Q.IDEAL_CLIENT,
        "Na verdade eu atendo todo mundo que aparecer aqui na loja, porque o produto serve mesmo para qualquer pessoa interessada",
      ),
    ]);
    expect(hit).not.toBeNull();
    expect(hit?.description).toContain("todo mundo");
    expect(hit?.sourceAnswerIds).toEqual([`ans-${Q.IDEAL_CLIENT}`]);
  });

  it("dispara com resposta curta demais", () => {
    expect(
      evaluate(broadAudienceRule, [answer(Q.IDEAL_CLIENT, "Mulheres")]),
    ).not.toBeNull();
  });

  it("não dispara com público segmentado", () => {
    expect(
      evaluate(broadAudienceRule, [
        answer(
          Q.IDEAL_CLIENT,
          "Noivas entre 25 e 35 anos da zona sul que planejam casamento intimista e valorizam confeitaria artesanal",
        ),
      ]),
    ).toBeNull();
  });
});

describe("generic_differentiator", () => {
  it("dispara quando só há termos genéricos", () => {
    const hit = evaluate(genericDifferentiatorRule, [
      answer(Q.DIFFERENTIATOR, "Qualidade e bom atendimento"),
    ]);
    expect(hit).not.toBeNull();
  });

  it("não dispara quando há substância junto do termo genérico", () => {
    expect(
      evaluate(genericDifferentiatorRule, [
        answer(
          Q.DIFFERENTIATOR,
          "Qualidade no acabamento: sou o único ateliê da cidade com forno a lenha importado e massa fermentada por 48 horas",
        ),
      ]),
    ).toBeNull();
  });

  it("não dispara quando nenhum termo genérico aparece", () => {
    expect(
      evaluate(genericDifferentiatorRule, [
        answer(Q.DIFFERENTIATOR, "Entrego em 24 horas com rastreio"),
      ]),
    ).toBeNull();
  });
});

describe("positioning_gap", () => {
  it("dispara quando as percepções não compartilham vocabulário", () => {
    const hit = evaluate(positioningGapRule, [
      answer(Q.CURRENT_PERCEPTION, "Uma padaria de bairro barata e simples"),
      answer(Q.DESIRED_PERCEPTION, "Confeitaria autoral sofisticada para eventos corporativos"),
    ]);
    expect(hit).not.toBeNull();
    expect(hit?.sourceAnswerIds).toEqual([
      `ans-${Q.CURRENT_PERCEPTION}`,
      `ans-${Q.DESIRED_PERCEPTION}`,
    ]);
  });

  it("não dispara quando as percepções são próximas", () => {
    expect(
      evaluate(positioningGapRule, [
        answer(Q.CURRENT_PERCEPTION, "Confeitaria artesanal de bairro conhecida pelos bolos"),
        answer(Q.DESIRED_PERCEPTION, "Confeitaria artesanal de bairro referência em bolos"),
      ]),
    ).toBeNull();
  });

  it("não dispara se faltar uma das duas percepções", () => {
    expect(
      evaluate(positioningGapRule, [
        answer(Q.CURRENT_PERCEPTION, "Padaria de bairro"),
      ]),
    ).toBeNull();
  });
});

describe("unclear_conversion", () => {
  it("dispara quando o processo de compra não foi descrito", () => {
    const hit = evaluate(unclearConversionRule, []);
    expect(hit).not.toBeNull();
    // Não há resposta a rastrear.
    expect(hit?.sourceAnswerIds).toEqual([]);
  });

  it("dispara quando a descrição é curta demais", () => {
    const hit = evaluate(unclearConversionRule, [
      answer(Q.PURCHASE_PROCESS, "Chama no direct"),
    ]);
    expect(hit).not.toBeNull();
    expect(hit?.sourceAnswerIds).toEqual([`ans-${Q.PURCHASE_PROCESS}`]);
  });

  it("não dispara quando o caminho está detalhado", () => {
    expect(
      evaluate(unclearConversionRule, [
        answer(
          Q.PURCHASE_PROCESS,
          "O cliente chama no WhatsApp, eu envio o catálogo, ele escolhe o sabor, pago 50% por pix na encomenda e o restante na entrega",
        ),
      ]),
    ).toBeNull();
  });
});

describe("inconsistent_presence", () => {
  it("dispara com canal ativo e publicação esporádica", () => {
    const hit = evaluate(inconsistentPresenceRule, [
      answer(Q.ACTIVE_CHANNELS, ["instagram", "facebook"]),
      answer(Q.POSTING_FREQUENCY, POSTING.SPORADIC),
    ]);
    expect(hit).not.toBeNull();
    expect(hit?.sourceAnswerIds).toEqual([
      `ans-${Q.ACTIVE_CHANNELS}`,
      `ans-${Q.POSTING_FREQUENCY}`,
    ]);
  });

  it("dispara quando parou de publicar", () => {
    expect(
      evaluate(inconsistentPresenceRule, [
        answer(Q.ACTIVE_CHANNELS, ["instagram"]),
        answer(Q.POSTING_FREQUENCY, POSTING.STOPPED),
      ]),
    ).not.toBeNull();
  });

  it("não dispara com cadência regular", () => {
    expect(
      evaluate(inconsistentPresenceRule, [
        answer(Q.ACTIVE_CHANNELS, ["instagram"]),
        answer(Q.POSTING_FREQUENCY, POSTING.WEEKLY),
      ]),
    ).toBeNull();
  });

  it("não dispara sem nenhum canal ativo", () => {
    expect(
      evaluate(inconsistentPresenceRule, [
        answer(Q.ACTIVE_CHANNELS, []),
        answer(Q.POSTING_FREQUENCY, POSTING.SPORADIC),
      ]),
    ).toBeNull();
  });
});

describe("paid_traffic_no_metrics", () => {
  it("dispara quando investiu mas não cita número", () => {
    const hit = evaluate(paidTrafficNoMetricsRule, [
      answer(Q.PAID_TRAFFIC, "Já impulsionei publicação no Instagram, veio bastante gente"),
    ]);
    expect(hit).not.toBeNull();
    expect(hit?.sourceAnswerIds).toEqual([`ans-${Q.PAID_TRAFFIC}`]);
  });

  it("não dispara quando há número", () => {
    expect(
      evaluate(paidTrafficNoMetricsRule, [
        answer(Q.PAID_TRAFFIC, "Investi R$ 300 e trouxe 12 pedidos"),
      ]),
    ).toBeNull();
  });

  it("não dispara para quem nunca investiu", () => {
    expect(
      evaluate(paidTrafficNoMetricsRule, [
        answer(Q.PAID_TRAFFIC, "Nunca investi em anúncio"),
      ]),
    ).toBeNull();
    expect(
      evaluate(paidTrafficNoMetricsRule, [answer(Q.PAID_TRAFFIC, "Não")]),
    ).toBeNull();
  });

  it("é de severidade leve", () => {
    expect(paidTrafficNoMetricsRule.severity).toBe("light");
  });
});

describe("goal_behavior_contradiction", () => {
  it("dispara com objetivo de vendas e nenhuma menção a conversão", () => {
    const hit = evaluate(goalBehaviorContradictionRule, [
      answer(Q.CLOSEST_GOAL, GOAL.SALES),
      answer(Q.ACTIVE_CHANNELS, ["instagram"]),
      answer(Q.WHAT_WORKED, "Postar bastidores da produção"),
    ]);
    expect(hit).not.toBeNull();
  });

  it("dispara também para objetivo de leads", () => {
    expect(
      evaluate(goalBehaviorContradictionRule, [
        answer(Q.CLOSEST_GOAL, GOAL.LEADS),
        answer(Q.WHAT_WORKED, "Fotos bonitas dos produtos"),
      ]),
    ).not.toBeNull();
  });

  it("não dispara quando a presença digital fala em conversão", () => {
    expect(
      evaluate(goalBehaviorContradictionRule, [
        answer(Q.CLOSEST_GOAL, GOAL.SALES),
        answer(Q.WHAT_WORKED, "Stories com link na bio para o checkout"),
      ]),
    ).toBeNull();
  });

  it("não dispara para objetivos que não são de conversão", () => {
    expect(
      evaluate(goalBehaviorContradictionRule, [
        answer(Q.CLOSEST_GOAL, GOAL.AUTHORITY),
        answer(Q.WHAT_WORKED, "Postar bastidores"),
      ]),
    ).toBeNull();
  });

  it("rastreia o objetivo e as respostas de presença digital", () => {
    const hit = evaluate(goalBehaviorContradictionRule, [
      answer(Q.CLOSEST_GOAL, GOAL.SALES),
      answer(Q.WHAT_WORKED, "Bastidores"),
    ]);
    expect(hit?.sourceAnswerIds).toEqual([
      `ans-${Q.CLOSEST_GOAL}`,
      `ans-${Q.WHAT_WORKED}`,
    ]);
  });
});

describe("regulated_profession_flag", () => {
  it("dispara para autônoma de área regulada sem menção a restrição", () => {
    const hit = evaluate(
      regulatedProfessionFlagRule,
      [answer(Q.BUSINESS_DESCRIPTION, "Sou nutricionista e atendo online")],
      "freelancer",
    );
    expect(hit).not.toBeNull();
    expect(hit?.sourceAnswerIds).toEqual([`ans-${Q.BUSINESS_DESCRIPTION}`]);
  });

  it("não dispara quando o tipo de negócio não é freelancer", () => {
    expect(
      evaluate(
        regulatedProfessionFlagRule,
        [answer(Q.BUSINESS_DESCRIPTION, "Clínica de nutrição")],
        "local_business",
      ),
    ).toBeNull();
  });

  it("não dispara em área não regulada", () => {
    expect(
      evaluate(
        regulatedProfessionFlagRule,
        [answer(Q.BUSINESS_DESCRIPTION, "Faço bolos por encomenda")],
        "freelancer",
      ),
    ).toBeNull();
  });

  it("não dispara quando já há menção a cuidado com divulgação", () => {
    expect(
      evaluate(
        regulatedProfessionFlagRule,
        [
          answer(Q.BUSINESS_DESCRIPTION, "Sou nutricionista"),
          answer(Q.CONSTRAINTS, "Preciso respeitar o código de ética do conselho"),
        ],
        "freelancer",
      ),
    ).toBeNull();
  });

  it("não dispara quando a pergunta ramificada de conselho foi respondida", () => {
    expect(
      evaluate(
        regulatedProfessionFlagRule,
        [
          answer(Q.BUSINESS_DESCRIPTION, "Sou nutricionista"),
          answer(Q.FREE_REGULATED_COUNCIL, "nao"),
        ],
        "freelancer",
      ),
    ).toBeNull();
  });
});

describe("registro de regras", () => {
  it("expõe as 9 regras da especificação, com códigos únicos", () => {
    const codes = SIGNAL_RULES.map((r) => r.code);
    expect(codes).toHaveLength(9);
    expect(new Set(codes).size).toBe(9);
    expect(codes.sort()).toEqual(
      [
        "broad_audience",
        "generic_differentiator",
        "goal_behavior_contradiction",
        "inconsistent_presence",
        "paid_traffic_no_metrics",
        "positioning_gap",
        "regulated_profession_flag",
        "unclear_conversion",
        "vague_goal",
      ].sort(),
    );
  });

  it("associa cada regra a uma categoria de diagnóstico válida", () => {
    const valid = new Set([
      "positioning",
      "audience",
      "offer",
      "digital_presence",
      "current_marketing",
    ]);
    for (const rule of SIGNAL_RULES) {
      expect(valid.has(rule.category)).toBe(true);
    }
  });
});

describe("runSignals", () => {
  it("não avalia respostas de perguntas invisíveis", () => {
    // `business_description` só é visível para freelancer neste catálogo
    // artificial; como o briefing é ecommerce, a resposta não deve alimentar
    // o regulated_profession_flag.
    const questions = [
      question(Q.BUSINESS_TYPE, { order: 1, answerType: "single_choice" }),
      question(Q.BUSINESS_DESCRIPTION, {
        order: 2,
        visibilityRule: {
          field: "business_type",
          operator: "equals",
          value: "freelancer",
        },
      }),
    ];

    const signals = runSignals(
      context({
        businessType: "ecommerce",
        questions,
        answers: [
          answer(Q.BUSINESS_TYPE, "ecommerce"),
          answer(Q.BUSINESS_DESCRIPTION, "Sou advogada"),
        ],
      }),
      [regulatedProfessionFlagRule],
    );

    expect(signals).toEqual([]);
  });

  it("devolve um sinal completo por regra que dispara", () => {
    const signals = runSignals(
      context({
        answers: [answer(Q.SUCCESS_6_MONTHS, "crescer")],
      }),
      [vagueGoalRule],
    );

    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      code: "vague_goal",
      category: "current_marketing",
      severity: "strong",
    });
    expect(signals[0].description).toBeTruthy();
  });
});
