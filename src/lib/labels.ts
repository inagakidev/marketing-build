/**
 * Portuguese (user-facing) labels for the database enums, for the panel and
 * the PDF.
 *
 * They live outside `src/core` because they're presentation, not business
 * rules — the engine works with the codes.
 */

export const BRIEFING_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  awaiting_response: "Aguardando resposta",
  in_progress: "Em preenchimento",
  submitted: "Enviado",
  ready_for_review: "Pronto para revisão",
  approved: "Aprovado",
};

/**
 * Status pill tone (DS v2 semantic colors): neutral while nothing happened,
 * info while the client is answering, warning when it asks for the team's
 * review, success once approved.
 */
export const BRIEFING_STATUS_TONE: Record<
  string,
  "neutral" | "info" | "warning" | "success"
> = {
  draft: "neutral",
  awaiting_response: "info",
  in_progress: "info",
  submitted: "warning",
  ready_for_review: "warning",
  approved: "success",
};

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  local_business: "Negócio local",
  ecommerce: "E-commerce",
  info_product: "Produto digital",
  freelancer: "Autônomo",
  b2b_service: "Serviço B2B",
  other: "Outro",
};

export const DIAGNOSIS_STATUS_LABELS: Record<string, string> = {
  green: "Bem definida",
  yellow: "Precisa de atenção",
  red: "Pouco definida",
  gray: "Sem dados suficientes",
};

export const SEVERITY_LABELS: Record<string, string> = {
  light: "Leve",
  moderate: "Moderado",
  strong: "Forte",
};

/** Traffic-light classes. Contrast checked in light and dark themes. */
/** DS v2 semantic families; the label always goes with the color. */
export const DIAGNOSIS_STATUS_CLASSES: Record<string, string> = {
  green: "bg-(--success-bg) text-(--success-text) border-(--success-border)",
  yellow: "bg-(--warning-bg) text-(--warning-text) border-(--warning-border)",
  red: "bg-(--danger-bg) text-(--danger-text) border-(--danger-border)",
  gray: "bg-(--draft-bg) text-(--draft-text) border-(--draft-border)",
};

export function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Organization roles (D9), as the invite page and members screen show them. */
export const MEMBERSHIP_ROLE_LABELS: Record<string, string> = {
  admin: "Pessoa administradora",
  leader: "Líder",
  member: "Membro",
};
