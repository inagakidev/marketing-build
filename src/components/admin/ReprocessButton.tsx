"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Recomputes the diagnosis from the current answers.
 *
 * The diagnosis is stored on submission, so old briefings keep showing the
 * result of the rules in force at that time. This button brings them up to
 * today's rules.
 */
export function ReprocessButton({ briefingId }: { briefingId: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function reprocess() {
    setRunning(true);
    try {
      const response = await fetch(`/api/briefings/${briefingId}/reprocess`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao reprocessar.");

      toast.success(
        `Diagnóstico atualizado: ${data.signalCount} sinal(is) detectado(s).`,
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao reprocessar.",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button variant="outline" onClick={reprocess} disabled={running}>
      {running ? "Recalculando..." : "Recalcular diagnóstico"}
    </Button>
  );
}
