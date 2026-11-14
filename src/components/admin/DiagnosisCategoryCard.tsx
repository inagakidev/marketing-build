import { CircleCheck, CircleHelp, Flag, TriangleAlert, type LucideIcon } from "lucide-react";
import { DIAGNOSIS_STATUS_LABELS } from "@/lib/labels";
import { describeCategory } from "@/lib/diagnosisCopy";
import type { BriefingDetail } from "@/server/briefingDetail";

type Diagnosis = BriefingDetail["diagnoses"][number];

const TONE: Record<string, { pill: string; bar: string; icon: LucideIcon }> = {
  green: { pill: "bg-(--success-bg) text-(--success-text)", bar: "bg-(--success-text)", icon: CircleCheck },
  yellow: { pill: "bg-(--warning-bg) text-(--warning-text)", bar: "bg-(--warning-bar)", icon: TriangleAlert },
  red: { pill: "bg-(--danger-bg) text-(--danger-text)", bar: "bg-(--danger-text)", icon: Flag },
  gray: { pill: "bg-(--draft-bg) text-(--draft-text)", bar: "", icon: CircleHelp },
};

/**
 * One diagnosis category (DS v2 frame 04): icon + label + number, never color
 * alone. "Dados insuficientes" is neutral and dashed — a question without an
 * answer, not a bad result.
 */
export function DiagnosisCategoryCard({
  diagnosis,
  questionTextByKey,
}: {
  diagnosis: Diagnosis;
  questionTextByKey: Record<string, string>;
}) {
  const tone = TONE[diagnosis.status] ?? TONE.gray;
  const Icon = tone.icon;
  const scored = diagnosis.score != null && diagnosis.status !== "gray";
  const signalCount = diagnosis.signals.length;

  return (
    <article
      className={`flex flex-col gap-3 rounded-xl p-5 ${
        scored ? "border border-border bg-card" : "border-[1.5px] border-dashed border-(--border-control) bg-background"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">{diagnosis.label}</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {scored ? `${signalCount} ${signalCount === 1 ? "sinal" : "sinais"}` : "—"}
        </span>
      </div>

      <p className="flex items-baseline gap-2">
        <span
          className={`text-[2rem] leading-10 font-semibold tabular-nums ${scored ? "" : "text-muted-foreground"}`}
        >
          {scored ? diagnosis.score : "—"}
        </span>
        {scored && <span className="text-xs text-muted-foreground">/ 100</span>}
      </p>

      {/* Decorative: the number above and the label below say the same. */}
      <div
        aria-hidden
        className={`h-1.5 rounded-full ${
          scored ? "bg-muted" : "bg-[repeating-linear-gradient(90deg,var(--border-strong)_0_6px,transparent_6px_10px)]"
        }`}
      >
        {scored && <div className={`h-1.5 rounded-full ${tone.bar}`} style={{ width: `${diagnosis.score}%` }} />}
      </div>

      <span
        className={`inline-flex h-7 items-center gap-1.5 self-start rounded-full px-2.5 text-[0.8125rem] font-semibold ${tone.pill}`}
      >
        <Icon className="size-3.5" strokeWidth={2.5} aria-hidden />
        {DIAGNOSIS_STATUS_LABELS[diagnosis.status]}
      </span>

      <p className="text-[0.8125rem] leading-[1.125rem] text-(--text-secondary)">
        {describeCategory(diagnosis, questionTextByKey)}
      </p>
    </article>
  );
}
