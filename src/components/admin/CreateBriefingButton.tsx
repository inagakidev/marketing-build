"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CreateBriefingButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function create() {
    setCreating(true);
    try {
      const response = await fetch("/api/briefings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao criar.");

      // Tenta já deixar o link na área de transferência: criar o briefing e
      // enviar o link são, na prática, a mesma ação.
      try {
        await navigator.clipboard.writeText(data.url);
        toast.success("Briefing criado e link copiado.");
      } catch {
        toast.success("Briefing criado. Use o botão para copiar o link.");
      }

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao criar o briefing.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <Button onClick={create} disabled={creating}>
      {creating ? "Criando..." : "Novo briefing"}
    </Button>
  );
}
