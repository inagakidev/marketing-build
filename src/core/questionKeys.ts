/**
 * Chaves estáveis das perguntas e valores de opção.
 *
 * Fonte única de verdade compartilhada entre o seed (que grava as perguntas) e
 * o motor de regras (que as referencia). Um erro de digitação vira erro de
 * compilação em vez de uma regra que silenciosamente nunca dispara — que é
 * exatamente o tipo de bug que não aparece em teste manual.
 */

export const Q = {
  // business
  BUSINESS_NAME: "business_name",
  BUSINESS_DESCRIPTION: "business_description",
  /** Pergunta de ramificação: define a `businessType` do briefing. */
  BUSINESS_TYPE: "business_type",
  BUSINESS_AGE: "business_age",
  PRODUCTS_SERVICES: "products_services",
  DIFFERENTIATOR: "differentiator",

  // goals
  MARKETING_REASON: "marketing_reason",
  SUCCESS_6_MONTHS: "success_6_months",
  CLOSEST_GOAL: "closest_goal",
  MAIN_PAIN: "main_pain",

  // audience
  IDEAL_CLIENT: "ideal_client",
  AUDIENCE_PAIN: "audience_pain",
  AUDIENCE_AGE_RANGE: "audience_age_range",
  AUDIENCE_TOUCHPOINTS: "audience_touchpoints",

  // brand
  BRAND_AS_PERSON: "brand_as_person",
  CURRENT_PERCEPTION: "current_perception",
  DESIRED_PERCEPTION: "desired_perception",

  // competition
  DIRECT_COMPETITORS: "direct_competitors",
  REFERENCE_BRAND: "reference_brand",

  // digital_presence
  ACTIVE_CHANNELS: "active_channels",
  POSTING_FREQUENCY: "posting_frequency",
  PAID_TRAFFIC: "paid_traffic",
  WHAT_WORKED: "what_worked",
  WHAT_DID_NOT_WORK: "what_did_not_work",

  // offer
  MAIN_OFFER: "main_offer",
  AVERAGE_TICKET: "average_ticket",
  COMMON_OBJECTIONS: "common_objections",
  PURCHASE_PROCESS: "purchase_process",

  // closing
  ANYTHING_ELSE: "anything_else",
  CONSTRAINTS: "constraints",

  // ramificação — local_business
  LOCAL_CITY_REGION: "local_city_region",
  LOCAL_SERVICE_MODE: "local_service_mode",
  LOCAL_UNITS_COUNT: "local_units_count",
  LOCAL_GOOGLE_PROFILE: "local_google_profile",
  LOCAL_HOW_FOUND: "local_how_found",

  // ramificação — ecommerce
  ECOM_SALES_CHANNELS: "ecom_sales_channels",
  ECOM_MAIN_BOTTLENECK: "ecom_main_bottleneck",
  ECOM_SHIPPING: "ecom_shipping",
  ECOM_CONVERSION_TRACKING: "ecom_conversion_tracking",

  // ramificação — info_product
  INFO_AUDIENCE_STATUS: "info_audience_status",
  INFO_LAUNCH_HISTORY: "info_launch_history",
  INFO_TRANSFORMATION: "info_transformation",
  INFO_SOCIAL_PROOF: "info_social_proof",

  // ramificação — freelancer
  FREE_TEAM_SETUP: "free_team_setup",
  FREE_CLIENT_NEED: "free_client_need",
  FREE_PERSONAL_EXPOSURE: "free_personal_exposure",
  FREE_REGULATED_COUNCIL: "free_regulated_council",

  // ramificação — b2b_service
  B2B_DECISION_CYCLE: "b2b_decision_cycle",
  B2B_DECISION_MAKERS: "b2b_decision_makers",
  B2B_DOCUMENTED_CASES: "b2b_documented_cases",
  B2B_ACQUISITION_CHANNEL: "b2b_acquisition_channel",
} as const;

export type QuestionKey = (typeof Q)[keyof typeof Q];

// ---------------------------------------------------------------------------
// Valores de opção referenciados por regras
// ---------------------------------------------------------------------------

/** Opções de `closest_goal`. */
export const GOAL = {
  RECOGNITION: "reconhecimento",
  SALES: "vendas",
  LEADS: "leads",
  RETENTION: "fidelizacao",
  AUTHORITY: "autoridade",
} as const;

/** Opções de `posting_frequency`. */
export const POSTING = {
  DAILY: "diaria",
  WEEKLY: "semanal",
  BIWEEKLY: "quinzenal",
  SPORADIC: "esporadica",
  STOPPED: "parei",
} as const;

/**
 * Objetivos que exigem conversão — usados por `goal_behavior_contradiction`.
 */
export const CONVERSION_GOALS: readonly string[] = [GOAL.SALES, GOAL.LEADS];
