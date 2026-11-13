import { cn } from "cn";
import { DIAGNOSIS_CATEGORY_LABELS } from "@/core/diagnosis/categoryMap";
import { DIAGNOSIS_STATUS_LABELS } from "@/lib/labels";
import type { DiagnosisCategory, DiagnosisStatus } from "@/core/types";
import { BrandGlyph } from "./BrandMark";

/**
 * Login screen showcase panel.
 *
 * Instead of a generic illustration, it shows the product's own output: a
 * per-category diagnosis with the real traffic light (green/yellow/red).
 * Labels come from the same sources the panel uses, so they never drift from
 * the system.
 */

const PREVIEW: ReadonlyArray<{ category: DiagnosisCategory; status: DiagnosisStatus }> = [
  { category: "positioning", status: "green" },
  { category: "audience", status: "yellow" },
  { category: "offer", status: "yellow" },
  { category: "digital_presence", status: "red" },
  { category: "current_marketing", status: "gray" },
];

const DOT_CLASSES: Record<DiagnosisStatus, string> = {
  green: "bg-emerald-400",
  yellow: "bg-amber-400",
  red: "bg-red-400",
  gray: "bg-neutral-500",
};

const STATUS_TEXT_CLASSES: Record<DiagnosisStatus, string> = {
  green: "text-emerald-300",
  yellow: "text-amber-300",
  red: "text-red-300",
  gray: "text-neutral-400",
};

export function LoginBrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-neutral-950 p-10 text-neutral-50 lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-neutral-50/5 blur-3xl"
      />

      <div className="relative flex items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-neutral-50 text-neutral-950">
          <BrandGlyph className="size-5" />
        </span>
        <span className="text-sm font-semibold tracking-tight">
          Briefing Inteligente
        </span>
      </div>

      <div className="relative space-y-8">
        <div className="space-y-3">
          <h1 className="text-[1.7rem] font-semibold leading-tight tracking-tight text-balance">
            Briefings que se adaptam ao cliente. Diagnósticos que você lê em
            segundos.
          </h1>
          <p className="text-sm leading-relaxed text-neutral-400">
            O formulário ramifica pelo tipo de negócio e, assim que o cliente
            envia, cada categoria chega avaliada — sem planilha, sem retrabalho.
          </p>
        </div>

        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-wider text-neutral-400">
            Exemplo de diagnóstico
          </p>
          <ul className="space-y-2.5">
            {PREVIEW.map(({ category, status }) => (
              <li
                key={category}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <span className="text-neutral-200">
                  {DIAGNOSIS_CATEGORY_LABELS[category]}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    STATUS_TEXT_CLASSES[status],
                  )}
                >
                  <span
                    className={cn("size-2 rounded-full", DOT_CLASSES[status])}
                    aria-hidden
                  />
                  {DIAGNOSIS_STATUS_LABELS[status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="relative text-xs text-neutral-500">
        Formulário adaptativo · Diagnóstico determinístico, sem IA generativa.
      </p>
    </aside>
  );
}
