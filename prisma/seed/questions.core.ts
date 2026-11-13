import { GOAL, POSTING, Q } from "../../src/core/questionKeys";
import { options, type QuestionSeed } from "./types";

/**
 * Fixed core: the 30 questions EVERY respondent sees, regardless of business
 * type.
 *
 * The order of this list is the order in which questions appear within each
 * form block — reordering means moving lines.
 *
 * Question texts and option labels are user-facing (pt-BR).
 */
export const CORE_QUESTIONS: QuestionSeed[] = [
  // -------------------------------------------------------------------------
  // The business
  // -------------------------------------------------------------------------
  {
    key: Q.BUSINESS_NAME,
    text: "Qual é o nome do seu negócio ou da sua marca?",
    category: "business",
    answerType: "short_text",
    required: true,
  },
  {
    key: Q.BUSINESS_DESCRIPTION,
    text: "Em uma frase, o que o seu negócio faz?",
    category: "business",
    answerType: "short_text",
    required: true,
    helpText:
      "Como você explicaria para alguém que acabou de conhecer você numa conversa.",
  },
  {
    key: Q.BUSINESS_TYPE,
    text: "Qual dessas opções descreve melhor o seu modelo de negócio?",
    category: "business",
    answerType: "single_choice",
    required: true,
    helpText:
      "Sua resposta define algumas perguntas específicas mais adiante no formulário.",
    options: options(
      ["local_business", "Negócio local (atendo uma cidade ou região)"],
      ["ecommerce", "Loja online / e-commerce"],
      ["info_product", "Produto digital, curso ou infoproduto"],
      ["freelancer", "Profissional autônomo / prestador de serviço"],
      ["b2b_service", "Serviço para outras empresas (B2B)"],
      ["other", "Outro"],
    ),
  },
  {
    key: Q.BUSINESS_AGE,
    text: "Há quanto tempo o negócio existe?",
    category: "business",
    answerType: "single_choice",
    required: true,
    options: options(
      ["menos_1_ano", "Menos de 1 ano"],
      ["1_a_3_anos", "Entre 1 e 3 anos"],
      ["mais_3_anos", "Mais de 3 anos"],
    ),
  },
  {
    key: Q.PRODUCTS_SERVICES,
    text: "Quais são os seus principais produtos ou serviços?",
    category: "business",
    answerType: "long_text",
    required: true,
  },
  {
    key: Q.DIFFERENTIATOR,
    text: "O que faz alguém escolher você em vez de um concorrente?",
    category: "business",
    answerType: "long_text",
    required: true,
    helpText:
      "Tente ir além de qualidade e bom atendimento — o que só você tem ou faz?",
  },

  // -------------------------------------------------------------------------
  // Goals
  // -------------------------------------------------------------------------
  {
    key: Q.MARKETING_REASON,
    text: "Por que você está buscando marketing agora?",
    category: "goals",
    answerType: "long_text",
    required: true,
    helpText: "O que mudou ou o que aconteceu para isso virar prioridade.",
  },
  {
    key: Q.SUCCESS_6_MONTHS,
    text: "Daqui a 6 meses, o que precisaria ter acontecido para você considerar que deu certo?",
    category: "goals",
    answerType: "long_text",
    required: true,
    helpText:
      "Se conseguir, use números e prazos — fica muito mais fácil medir depois.",
  },
  {
    key: Q.CLOSEST_GOAL,
    text: "Qual desses objetivos está mais próximo do que você precisa hoje?",
    category: "goals",
    answerType: "single_choice",
    required: true,
    options: options(
      [GOAL.RECOGNITION, "Ser mais reconhecido / conhecido"],
      [GOAL.SALES, "Vender mais"],
      [GOAL.LEADS, "Gerar contatos e oportunidades (leads)"],
      [GOAL.RETENTION, "Fidelizar quem já é cliente"],
      [GOAL.AUTHORITY, "Construir autoridade no meu assunto"],
    ),
  },
  {
    key: Q.MAIN_PAIN,
    text: "O que mais te incomoda hoje no seu marketing?",
    category: "goals",
    answerType: "long_text",
    required: true,
  },

  // -------------------------------------------------------------------------
  // Audience
  // -------------------------------------------------------------------------
  {
    key: Q.IDEAL_CLIENT,
    text: "Como é o seu cliente ideal?",
    category: "audience",
    answerType: "long_text",
    required: true,
    helpText:
      "Quanto mais específico, melhor: quem é, o que faz, o que valoriza.",
  },
  {
    key: Q.AUDIENCE_PAIN,
    text: "Que dor ou desejo leva essa pessoa a procurar você?",
    category: "audience",
    answerType: "long_text",
    required: true,
  },
  {
    key: Q.AUDIENCE_AGE_RANGE,
    text: "Qual é a faixa etária predominante do seu público?",
    category: "audience",
    answerType: "single_choice",
    options: options(
      ["ate_24", "Até 24 anos"],
      ["25_34", "25 a 34 anos"],
      ["35_44", "35 a 44 anos"],
      ["45_59", "45 a 59 anos"],
      ["60_mais", "60 anos ou mais"],
      ["varia", "Varia bastante"],
    ),
  },
  {
    key: Q.AUDIENCE_TOUCHPOINTS,
    text: "Por onde as pessoas costumam encontrar o seu negócio hoje?",
    category: "audience",
    answerType: "multi_choice",
    options: options(
      ["indicacao", "Indicação de outros clientes"],
      ["busca_google", "Busca no Google"],
      ["redes_sociais", "Redes sociais"],
      ["passando_na_frente", "Passando em frente / ponto físico"],
      ["marketplace", "Marketplace"],
      ["eventos", "Eventos e feiras"],
      ["parcerias", "Parcerias"],
      ["anuncios", "Anúncios pagos"],
    ),
  },

  // -------------------------------------------------------------------------
  // Brand
  // -------------------------------------------------------------------------
  {
    key: Q.BRAND_AS_PERSON,
    text: "Se a sua marca fosse uma pessoa, como ela seria?",
    category: "brand",
    answerType: "long_text",
    helpText: "Jeito de falar, personalidade, o que ela nunca faria.",
  },
  {
    key: Q.CURRENT_PERCEPTION,
    text: "Como você acha que as pessoas enxergam a sua marca hoje?",
    category: "brand",
    answerType: "long_text",
    required: true,
  },
  {
    key: Q.DESIRED_PERCEPTION,
    text: "E como você gostaria que elas enxergassem?",
    category: "brand",
    answerType: "long_text",
    required: true,
  },

  // -------------------------------------------------------------------------
  // Competition
  // -------------------------------------------------------------------------
  {
    key: Q.DIRECT_COMPETITORS,
    text: "Quem você considera seus concorrentes diretos?",
    category: "competition",
    answerType: "long_text",
  },
  {
    key: Q.REFERENCE_BRAND,
    text: "Existe alguma marca que você admira e usa como referência?",
    category: "competition",
    answerType: "long_text",
    helpText: "Pode ser de qualquer setor — o que importa é o que te atrai nela.",
  },

  // -------------------------------------------------------------------------
  // Digital presence
  // -------------------------------------------------------------------------
  {
    key: Q.ACTIVE_CHANNELS,
    text: "Em quais canais o seu negócio está presente hoje?",
    category: "digital_presence",
    answerType: "multi_choice",
    helpText: "Marque só os que estão realmente ativos.",
    options: options(
      ["instagram", "Instagram"],
      ["facebook", "Facebook"],
      ["tiktok", "TikTok"],
      ["youtube", "YouTube"],
      ["linkedin", "LinkedIn"],
      ["whatsapp", "WhatsApp"],
      ["site", "Site próprio"],
      ["blog", "Blog"],
      ["google_perfil", "Google Perfil da Empresa"],
      ["email", "E-mail / newsletter"],
      ["nenhum", "Nenhum por enquanto"],
    ),
  },
  {
    key: Q.POSTING_FREQUENCY,
    text: "Com que frequência você publica nesses canais?",
    category: "digital_presence",
    answerType: "single_choice",
    // Asking about cadence only makes sense for someone who declared a channel.
    visibilityRule: { field: `answer:${Q.ACTIVE_CHANNELS}`, operator: "not_empty" },
    options: options(
      [POSTING.DAILY, "Praticamente todo dia"],
      [POSTING.WEEKLY, "Toda semana"],
      [POSTING.BIWEEKLY, "A cada duas semanas"],
      [POSTING.SPORADIC, "De vez em quando, sem rotina"],
      [POSTING.STOPPED, "Parei de publicar"],
    ),
  },
  {
    key: Q.PAID_TRAFFIC,
    text: "Você já investiu em anúncios pagos? Como foi o resultado?",
    category: "digital_presence",
    answerType: "long_text",
    helpText:
      "Se lembrar de valores ou números, mesmo aproximados, ajuda bastante.",
  },
  {
    key: Q.WHAT_WORKED,
    text: "O que já deu certo no seu marketing até hoje?",
    category: "digital_presence",
    answerType: "long_text",
  },
  {
    key: Q.WHAT_DID_NOT_WORK,
    text: "E o que você tentou que não funcionou?",
    category: "digital_presence",
    answerType: "long_text",
  },

  // -------------------------------------------------------------------------
  // Offer
  // -------------------------------------------------------------------------
  {
    key: Q.MAIN_OFFER,
    text: "Qual produto ou serviço é o mais importante para você agora?",
    category: "offer",
    answerType: "short_text",
    required: true,
  },
  {
    key: Q.AVERAGE_TICKET,
    text: "Qual é o seu ticket médio?",
    category: "offer",
    answerType: "short_text",
    helpText: "Um valor aproximado já ajuda.",
  },
  {
    key: Q.COMMON_OBJECTIONS,
    text: "Quais são as objeções mais comuns de quem quase compra?",
    category: "offer",
    answerType: "long_text",
    helpText: 'O clássico "vou pensar" — e o que costuma estar por trás dele.',
  },
  {
    key: Q.PURCHASE_PROCESS,
    text: "Como é o caminho do primeiro contato até a compra hoje?",
    category: "offer",
    answerType: "long_text",
    helpText: "Descreva as etapas, mesmo que sejam informais.",
  },

  // -------------------------------------------------------------------------
  // Wrap-up
  // -------------------------------------------------------------------------
  {
    key: Q.ANYTHING_ELSE,
    text: "Tem algo importante que não foi perguntado aqui?",
    category: "closing",
    answerType: "long_text",
  },
  {
    key: Q.CONSTRAINTS,
    text: "Existe algum prazo, orçamento ou restrição que eu preciso saber?",
    category: "closing",
    answerType: "long_text",
  },
];
