import { Mascot } from "@/components/Mascot";

/**
 * A briefing link that can't be used (DS v2 frame F5). Each case has its own
 * copy: for whoever received the link, "expired" and "doesn't exist" call for
 * completely different actions, and a generic error only produces a reply
 * asking what happened. No emoji: the mascot carries the tone.
 */

// The respondent is in Brazil and the server may run in UTC: pin the zone so
// "expirou em 15/11" is the day they saw on the link.
const dayFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

export function LinkProblem({
  problem,
  organizationName,
  expiresAt,
  submittedAt,
}: {
  problem: "not_found" | "expired" | "already_submitted";
  organizationName?: string | null;
  expiresAt?: Date | null;
  submittedAt?: Date | null;
}) {
  const team = organizationName ? `a equipe de ${organizationName}` : "a equipe que enviou este briefing";

  const content = {
    not_found: {
      mascot: "missing" as const,
      title: "Não encontramos este briefing",
      text: "Confira se o link foi copiado inteiro. Se continuar sem abrir, peça um novo à equipe que enviou.",
      next: null,
    },
    expired: {
      mascot: "missing" as const,
      title: expiresAt ? `Este link expirou em ${dayFormat.format(expiresAt)}` : "Este link expirou",
      text: "Por segurança, os links de briefing têm prazo. As respostas que você já tinha salvo continuam guardadas com a equipe.",
      next: `Para continuar, peça um novo link para ${team}. Você retoma de onde parou.`,
    },
    already_submitted: {
      mascot: "done" as const,
      title: submittedAt
        ? `Este briefing já foi enviado em ${dayFormat.format(submittedAt)}. Obrigado!`
        : "Este briefing já foi enviado. Obrigado!",
      text: `As respostas já chegaram para ${team}. Se precisar corrigir algo, fale com ela. Você pode fechar esta página.`,
      next: null,
    },
  }[problem];

  return (
    <div data-context="public" className="flex min-h-svh flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-5 py-4 lg:px-6">
          <span className="truncate text-sm font-semibold">{organizationName ?? "Briefing Inteligente"}</span>
          <span className="text-xs text-muted-foreground">Briefing seguro</span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-7 px-5 pt-12 pb-16">
        <Mascot name={content.mascot} className="h-[104px] self-start" />
        <div className="flex flex-col gap-3">
          <h1 className="text-[1.75rem] leading-9 font-bold tracking-[-0.02em]">{content.title}</h1>
          <p className="text-base leading-6 text-(--text-secondary)">{content.text}</p>
        </div>
        {content.next && (
          <p className="rounded-xl border border-border bg-card p-4 text-[0.9375rem] leading-[1.375rem]">
            {content.next}
          </p>
        )}
      </main>
    </div>
  );
}
