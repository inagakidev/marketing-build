"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicForm } from "@/server/publicForm";
import type { AnswerValue } from "@/core";

export type SaveState = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 600;
const MAX_ATTEMPTS = 4;

/**
 * Autosave das respostas.
 *
 * Regras que guiaram o desenho:
 *
 * - **Sem botão de salvar.** Cada alteração agenda uma gravação; o respondente
 *   nunca precisa se lembrar de nada.
 * - **As alterações são acumuladas por pergunta.** Digitar num campo de texto
 *   dispara um evento por tecla; enviar uma requisição por tecla derrubaria o
 *   servidor sem necessidade. O debounce agrupa a rajada num único PUT.
 * - **O estado local é a fonte da verdade dos campos.** A resposta do servidor
 *   atualiza a estrutura do formulário (as etapas mudam quando o modelo de
 *   negócio é escolhido), mas NUNCA sobrescreve o que a pessoa está digitando.
 * - **Falha de rede não perde dado.** As alterações pendentes continuam na
 *   fila e são reenviadas com espera crescente; o aviso só some quando grava.
 */
export function useAutosave(token: string, onFormUpdate: (form: PublicForm) => void) {
  const [state, setState] = useState<SaveState>("idle");

  /** Alterações ainda não confirmadas pelo servidor, por chave de pergunta. */
  const pending = useRef(new Map<string, AnswerValue>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const attempt = useRef(0);

  // `onFormUpdate` costuma ser recriada a cada render; guardá-la numa ref
  // evita reagendar o autosave a cada renderização do formulário.
  const onFormUpdateRef = useRef(onFormUpdate);
  useEffect(() => {
    onFormUpdateRef.current = onFormUpdate;
  }, [onFormUpdate]);

  // Referência estável para o retry se chamar de volta sem se referenciar
  // antes de declarada (o próprio `flush` reagenda a si mesmo em caso de erro).
  const flushRef = useRef<() => Promise<void>>(async () => {});

  const flush = useCallback(async () => {
    if (inFlight.current || pending.current.size === 0) return;

    const batch = [...pending.current.entries()].map(([questionKey, value]) => ({
      questionKey,
      value,
    }));

    inFlight.current = true;
    setState("saving");

    try {
      const response = await fetch(`/api/public/briefing/${token}/answers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: batch }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { form: PublicForm };

      // Só remove da fila o que foi de fato enviado: alterações feitas durante
      // a requisição continuam pendentes e entram no próximo lote.
      for (const { questionKey, value } of batch) {
        if (pending.current.get(questionKey) === value) {
          pending.current.delete(questionKey);
        }
      }

      attempt.current = 0;
      onFormUpdateRef.current(data.form);
      setState(pending.current.size > 0 ? "saving" : "saved");
    } catch {
      attempt.current += 1;
      setState("error");

      if (attempt.current < MAX_ATTEMPTS) {
        // Espera crescente: 1s, 2s, 4s. Uma queda breve de conexão se resolve
        // sozinha sem o respondente precisar fazer nada.
        const delay = 1000 * 2 ** (attempt.current - 1);
        timer.current = setTimeout(() => void flushRef.current(), delay);
      }
    } finally {
      inFlight.current = false;
    }
  }, [token]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  /** Registra a alteração de uma resposta e agenda a gravação. */
  const save = useCallback(
    (questionKey: string, value: AnswerValue) => {
      pending.current.set(questionKey, value);
      setState("saving");

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  /** Grava imediatamente o que estiver pendente. Use ao trocar de etapa. */
  const flushNow = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await flush();
  }, [flush]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Avisa antes de fechar a aba com alteração ainda não gravada.
  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (pending.current.size > 0) event.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return { state, save, flushNow, hasPending: () => pending.current.size > 0 };
}
