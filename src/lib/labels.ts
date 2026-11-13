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

/** Status badge color. */
export const BRIEFING_STATUS_TONE: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  awaiting_response: "secondary",
  in_progress: "secondary",
  submitted: "default",
  ready_for_review: "default",
  approved: "default",
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
export const DIAGNOSIS_STATUS_CLASSES: Record<string, string> = {
  green:
    "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
  yellow:
    "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  red: "bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
  gray: "bg-muted text-muted-foreground border-border",
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
