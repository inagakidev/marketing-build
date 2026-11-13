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
 * Applies a rule to a set of answers. Questions are inferred and all visible,
 * isolating the rule from the visibility engine — which has its own tests.
 */
function evaluate(
  rule: SignalRule,
  answers: AnswerRecord[],
  businessType: BusinessType | null = null,
) {
  return rule.evaluate(context({ businessType, answers }));
}

describe("vague_goal", () => {
  it("fires on a generic term even in a long answer", () => {
    // Long enough (>15 words) not to hit the length criterion: isolates the
    // keyword-list path.
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

  it("fires on a too-short answer, even without a listed term", () => {
    const hit = evaluate(vagueGoalRule, [
      answer(Q.SUCCESS_6_MONTHS, "Ir bem."),
    ]);
    expect(hit).not.toBeNull();
  });

  it("doesn't fire when there's a number", () => {
    expect(
      evaluate(vagueGoalRule, [
        answer(Q.SUCCESS_6_MONTHS, "Quero crescer para 30 clientes por mês"),
      ]),
    ).toBeNull();
  });

  it("doesn't fire on a long, specific goal", () => {
    expect(
      evaluate(vagueGoalRule, [
        answer(
          Q.SUCCESS_6_MONTHS,
          "Ter agenda cheia de casamentos na alta temporada e fechar contrato fixo com dois buffets da região",
        ),
      ]),
    ).toBeNull();
  });

  it("doesn't fire when the question wasn't answered", () => {
    expect(evaluate(vagueGoalRule, [])).toBeNull();
    expect(
      evaluate(vagueGoalRule, [answer(Q.SUCCESS_6_MONTHS, "   ")]),
    ).toBeNull();
  });
});

describe("broad_audience", () => {
  it("fires on a broad term even in a long answer", () => {
    // Long enough not to hit the length criterion: isolates the keyword-list
    // path.
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

  it("fires on a too-short answer", () => {
    expect(
      evaluate(broadAudienceRule, [answer(Q.IDEAL_CLIENT, "Mulheres")]),
    ).not.toBeNull();
  });

  it("doesn't fire on a segmented audience", () => {
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
  it("fires when there are only generic terms", () => {
    const hit = evaluate(genericDifferentiatorRule, [
      answer(Q.DIFFERENTIATOR, "Qualidade e bom atendimento"),
    ]);
    expect(hit).not.toBeNull();
  });

  it("doesn't fire when there's substance alongside the generic term", () => {
    expect(
      evaluate(genericDifferentiatorRule, [
        answer(
          Q.DIFFERENTIATOR,
          "Qualidade no acabamento: sou o único ateliê da cidade com forno a lenha importado e massa fermentada por 48 horas",
        ),
      ]),
    ).toBeNull();
  });

  it("doesn't fire when no generic term appears", () => {
    expect(
      evaluate(genericDifferentiatorRule, [
        answer(Q.DIFFERENTIATOR, "Entrego em 24 horas com rastreio"),
      ]),
    ).toBeNull();
  });
});

describe("positioning_gap", () => {
  it("fires when the perceptions share no vocabulary", () => {
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

  it("doesn't fire when the perceptions are close", () => {
    expect(
      evaluate(positioningGapRule, [
        answer(Q.CURRENT_PERCEPTION, "Confeitaria artesanal de bairro conhecida pelos bolos"),
        answer(Q.DESIRED_PERCEPTION, "Confeitaria artesanal de bairro referência em bolos"),
      ]),
    ).toBeNull();
  });

  it("doesn't fire if one of the two perceptions is missing", () => {
    expect(
      evaluate(positioningGapRule, [
        answer(Q.CURRENT_PERCEPTION, "Padaria de bairro"),
      ]),
    ).toBeNull();
  });
});

describe("unclear_conversion", () => {
  it("fires when the purchase process wasn't described", () => {
    const hit = evaluate(unclearConversionRule, []);
    expect(hit).not.toBeNull();
    // There's no answer to trace.
    expect(hit?.sourceAnswerIds).toEqual([]);
  });

  it("fires when the description is too short", () => {
    const hit = evaluate(unclearConversionRule, [
      answer(Q.PURCHASE_PROCESS, "Chama no direct"),
    ]);
    expect(hit).not.toBeNull();
    expect(hit?.sourceAnswerIds).toEqual([`ans-${Q.PURCHASE_PROCESS}`]);
  });

  it("doesn't fire when the path is detailed", () => {
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
  it("fires with an active channel and sporadic posting", () => {
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

  it("fires when posting stopped", () => {
    expect(
      evaluate(inconsistentPresenceRule, [
        answer(Q.ACTIVE_CHANNELS, ["instagram"]),
        answer(Q.POSTING_FREQUENCY, POSTING.STOPPED),
      ]),
    ).not.toBeNull();
  });

  it("doesn't fire with a regular cadence", () => {
    expect(
      evaluate(inconsistentPresenceRule, [
        answer(Q.ACTIVE_CHANNELS, ["instagram"]),
        answer(Q.POSTING_FREQUENCY, POSTING.WEEKLY),
      ]),
    ).toBeNull();
  });

  it("doesn't fire without any active channel", () => {
    expect(
      evaluate(inconsistentPresenceRule, [
        answer(Q.ACTIVE_CHANNELS, []),
        answer(Q.POSTING_FREQUENCY, POSTING.SPORADIC),
      ]),
    ).toBeNull();
  });
});

describe("paid_traffic_no_metrics", () => {
  it("fires when they invested but cite no number", () => {
    const hit = evaluate(paidTrafficNoMetricsRule, [
      answer(Q.PAID_TRAFFIC, "Já impulsionei publicação no Instagram, veio bastante gente"),
    ]);
    expect(hit).not.toBeNull();
    expect(hit?.sourceAnswerIds).toEqual([`ans-${Q.PAID_TRAFFIC}`]);
  });

  it("doesn't fire when there's a number", () => {
    expect(
      evaluate(paidTrafficNoMetricsRule, [
        answer(Q.PAID_TRAFFIC, "Investi R$ 300 e trouxe 12 pedidos"),
      ]),
    ).toBeNull();
  });

  it("doesn't fire for someone who never invested", () => {
    expect(
      evaluate(paidTrafficNoMetricsRule, [
        answer(Q.PAID_TRAFFIC, "Nunca investi em anúncio"),
      ]),
    ).toBeNull();
    expect(
      evaluate(paidTrafficNoMetricsRule, [answer(Q.PAID_TRAFFIC, "Não")]),
    ).toBeNull();
  });

  it("has light severity", () => {
    expect(paidTrafficNoMetricsRule.severity).toBe("light");
  });
});

describe("goal_behavior_contradiction", () => {
  it("fires with a sales goal and no mention of conversion", () => {
    const hit = evaluate(goalBehaviorContradictionRule, [
      answer(Q.CLOSEST_GOAL, GOAL.SALES),
      answer(Q.ACTIVE_CHANNELS, ["instagram"]),
      answer(Q.WHAT_WORKED, "Postar bastidores da produção"),
    ]);
    expect(hit).not.toBeNull();
  });

  it("also fires for a leads goal", () => {
    expect(
      evaluate(goalBehaviorContradictionRule, [
        answer(Q.CLOSEST_GOAL, GOAL.LEADS),
        answer(Q.WHAT_WORKED, "Fotos bonitas dos produtos"),
      ]),
    ).not.toBeNull();
  });

  it("doesn't fire when the digital presence mentions conversion", () => {
    expect(
      evaluate(goalBehaviorContradictionRule, [
        answer(Q.CLOSEST_GOAL, GOAL.SALES),
        answer(Q.WHAT_WORKED, "Stories com link na bio para o checkout"),
      ]),
    ).toBeNull();
  });

  it("doesn't fire for non-conversion goals", () => {
    expect(
      evaluate(goalBehaviorContradictionRule, [
        answer(Q.CLOSEST_GOAL, GOAL.AUTHORITY),
        answer(Q.WHAT_WORKED, "Postar bastidores"),
      ]),
    ).toBeNull();
  });

  it("traces the goal and the digital-presence answers", () => {
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
  it("fires for a freelancer in a regulated field with no mention of restrictions", () => {
    const hit = evaluate(
      regulatedProfessionFlagRule,
      [answer(Q.BUSINESS_DESCRIPTION, "Sou nutricionista e atendo online")],
      "freelancer",
    );
    expect(hit).not.toBeNull();
    expect(hit?.sourceAnswerIds).toEqual([`ans-${Q.BUSINESS_DESCRIPTION}`]);
  });

  it("doesn't fire when the business type isn't freelancer", () => {
    expect(
      evaluate(
        regulatedProfessionFlagRule,
        [answer(Q.BUSINESS_DESCRIPTION, "Clínica de nutrição")],
        "local_business",
      ),
    ).toBeNull();
  });

  it("doesn't fire in an unregulated field", () => {
    expect(
      evaluate(
        regulatedProfessionFlagRule,
        [answer(Q.BUSINESS_DESCRIPTION, "Faço bolos por encomenda")],
        "freelancer",
      ),
    ).toBeNull();
  });

  it("doesn't fire when advertising caution is already mentioned", () => {
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

  it("doesn't fire when the council branch question was answered", () => {
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

describe("rule registry", () => {
  it("exposes the 9 specified rules, with unique codes", () => {
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

  it("associates each rule with a valid diagnosis category", () => {
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
  it("doesn't evaluate answers to invisible questions", () => {
    // `business_description` is only visible to freelancers in this artificial
    // catalog; since the briefing is ecommerce, the answer must not feed
    // regulated_profession_flag.
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

  it("returns a complete signal per rule that fires", () => {
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
