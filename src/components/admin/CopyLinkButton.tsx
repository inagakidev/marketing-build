"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Copies the briefing link to the clipboard.
 *
 * Sending it to the client is manual in this version (no automatic email), so
 * this button is the real step of the flow — the failure case deserves care.
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
      // `navigator.clipboard` requires a secure context (HTTPS or localhost)
      // and permission. On failure, we show the link to copy by hand instead
      // of leaving the click unanswered.
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
