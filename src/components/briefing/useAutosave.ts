"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicForm } from "@/server/publicForm";
import type { AnswerValue } from "@/core";

export type SaveState = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 600;
const MAX_ATTEMPTS = 4;

/**
 * Answer autosave.
 *
 * Rules that guided the design:
 *
 * - **No save button.** Every change schedules a write; the respondent never
 *   has to remember anything.
 * - **Changes are accumulated per question.** Typing in a text field fires an
 *   event per keystroke; sending a request per keystroke would hammer the
 *   server for nothing. The debounce groups the burst into a single PUT.
 * - **Local state is the source of truth for fields.** The server response
 *   updates the form's structure (steps change when the business model is
 *   chosen), but NEVER overwrites what the person is typing.
 * - **A network failure loses no data.** Pending changes stay queued and are
 *   resent with increasing backoff; the warning only goes away once saved.
 */
export function useAutosave(token: string, onFormUpdate: (form: PublicForm) => void) {
  const [state, setState] = useState<SaveState>("idle");

  /** Changes not yet confirmed by the server, by question key. */
  const pending = useRef(new Map<string, AnswerValue>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const attempt = useRef(0);

  // `onFormUpdate` is usually recreated on every render; keeping it in a ref
  // avoids rescheduling the autosave on every form render.
  const onFormUpdateRef = useRef(onFormUpdate);
  useEffect(() => {
    onFormUpdateRef.current = onFormUpdate;
  }, [onFormUpdate]);

  // Stable reference so the retry can call back without referencing itself
  // before being declared (`flush` reschedules itself on error).
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

      if (response.status === 429) {
        // Rate limit (SEC-04): wait for the time the server indicates,
        // without spending one of the network-failure attempts.
        const seconds = Number(response.headers.get("Retry-After")) || 5;
        setState("error");
        timer.current = setTimeout(() => void flushRef.current(), seconds * 1000);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { form: PublicForm };

      // Only remove from the queue what was actually sent: changes made during
      // the request stay pending and go into the next batch.
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
        // Increasing backoff: 1s, 2s, 4s. A brief connection drop resolves
        // itself without the respondent having to do anything.
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

  /** Records an answer change and schedules the write. */
  const save = useCallback(
    (questionKey: string, value: AnswerValue) => {
      pending.current.set(questionKey, value);
      setState("saving");

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  /** Writes whatever is pending right away. Use when changing steps. */
  const flushNow = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await flush();
  }, [flush]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Warns before closing the tab with unsaved changes.
  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (pending.current.size > 0) event.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return { state, save, flushNow, hasPending: () => pending.current.size > 0 };
}
