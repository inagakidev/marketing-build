"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  CloudCheck,
  CloudOff,
  Info,
  ListOrdered,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/Mascot";
import { describeStepProgress, isBlank, stepProgress } from "@/lib/briefingProgress";
import type { PublicForm } from "@/server/publicForm";
import type { AnswerValue, FormStep } from "@/core";
import { QuestionField } from "./QuestionField";
import { useAutosave, type SaveState } from "./useAutosave";

type Stage = "welcome" | "form" | "review" | "done";

const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

/**
 * The respondent's whole flow, after DS v2 frames F1–F4 (phone) and F6
 * (desktop): welcome, steps, review and thank-you.
 *
 * It's a single component with stages instead of four routes: going back a
 * step doesn't reload the page or risk losing what hasn't been saved yet.
 */
export function BriefingFlow({
  token,
  clientName,
  organizationName,
  expiresAt,
  initialForm,
}: {
  token: string;
  clientName: string;
  /** Who sent the briefing, as the respondent knows them. */
  organizationName: string;
  expiresAt: string | null;
  initialForm: PublicForm;
}) {
  const [form, setForm] = useState(initialForm);
  const [stage, setStage] = useState<Stage>("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [invalidKeys, setInvalidKeys] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

  /** Field values. Local source of truth — see `useAutosave`. */
  const [values, setValues] = useState<Record<string, AnswerValue>>(() =>
    Object.fromEntries(
      initialForm.questions.filter((q) => q.value != null).map((q) => [q.key, q.value as AnswerValue]),
    ),
  );

  const onFormUpdate = useCallback((next: PublicForm) => setForm(next), []);
  const autosave = useAutosave(token, onFormUpdate);

  const questionByKey = useMemo(() => new Map(form.questions.map((q) => [q.key, q] as const)), [form.questions]);

  const steps = form.steps;
  // The branch can shorten the form: if the current step no longer exists,
  // fall back to the last valid one instead of showing an empty screen.
  const safeIndex = Math.min(stepIndex, Math.max(steps.length - 1, 0));
  const step = steps[safeIndex];
  const save = { state: autosave.state, savedAt: autosave.savedAt };

  function handleChange(key: string, value: AnswerValue) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setInvalidKeys((prev) => prev.filter((k) => k !== key));
    autosave.save(key, value);
  }

  function goToStep(index: number) {
    setInvalidKeys([]);
    setSubmitError(null);
    setStepIndex(index);
    setStage("form");
    scrollToTop();
  }

  async function goNext() {
    const missing = step ? stepProgressFor(step).missingKeys : [];
    if (missing.length > 0) {
      setInvalidKeys(missing);
      scrollToTop();
      return;
    }

    // Save before moving on: if the network drops on the next screen, what was
    // filled in here is safe.
    await autosave.flushNow();
    setInvalidKeys([]);

    if (safeIndex >= steps.length - 1) {
      setStage("review");
    } else {
      setStepIndex(safeIndex + 1);
      setFurthest((f) => Math.max(f, safeIndex + 1));
    }
    scrollToTop();
  }

  function goBack() {
    setInvalidKeys([]);
    if (safeIndex === 0) setStage("welcome");
    else setStepIndex(safeIndex - 1);
    scrollToTop();
  }

  function stepProgressFor(s: FormStep) {
    const progress = stepProgress(s.questionKeys, questionByKey, values);
    const missingKeys = s.questionKeys.filter((k) => questionByKey.get(k)?.required && isBlank(values[k]));
    return { ...progress, missingKeys };
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      await autosave.flushNow();

      const response = await fetch(`/api/public/briefing/${token}/submit`, { method: "POST" });
      const data = await response.json();

      if (response.status === 422) {
        // A required question is missing: go back to the first step with pending items.
        const missing: string[] = data.missingRequiredKeys ?? [];
        const target = steps.findIndex((s) => s.questionKeys.some((k) => missing.includes(k)));
        goToStep(target >= 0 ? target : 0);
        setInvalidKeys(missing);
        return;
      }

      if (!response.ok) throw new Error(data.error ?? "Falha ao enviar.");

      setSubmittedAt(new Date());
      setStage("done");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Não conseguimos enviar agora. Verifique a internet e tente de novo.",
      );
    } finally {
      setSubmitting(false);
      scrollToTop();
    }
  }

  // Welcome (F1) -----------------------------------------------------------------

  if (stage === "welcome") {
    return (
      <PublicPage organizationName={organizationName} clientName={clientName}>
        <Single>
          <Mascot name="welcome" className="h-24 self-start" />
          <div className="flex flex-col gap-3">
            <p className="text-[0.8125rem] font-semibold tracking-[0.06em] text-(--link) uppercase">{clientName}</p>
            <h1 className="text-[1.75rem] leading-9 font-bold tracking-[-0.02em]">
              Olá! Vamos entender o seu negócio.
            </h1>
            <p className="text-base leading-6 text-(--text-secondary)">
              Suas respostas ajudam a equipe de{" "}
              <strong className="font-semibold text-foreground">{organizationName}</strong> a montar o plano de
              marketing. Não existe resposta certa: conte como é hoje.
            </p>
          </div>
          <ul className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-4 text-[0.9375rem] leading-[1.375rem]">
            <li className="flex items-start gap-3">
              <ListOrdered className="mt-px size-5 shrink-0" aria-hidden />
              <span>
                <b className="font-semibold">
                  {steps.length} {steps.length === 1 ? "etapa" : "etapas"}
                </b>
                , cerca de 15 minutos
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CloudCheck className="mt-px size-5 shrink-0" aria-hidden />
              <span>
                <b className="font-semibold">Salvamento automático</b>: pode parar e voltar por este mesmo link
              </span>
            </li>
            {expiresAt && (
              <li className="flex items-start gap-3">
                <CalendarDays className="mt-px size-5 shrink-0" aria-hidden />
                <span>
                  Link válido até <b className="font-semibold">{dayFormat.format(new Date(expiresAt))}</b>
                </span>
              </li>
            )}
          </ul>
        </Single>
        <ActionBar>
          <Button variant="brand" className={`${BIG} flex-1`} onClick={() => setStage("form")}>
            Começar briefing
            <ArrowRight aria-hidden />
          </Button>
        </ActionBar>
      </PublicPage>
    );
  }

  // Done (F4) ------------------------------------------------------------------

  if (stage === "done") {
    return (
      <PublicPage organizationName={organizationName} clientName={clientName}>
        <Single>
          <Mascot name="done" className="h-[104px] self-start" />
          <div role="status" className="flex flex-col gap-3">
            <h1 className="text-[1.75rem] leading-9 font-bold tracking-[-0.02em]">Briefing enviado. Obrigado!</h1>
            {submittedAt && (
              <p className="text-base leading-6 text-(--text-secondary)">
                Recebemos suas respostas em {dayFormat.format(submittedAt)}, às {timeFormat.format(submittedAt)}. A
                equipe de {organizationName} já pode começar a análise.
              </p>
            )}
          </div>
          <div className="flex flex-col rounded-xl border border-border bg-card px-4 py-2">
            <p className="mt-3 mb-1 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              O que acontece agora
            </p>
            {[
              "A equipe revisa o diagnóstico gerado a partir das suas respostas.",
              "Vocês conversam sobre as prioridades em uma reunião.",
              "Você recebe o plano com objetivos e metas.",
            ].map((text, i, all) => (
              <div
                key={text}
                className={`flex gap-3.5 py-3 ${i < all.length - 1 ? "border-b border-border" : ""}`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-(--text-secondary)"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-[0.9375rem] leading-[1.375rem]">{text}</span>
              </div>
            ))}
          </div>
          <p className="text-sm leading-5 text-muted-foreground">
            Quer mudar alguma resposta? Fale com a equipe de {organizationName}. Você já pode fechar esta página.
          </p>
        </Single>
      </PublicPage>
    );
  }

  // Review (F3) ----------------------------------------------------------------

  if (stage === "review") {
    const perStep = steps.map((s) => ({ step: s, progress: stepProgressFor(s) }));
    const optionalBlank = perStep.reduce((sum, p) => sum + p.progress.optionalBlank, 0);

    return (
      <PublicPage organizationName={organizationName} clientName={clientName} save={save}>
        <StepHeaderMobile label="Revisão final" total={steps.length} current={steps.length} save={save} />
        <Single>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[1.375rem] leading-[1.875rem] font-bold tracking-[-0.01em] lg:text-[1.75rem] lg:leading-9">
              Confira antes de enviar
            </h1>
            <p className="text-[0.9375rem] leading-[1.375rem] text-(--text-secondary)">
              Escolha uma etapa para ver ou ajustar as respostas.
            </p>
          </div>

          <ul className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            {perStep.map(({ step: s, progress }, i) => {
              const complete = progress.requiredMissing === 0;
              return (
                <li key={`${s.category}-${s.index}`} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => goToStep(i)}
                    className="flex min-h-16 w-full items-center gap-3.5 px-4 py-4 text-left hover:bg-muted"
                  >
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                        complete ? "bg-(--success-bg) text-(--success-text)" : "bg-(--warning-bg) text-(--warning-text)"
                      }`}
                    >
                      {complete ? (
                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                      ) : (
                        <TriangleAlert className="size-3.5" strokeWidth={2.5} aria-hidden />
                      )}
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-base font-semibold">{stepTitle(s)}</span>
                      <span className="text-[0.8125rem] text-muted-foreground">{describeStepProgress(progress)}</span>
                    </span>
                    <span className="text-sm font-medium text-(--link)">Ver</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {submitError && (
            <Alert variant="destructive">
              <CircleAlert aria-hidden />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          {optionalBlank > 0 && (
            <Alert variant="info">
              <Info aria-hidden />
              <AlertDescription>
                {optionalBlank === 1
                  ? "1 pergunta opcional ficou sem resposta."
                  : `${optionalBlank} perguntas opcionais ficaram sem resposta.`}{" "}
                Tudo bem: você pode enviar assim.
              </AlertDescription>
            </Alert>
          )}
          <Alert variant="warning">
            <TriangleAlert aria-hidden />
            <AlertDescription>
              Depois do envio as respostas ficam fechadas para edição. Se precisar mudar algo, fale com a equipe.
            </AlertDescription>
          </Alert>

          <ActionBar inline>
            <Button
              variant="outline"
              className={BIG}
              onClick={() => goToStep(steps.length - 1)}
              disabled={submitting}
            >
              Voltar
            </Button>
            <Button variant="brand" className={`${BIG} flex-1 lg:flex-none`} onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" aria-hidden />}
              {submitting ? "Enviando…" : "Enviar briefing"}
            </Button>
          </ActionBar>
        </Single>
      </PublicPage>
    );
  }

  // Steps (F2 phone, F6 desktop) ---------------------------------------------------

  if (!step) {
    return (
      <PublicPage organizationName={organizationName} clientName={clientName}>
        <Single>
          <p className="text-muted-foreground">Nenhuma pergunta disponível neste briefing.</p>
        </Single>
      </PublicPage>
    );
  }

  const missingHere = invalidKeys.filter((k) => step.questionKeys.includes(k));
  const isLast = safeIndex >= steps.length - 1;
  const next = steps[safeIndex + 1];

  return (
    <PublicPage organizationName={organizationName} clientName={clientName} save={save}>
      <StepHeaderMobile
        label={`Etapa ${safeIndex + 1} de ${steps.length} · ${stepTitle(step)}`}
        total={steps.length}
        current={safeIndex}
        save={save}
      />
      <div className="mx-auto flex w-full max-w-[1120px] flex-1 gap-12 px-5 pt-6 pb-32 lg:px-6 lg:pt-10 lg:pb-16">
        <StepsNav steps={steps} current={safeIndex} furthest={furthest} onSelect={goToStep} />

        <main className="flex min-w-0 max-w-[680px] flex-1 flex-col gap-7">
          <h1 className="text-[1.375rem] leading-[1.875rem] font-bold tracking-[-0.01em] lg:text-[1.75rem] lg:leading-9">
            {stepTitle(step)}
          </h1>

          {missingHere.length > 0 && (
            <Alert variant="destructive">
              <CircleAlert aria-hidden />
              <AlertDescription>
                <span className="font-semibold">
                  {missingHere.length === 1
                    ? "Falta 1 pergunta obrigatória nesta etapa."
                    : `Faltam ${missingHere.length} perguntas obrigatórias nesta etapa.`}
                </span>{" "}
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() => focusQuestion(missingHere[0])}
                >
                  Ir para a pergunta
                </button>
              </AlertDescription>
            </Alert>
          )}

          {step.questionKeys.map((key) => {
            const question = questionByKey.get(key);
            if (!question) return null;
            return (
              <QuestionField
                key={key}
                question={question}
                value={values[key] ?? null}
                invalid={invalidKeys.includes(key)}
                onChange={(value) => handleChange(key, value)}
              />
            );
          })}

          <ActionBar inline>
            <Button variant="outline" className={BIG} onClick={goBack}>
              Voltar
            </Button>
            <Button className={`${BIG} flex-1 lg:flex-none`} onClick={goNext}>
              <span className="lg:hidden">{isLast ? "Revisar" : "Continuar"}</span>
              <span className="hidden lg:inline">
                {isLast ? "Revisar respostas" : `Continuar para ${next ? stepTitle(next) : "a próxima etapa"}`}
              </span>
              <ArrowRight aria-hidden />
            </Button>
          </ActionBar>
        </main>
      </div>
    </PublicPage>
  );
}

// Layout pieces -----------------------------------------------------------------

/** 52px, the DS v2 public form's touch target. */
const BIG = "h-13 rounded-xl px-5 text-base";

type Save = { state: SaveState; savedAt: Date | null };

function PublicPage({
  organizationName,
  clientName,
  save,
  children,
}: {
  organizationName: string;
  clientName: string;
  save?: Save;
  children: React.ReactNode;
}) {
  return (
    <div data-context="public" className="flex min-h-svh flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-5 py-4 lg:px-6">
          <p className="flex min-w-0 items-center gap-3 text-sm font-semibold lg:text-[0.9375rem]">
            <span className="truncate">{organizationName}</span>
            <span className="hidden text-(--neutral-400) lg:inline" aria-hidden>
              /
            </span>
            <span className="hidden truncate font-normal text-(--text-secondary) lg:inline">Briefing · {clientName}</span>
          </p>
          {save ? (
            <span className="hidden lg:block">
              <SaveStatus save={save} />
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Briefing seguro</span>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}

/** Single-column content (welcome, review, done), centered on desktop. */
function Single({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-6 px-5 pt-8 pb-32 lg:pt-12 lg:pb-16">
      {children}
    </main>
  );
}

/**
 * Phone: fixed bottom bar, the thumb's reach (F1–F3). Desktop: buttons at the
 * end of the content (F6). `inline` keeps it in the content flow on desktop.
 */
function ActionBar({ inline = false, children }: { inline?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-10 flex gap-2.5 border-t border-border bg-card px-5 pt-3.5 pb-[max(1.375rem,env(safe-area-inset-bottom))] ${
        inline
          ? "lg:static lg:mt-2 lg:justify-between lg:border-t lg:bg-transparent lg:px-0 lg:pt-6 lg:pb-0"
          : "lg:static lg:mx-auto lg:w-full lg:max-w-[560px] lg:border-0 lg:bg-transparent lg:px-5 lg:pt-0 lg:pb-16"
      }`}
    >
      {children}
    </div>
  );
}

function StepHeaderMobile({
  label,
  total,
  current,
  save,
}: {
  label: string;
  total: number;
  /** 0-based current step; `total` means every step is done (review). */
  current: number;
  save: Save;
}) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-border bg-card px-5 py-3.5 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        <SaveStatus save={save} />
      </div>
      <div
        role="progressbar"
        aria-label="Progresso do briefing"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={Math.min(current + 1, total)}
        className="flex gap-1"
      >
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-[5px] flex-1 rounded-full ${
              i < current ? "bg-primary" : i === current ? "bg-(--accent-brand)" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** Desktop steps column (F6): done, current, upcoming. Visited steps are links. */
function StepsNav({
  steps,
  current,
  furthest,
  onSelect,
}: {
  steps: FormStep[];
  current: number;
  furthest: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Etapas do briefing" className="hidden w-[260px] shrink-0 flex-col gap-1 lg:flex">
      <p className="mb-3 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {steps.length} {steps.length === 1 ? "etapa" : "etapas"} · ~15 min
      </p>
      {steps.map((s, i) => {
        const state = i === current ? "current" : i < current || i <= furthest ? "done" : "upcoming";
        const marker =
          state === "done" ? (
            <span className="flex size-6 items-center justify-center rounded-full bg-(--success-bg) text-(--success-text)">
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </span>
          ) : state === "current" ? (
            <span className="flex size-6 items-center justify-center rounded-full bg-(--accent-brand) text-xs font-bold text-(--on-accent-brand)">
              {i + 1}
            </span>
          ) : (
            <span className="flex size-6 items-center justify-center rounded-full border-[1.5px] border-(--neutral-400) text-xs font-semibold">
              {i + 1}
            </span>
          );
        const label = stepTitle(s);

        if (state === "upcoming") {
          return (
            <span key={i} className="flex items-center gap-3 px-3 py-2.5 text-[0.9375rem] text-muted-foreground">
              {marker}
              {label}
            </span>
          );
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={state === "current" ? "step" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[0.9375rem] ${
              state === "current" ? "border border-border bg-card font-semibold" : "hover:bg-muted"
            }`}
          >
            {marker}
            {label}
          </button>
        );
      })}
    </nav>
  );
}

function SaveStatus({ save }: { save: Save }) {
  const { state, savedAt } = save;
  const content =
    state === "saving" ? (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Salvando…
      </span>
    ) : state === "error" ? (
      <span className="flex items-center gap-1.5 text-destructive">
        <CloudOff className="size-3.5" aria-hidden />
        Sem conexão — tentando de novo
      </span>
    ) : savedAt ? (
      <span className="flex items-center gap-1.5 text-(--success-text)">
        <CloudCheck className="size-3.5" aria-hidden />
        Salvo às {timeFormat.format(savedAt)}
      </span>
    ) : (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <CloudCheck className="size-3.5" aria-hidden />
        Salvamento automático
      </span>
    );

  return (
    <span role="status" aria-live="polite" className="text-xs lg:text-[0.8125rem]">
      {content}
    </span>
  );
}

function stepTitle(step: FormStep): string {
  return step.continued ? `${step.title} (continuação)` : step.title;
}

/** Scrolls to a question and puts the keyboard there ("Ir para a pergunta"). */
function focusQuestion(key: string) {
  const el = document.getElementById(`q-${key}`);
  const target = el instanceof HTMLFieldSetElement ? el.querySelector("input") : el;
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  (target as HTMLElement | null)?.focus({ preventScroll: true });
}

function scrollToTop() {
  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
}
