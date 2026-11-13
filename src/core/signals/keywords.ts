/**
 * Listas de termos usadas pelas regras de sinal.
 *
 * Ficam isoladas aqui de propósito: ajustar o vocabulário (o que quase sempre
 * é o que se quer afinar depois de ver briefings reais) não deve exigir tocar
 * na lógica das regras. Todos os termos são comparados já normalizados
 * (minúsculo, sem acento), então escreva-os em minúsculo e sem acento.
 */

/** Metas vagas: crescimento sem número nem prazo. */
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

/** Público sem recorte nenhum. */
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

/** Diferenciais que qualquer concorrente também alegaria. */
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
 * Menções a chamada para ação ou oferta. A ausência delas, com objetivo de
 * vendas/leads, é o que caracteriza `goal_behavior_contradiction`.
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
 * Áreas com publicidade regulada por conselho de classe. Vale para
 * `regulated_profession_flag`.
 */
export const REGULATED_FIELD_TERMS: readonly string[] = [
  // saúde
  "medico", "medica", "medicina", "clinica", "consultorio", "saude",
  "psicologo", "psicologa", "psicologia", "terapeuta", "terapia",
  "nutricionista", "nutricao", "dentista", "odontologia", "odontologica",
  "fisioterapeuta", "fisioterapia", "enfermeiro", "enfermeira", "enfermagem",
  "farmaceutico", "farmacia", "veterinario", "veterinaria", "psiquiatra",
  "estetica", "harmonizacao", "botox", "preenchimento", "cirurgia",
  "cirurgiao", "dermatologia", "nutrologia",
  // direito
  "advogado", "advogada", "advocacia", "juridico", "juridica", "direito",
  "escritorio de advocacia", "oab",
  // finanças / contábil
  "contador", "contadora", "contabilidade", "contabil",
  "consultor financeiro", "investimentos", "assessor de investimentos",
  "corretora", "credito", "financas", "planejador financeiro", "cvm",
];

/**
 * Sinais de que a pessoa já considera as restrições de divulgação da área.
 * Presentes, o `regulated_profession_flag` não dispara.
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
 * Respostas que negam investimento em tráfego pago. Presentes, não faz sentido
 * cobrar métricas — não houve investimento a medir.
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
 * Termos que indicam que o processo de compra foi de fato descrito, e não
 * apenas mencionado. Reservado para evolução de `unclear_conversion`.
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
