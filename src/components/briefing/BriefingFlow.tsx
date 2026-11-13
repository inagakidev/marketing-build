"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PublicForm, PublicQuestion } from "@/server/publicForm";
import type { AnswerValue } from "@/core";
import { QuestionField } from "./QuestionField";
import { useAutosave, type SaveState } from "./useAutosave";

type Stage = "welcome" | "form" | "review" | "done";

/**
 * Fluxo completo do respondente: boas-vindas, blocos, revisão e agradecimento.
 *
 * É um único componente com estágios em vez de quatro rotas: assim voltar uma
 * etapa não recarrega a página nem arrisca perder o que ainda não foi gravado.
 */
export function BriefingFlow({
  token,
  clientName,
  senderName,
  initialForm,
}: {
  token: string;
  clientName: string;
  senderName: string;
  initialForm: PublicForm;
}) {
  const [form, setForm] = useState(initialForm);
  const [stage, setStage] = useState<Stage>("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [invalidKeys, setInvalidKeys] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** Valores dos campos. Fonte da verdade local — ver `useAutosave`. */
  const [values, setValues] = useState<Record<string, AnswerValue>>(() =>
    Object.fromEntries(
      initialForm.questions
        .filter((q) => q.value != null)
        .map((q) => [q.key, q.value as AnswerValue]),
    ),
  );

  const onFormUpdate = useCallback((next: PublicForm) => setForm(next), []);
  const autosave = useAutosave(token, onFormUpdate);

  const questionByKey = useMemo(
    () => new Map(form.questions.map((q) => [q.key, q] as const)),
    [form.questions],
  );

  const steps = form.steps;
  // A ramificação pode encurtar o formulário: se a etapa atual deixou de
  // existir, recua para a última válida em vez de mostrar uma tela vazia.
  const safeIndex = Math.min(stepIndex, Math.max(steps.length - 1, 0));
  const step = steps[safeIndex];

  function handleChange(key: string, value: AnswerValue) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setInvalidKeys((prev) => prev.filter((k) => k !== key));
    autosave.save(key, value);
  }

  /** Obrigatórias sem resposta na etapa atual. */
  function missingInStep(): string[] {
    if (!step) return [];
    return step.questionKeys.filter((key) => {
      const question = questionByKey.get(key);
      if (!question?.required) return false;
      return isBlank(values[key]);
    });
  }

  async function goNext() {
    const missing = missingInStep();
    if (missing.length > 0) {
      setInvalidKeys(missing);
      scrollToTop();
      return;
    }

    // Grava antes de avançar: se a rede cair na próxima tela, o que já foi
    // preenchido aqui está seguro.
    await autosave.flushNow();
    setInvalidKeys([]);

    if (safeIndex >= steps.length - 1) setStage("review");
    else setStepIndex(safeIndex + 1);
    scrollToTop();
  }

  function goBack() {
    setInvalidKeys([]);
    if (safeIndex === 0) setStage("welcome");
    else setStepIndex(safeIndex - 1);
    scrollToTop();
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      await autosave.flushNow();

      const response = await fetch(`/api/public/briefing/${token}/submit`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.status === 422) {
        // Faltou obrigatória: leva de volta à primeira etapa com pendência.
        const missing: string[] = data.missingRequiredKeys ?? [];
        setInvalidKeys(missing);
        const target = steps.findIndex((s) =>
          s.questionKeys.some((k) => missing.includes(k)),
        );
        setStepIndex(target >= 0 ? target : 0);
        setStage("form");
        setSubmitError(
          "Faltam algumas perguntas obrigatórias. Elas estão destacadas.",
        );
        return;
      }

      if (!response.ok) throw new Error(data.error ?? "Falha ao enviar.");

      setStage("done");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Não conseguimos enviar agora. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
      scrollToTop();
    }
  }

  // ---------------------------------------------------------------------------

  if (stage === "welcome") {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl leading-tight">
              Vamos entender o seu negócio, {clientName}?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-muted-foreground leading-relaxed">
              {senderName} preparou este briefing para conhecer melhor o seu
              negócio antes de começar o trabalho. São{" "}
              <strong className="text-foreground">{steps.length} etapas</strong>{" "}
              curtas e leva mais ou menos 15 minutos.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>
                ✓ Suas respostas são salvas sozinhas — pode fechar e voltar
                depois.
              </li>
              <li>✓ Dá para voltar e corrigir qualquer etapa antes de enviar.</li>
              <li>
                ✓ Não existe resposta errada. Se não souber, escreva do seu
                jeito.
              </li>
            </ul>
            <Button size="lg" className="w-full" onClick={() => setStage("form")}>
              Começar
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (stage === "done") {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <div className="text-4xl" aria-hidden>
              🎉
            </div>
            <CardTitle className="text-2xl">Prontinho, obrigado!</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed">
            Suas respostas foram enviadas para {senderName}. A partir daqui é com
            ela — se faltar alguma informação, ela entra em contato.
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (stage === "review") {
    const answered = form.questions.filter((q) => !isBlank(values[q.key]));

    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Antes de enviar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-muted-foreground">
              Você respondeu {answered.length} de {form.questions.length}{" "}
              perguntas. Depois de enviar, o formulário fecha e não dá mais para
              editar.
            </p>

            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button
                variant="outline"
                className="sm:flex-1"
                onClick={() => {
                  setStage("form");
                  setStepIndex(steps.length - 1);
                  scrollToTop();
                }}
                disabled={submitting}
              >
                Revisar respostas
              </Button>
              <Button
                className="sm:flex-1"
                onClick={submit}
                disabled={submitting}
              >
                {submitting ? "Enviando..." : "Enviar briefing"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (!step) {
    return (
      <Shell>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma pergunta disponível.
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const progress = ((safeIndex + 1) / steps.length) * 100;

  return (
    <Shell>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            Etapa {safeIndex + 1} de {steps.length}
          </p>
          <SaveIndicator state={autosave.state} />
        </div>
        <Progress value={progress} aria-label={`Progresso: etapa ${safeIndex + 1} de ${steps.length}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {step.title}
            {step.continued && (
              <span className="text-muted-foreground font-normal">
                {" "}
                (continuação)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-7">
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
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
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={goBack} className="flex-1">
          Voltar
        </Button>
        <Button onClick={goNext} className="flex-[2]">
          {safeIndex >= steps.length - 1 ? "Revisar" : "Continuar"}
        </Button>
      </div>

      <BranchNotice questions={form.questions} values={values} />
    </Shell>
  );
}

/** Layout mobile-first: coluna única, respiro nas laterais. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main data-context="public" className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {children}
    </main>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const texto: Record<SaveState, string> = {
    idle: "",
    saving: "Salvando...",
    saved: "Salvo",
    error: "Sem conexão — tentando de novo",
  };

  return (
    <p
      className={`text-xs ${state === "error" ? "text-destructive" : "text-muted-foreground"}`}
      role="status"
      aria-live="polite"
    >
      {texto[state]}
    </p>
  );
}

/**
 * Aviso de que o formulário cresceu depois da pergunta de ramificação.
 *
 * Sem isso o total de etapas muda no meio do preenchimento e parece defeito.
 */
function BranchNotice({
  questions,
  values,
}: {
  questions: PublicQuestion[];
  values: Record<string, AnswerValue>;
}) {
  const respondeuTipo = !isBlank(values["business_type"]);
  const temRamificada = questions.some((q) => q.key.match(/^(local|ecom|info|free|b2b)_/));

  if (!respondeuTipo || !temRamificada) return null;

  return (
    <p className="text-xs text-muted-foreground text-center">
      Incluímos algumas perguntas específicas para o seu tipo de negócio, então o
      número de etapas aumentou.
    </p>
  );
}

function isBlank(value: AnswerValue | null | undefined): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  return value.trim() === "";
}

function scrollToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
