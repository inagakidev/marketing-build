"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Copia o link do briefing para a área de transferência.
 *
 * O envio ao cliente é manual nesta versão (não há e-mail automático), então
 * este botão é o passo real do fluxo — vale o cuidado com o caso de falha.
 */
export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // `navigator.clipboard` exige contexto seguro (HTTPS ou localhost) e
      // permissão. Falhando, mostramos o link para copiar à mão em vez de
      // deixar o clique sem resposta.
      toast.error("Não foi possível copiar. O link é: " + url, {
        duration: 15000,
      });
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={copy}>
      {copied ? "Copiado!" : "Copiar link"}
    </Button>
  );
}
