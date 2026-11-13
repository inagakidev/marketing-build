/**
 * Term lists used by the signal rules.
 *
 * Kept isolated here on purpose: tuning the vocabulary (almost always what
 * needs refining after seeing real briefings) shouldn't require touching the
 * rules' logic. Terms are matched against Portuguese answers in normalized
 * form (lowercase, no accents), so write them lowercase and without accents.
 */

/** Vague goals: growth with no number or deadline. */
export const VAGUE_GOAL_TERMS: readonly string[] = [
  "crescer",
  "crescimento",
  "mais seguidores",
  "seguidores",
  "ficar conhecido",
  "ser conhecido",
  "ficar conhecida",
  "bombar",
  "estourar",
  "viralizar",
  "aparecer mais",
  "ter visibilidade",
  "mais visibilidade",
  "vender mais",
  "faturar mais",
  "expandir",
  "decolar",
  "alavancar",
  "engajamento",
  "mais clientes",
];

/** An audience with no segmentation at all. */
export const BROAD_AUDIENCE_TERMS: readonly string[] = [
  "todo mundo",
  "todos",
  "qualquer pessoa",
  "qualquer um",
  "qualquer",
  "geral",
  "publico geral",
  "todas as pessoas",
  "de tudo um pouco",
  "varios perfis",
  "qualquer idade",
];

/** Differentiators any competitor would also claim. */
export const GENERIC_DIFFERENTIATOR_TERMS: readonly string[] = [
  "qualidade",
  "bom atendimento",
  "otimo atendimento",
  "atendimento",
  "preco justo",
  "preco bom",
  "melhor preco",
  "compromisso",
  "comprometimento",
  "dedicacao",
  "profissionalismo",
  "responsabilidade",
  "confianca",
  "seriedade",
  "honestidade",
  "pontualidade",
  "carinho",
  "amor",
  "experiencia",
];

/**
 * Mentions of a call to action or an offer. Their absence, with a sales/leads
 * goal, is what characterizes `goal_behavior_contradiction`.
 */
export const CTA_OFFER_TERMS: readonly string[] = [
  "cta",
  "chamada para acao",
  "chamada pra acao",
  "call to action",
  "link na bio",
  "clique",
  "compre",
  "comprar",
  "venda",
  "vendas",
  "oferta",
  "ofertas",
  "promocao",
  "promocoes",
  "desconto",
  "cupom",
  "orcamento",
  "agendar",
  "agendamento",
  "contato",
  "whatsapp",
  "formulario",
  "cadastro",
  "inscricao",
  "lead",
  "leads",
  "captura",
  "checkout",
  "carrinho",
  "landing page",
  "conversao",
];

/**
 * Fields whose advertising is regulated by a professional council. Used by
 * `regulated_profession_flag`.
 */
export const REGULATED_FIELD_TERMS: readonly string[] = [
  // health
  "medico", "medica", "medicina", "clinica", "consultorio", "saude",
  "psicologo", "psicologa", "psicologia", "terapeuta", "terapia",
  "nutricionista", "nutricao", "dentista", "odontologia", "odontologica",
  "fisioterapeuta", "fisioterapia", "enfermeiro", "enfermeira", "enfermagem",
  "farmaceutico", "farmacia", "veterinario", "veterinaria", "psiquiatra",
  "estetica", "harmonizacao", "botox", "preenchimento", "cirurgia",
  "cirurgiao", "dermatologia", "nutrologia",
  // law
  "advogado", "advogada", "advocacia", "juridico", "juridica", "direito",
  "escritorio de advocacia", "oab",
  // finance / accounting
  "contador", "contadora", "contabilidade", "contabil",
  "consultor financeiro", "investimentos", "assessor de investimentos",
  "corretora", "credito", "financas", "planejador financeiro", "cvm",
];

/**
 * Signs that the person already accounts for the field's advertising
 * restrictions. When present, `regulated_profession_flag` doesn't fire.
 */
export const REGULATION_AWARENESS_TERMS: readonly string[] = [
  "conselho",
  "crm",
  "crp",
  "cro",
  "crn",
  "crefito",
  "coren",
  "crmv",
  "crc",
  "oab",
  "cvm",
  "codigo de etica",
  "etica",
  "regulamentacao",
  "regulamentado",
  "regulamentada",
  "restricao",
  "restricoes",
  "publicidade medica",
  "resolucao",
  "normativa",
  "compliance",
  "nao posso divulgar",
  "vedado",
];

/**
 * Answers that deny any paid-traffic investment. When present, asking for
 * metrics makes no sense — there was no investment to measure.
 */
export const NO_PAID_TRAFFIC_TERMS: readonly string[] = [
  "nao",
  "nunca",
  "jamais",
  "nenhum",
  "nenhuma",
  "ainda nao",
  "nunca investi",
  "nao investi",
  "nunca fiz",
  "nao fiz",
  "nunca usei",
  "sem investimento",
  "zero",
  "nada",
  "pretendo",
  "gostaria",
];

/**
 * Terms indicating the purchase process was actually described, not just
 * mentioned. Reserved for a future evolution of `unclear_conversion`.
 */
export const PURCHASE_STEP_TERMS: readonly string[] = [
  "site",
  "whatsapp",
  "instagram",
  "direct",
  "telefone",
  "email",
  "loja",
  "atendimento",
  "orcamento",
  "proposta",
  "reuniao",
  "visita",
  "checkout",
  "carrinho",
  "pagamento",
  "pix",
  "cartao",
  "boleto",
];
