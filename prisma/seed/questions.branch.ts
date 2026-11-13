import { Q } from "../../src/core/questionKeys";
import { onlyFor, options, type QuestionSeed } from "./types";

/**
 * Branch questions: appear depending on the `business_type` answer.
 *
 * All of them carry a `visibilityRule` — the condition lives in DATA, not in
 * code. There's no `if (businessType === ...)` anywhere in the system.
 *
 * Each question gets the category that makes most sense to the respondent,
 * not a "branch" category: that way it appears in the right form block, next
 * to the core questions it relates to.
 *
 * All are optional. Making them required would let any incomplete briefing
 * drop the whole category to gray — too harsh a penalty for a follow-up
 * question.
 *
 * Question texts and option labels are user-facing (pt-BR).
 */
export const BRANCH_QUESTIONS: QuestionSeed[] = [
  // -------------------------------------------------------------------------
  // Local business
  // -------------------------------------------------------------------------
  {
    key: Q.LOCAL_CITY_REGION,
    text: "Qual cidade ou região você atende?",
    category: "business",
    answerType: "short_text",
    visibilityRule: onlyFor("local_business"),
  },
  {
    key: Q.LOCAL_SERVICE_MODE,
    text: "O atendimento é presencial, remoto ou por entrega?",
    category: "business",
    answerType: "single_choice",
    visibilityRule: onlyFor("local_business"),
    options: options(
      ["presencial", "Só presencial"],
      ["delivery", "Presencial e entrega/delivery"],
      ["remoto", "Também atendo remotamente"],
    ),
  },
  {
    key: Q.LOCAL_UNITS_COUNT,
    text: "Quantas unidades ou pontos de atendimento você tem?",
    category: "business",
    answerType: "single_choice",
    visibilityRule: onlyFor("local_business"),
    options: options(
      ["uma", "Uma"],
      ["duas_tres", "Duas ou três"],
      ["mais_tres", "Mais de três"],
      ["sem_ponto", "Não tenho ponto fixo"],
    ),
  },
  {
    key: Q.LOCAL_GOOGLE_PROFILE,
    text: "Seu negócio está cadastrado no Google Perfil da Empresa?",
    category: "digital_presence",
    answerType: "single_choice",
    visibilityRule: onlyFor("local_business"),
    helpText: "É o cartão que aparece no Google Maps e na busca.",
    options: options(
      ["sim_atualizado", "Sim, e mantenho atualizado"],
      ["sim_parado", "Sim, mas está parado"],
      ["nao", "Não"],
      ["nao_sei", "Não sei"],
    ),
  },
  {
    key: Q.LOCAL_HOW_FOUND,
    text: "Como as pessoas da região costumam descobrir você?",
    category: "audience",
    answerType: "multi_choice",
    visibilityRule: onlyFor("local_business"),
    options: options(
      ["busca", "Procurando no Google ou no Maps"],
      ["indicacao", "Indicação de conhecidos"],
      ["redes", "Redes sociais"],
      ["passando", "Passando em frente"],
    ),
  },

  // -------------------------------------------------------------------------
  // E-commerce
  // -------------------------------------------------------------------------
  {
    key: Q.ECOM_SALES_CHANNELS,
    text: "Você vende em site próprio, marketplace ou os dois?",
    category: "offer",
    answerType: "single_choice",
    visibilityRule: onlyFor("ecommerce"),
    options: options(
      ["site_proprio", "Só site próprio"],
      ["marketplace", "Só marketplace"],
      ["ambos", "Os dois"],
    ),
  },
  {
    key: Q.ECOM_MAIN_BOTTLENECK,
    text: "Hoje, qual é o seu maior gargalo?",
    category: "goals",
    answerType: "single_choice",
    visibilityRule: onlyFor("ecommerce"),
    options: options(
      ["atrair", "Atrair visitantes para a loja"],
      ["converter", "Converter quem visita em comprador"],
      ["recompra", "Fazer quem já comprou voltar"],
    ),
  },
  {
    key: Q.ECOM_SHIPPING,
    text: "Como está a situação do frete?",
    category: "offer",
    answerType: "long_text",
    visibilityRule: onlyFor("ecommerce"),
    helpText: "Prazo, custo, se oferece frete grátis, se é uma reclamação comum.",
  },
  {
    key: Q.ECOM_CONVERSION_TRACKING,
    text: "Você acompanha a sua taxa de conversão?",
    category: "digital_presence",
    answerType: "single_choice",
    visibilityRule: onlyFor("ecommerce"),
    options: options(
      ["sim_sei", "Sim, e sei o número atual"],
      ["sim_nao_olho", "Está configurado, mas não acompanho"],
      ["nao", "Não acompanho"],
      ["nao_sei", "Não sei o que é"],
    ),
  },

  // -------------------------------------------------------------------------
  // Digital product / info product
  // -------------------------------------------------------------------------
  {
    key: Q.INFO_AUDIENCE_STATUS,
    text: "Você já tem audiência ou está começando do zero?",
    category: "audience",
    answerType: "single_choice",
    visibilityRule: onlyFor("info_product"),
    options: options(
      ["zero", "Começando do zero"],
      ["pequena", "Tenho uma base pequena"],
      ["consolidada", "Tenho audiência consolidada"],
    ),
  },
  {
    key: Q.INFO_LAUNCH_HISTORY,
    text: "Você já lançou esse produto antes?",
    category: "goals",
    answerType: "single_choice",
    visibilityRule: onlyFor("info_product"),
    options: options(
      ["nunca", "Nunca lancei"],
      ["lancamento_unico", "Já fiz lançamentos pontuais"],
      ["perpetuo", "Vendo de forma contínua (perpétuo)"],
    ),
  },
  {
    key: Q.INFO_TRANSFORMATION,
    text: "Qual é a transformação que o seu produto entrega?",
    category: "offer",
    answerType: "long_text",
    visibilityRule: onlyFor("info_product"),
    helpText: "Onde a pessoa está antes de comprar e onde ela chega depois.",
  },
  {
    key: Q.INFO_SOCIAL_PROOF,
    text: "Você já tem depoimentos ou resultados de alunos para mostrar?",
    category: "offer",
    answerType: "single_choice",
    visibilityRule: onlyFor("info_product"),
    options: options(
      ["muitos", "Sim, vários"],
      ["poucos", "Alguns"],
      ["nenhum", "Ainda não tenho"],
    ),
  },

  // -------------------------------------------------------------------------
  // Freelancer
  // -------------------------------------------------------------------------
  {
    key: Q.FREE_TEAM_SETUP,
    text: "Você atende sozinho ou tem equipe?",
    category: "business",
    answerType: "single_choice",
    visibilityRule: onlyFor("freelancer"),
    options: options(
      ["sozinho", "Sozinho"],
      ["parceiros", "Com parceiros pontuais"],
      ["equipe", "Tenho equipe fixa"],
    ),
  },
  {
    key: Q.FREE_CLIENT_NEED,
    text: "Você precisa de mais clientes ou de clientes melhores?",
    category: "goals",
    answerType: "single_choice",
    visibilityRule: onlyFor("freelancer"),
    options: options(
      ["mais", "Mais clientes — a agenda tem buracos"],
      ["melhores", "Clientes melhores — quero subir o ticket"],
      ["ambos", "Os dois"],
    ),
  },
  {
    key: Q.FREE_PERSONAL_EXPOSURE,
    text: "Você tem liberdade e vontade de aparecer pessoalmente?",
    category: "brand",
    answerType: "single_choice",
    visibilityRule: onlyFor("freelancer"),
    helpText: "Vídeo, foto, bastidores — não tem resposta certa aqui.",
    options: options(
      ["sim", "Sim, sem problema"],
      ["pouco", "Um pouco, com moderação"],
      ["nao", "Prefiro não aparecer"],
    ),
  },
  {
    key: Q.FREE_REGULATED_COUNCIL,
    text: "Existe alguma restrição de conselho de classe na sua divulgação?",
    category: "business",
    answerType: "single_choice",
    visibilityRule: onlyFor("freelancer"),
    helpText:
      "Áreas como saúde, direito e finanças têm regras próprias de publicidade.",
    options: options(
      ["sim_conheco", "Sim, e conheço as regras"],
      ["sim_nao_conheco", "Sim, mas não conheço bem as regras"],
      ["nao", "Não há restrição na minha área"],
      ["nao_sei", "Não sei"],
    ),
  },

  // -------------------------------------------------------------------------
  // B2B service
  // -------------------------------------------------------------------------
  {
    key: Q.B2B_DECISION_CYCLE,
    text: "O ciclo de decisão do seu cliente é rápido ou longo?",
    category: "offer",
    answerType: "single_choice",
    visibilityRule: onlyFor("b2b_service"),
    options: options(
      ["rapido", "Rápido — dias"],
      ["medio", "Médio — algumas semanas"],
      ["longo", "Longo — meses"],
    ),
  },
  {
    key: Q.B2B_DECISION_MAKERS,
    text: "Quem decide a compra: uma pessoa ou vários aprovadores?",
    category: "offer",
    answerType: "single_choice",
    visibilityRule: onlyFor("b2b_service"),
    options: options(
      ["uma_pessoa", "Uma pessoa decide"],
      ["poucos", "Duas ou três pessoas"],
      ["comite", "Passa por comitê / vários aprovadores"],
    ),
  },
  {
    key: Q.B2B_DOCUMENTED_CASES,
    text: "Você tem cases documentados de clientes anteriores?",
    category: "competition",
    answerType: "single_choice",
    visibilityRule: onlyFor("b2b_service"),
    options: options(
      ["sim_publicos", "Sim, e posso divulgar"],
      ["sim_sigilo", "Tenho, mas sob sigilo"],
      ["nao", "Ainda não documentei"],
    ),
  },
  {
    key: Q.B2B_ACQUISITION_CHANNEL,
    text: "De onde vem a maior parte dos seus clientes hoje?",
    category: "digital_presence",
    answerType: "single_choice",
    visibilityRule: onlyFor("b2b_service"),
    options: options(
      ["indicacao", "Indicação e rede de contatos"],
      ["prospeccao", "Prospecção ativa"],
      ["inbound", "Eles me procuram (conteúdo, busca, redes)"],
      ["eventos", "Eventos e feiras do setor"],
    ),
  },
];
