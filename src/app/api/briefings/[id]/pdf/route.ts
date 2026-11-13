import { fail, handle } from "@/server/api";
import { requireUser } from "@/server/auth";
import { assertSameOrigin } from "@/server/security/origin";
import { prisma } from "@/server/db";
import { renderBriefingPdf } from "@/server/pdf";
import { enforceRateLimit } from "@/server/security/rateLimit";

/**
 * Exporta o briefing em PDF.
 *
 * Abrir um navegador é caro (~1–2s), então esta rota é sempre dinâmica e nunca
 * cacheada — e a checagem de permissão acontece ANTES de lançar o Chromium,
 * para que um id inválido não custe um processo.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    // Por usuário, não por IP: é uma rota autenticada e cara.
    await enforceRateLimit(request, "pdf", user.id);
    const { id } = await params;

    const briefing = await prisma.briefing.findFirst({
      where: { id, client: { userId: user.id } },
      select: { id: true, client: { select: { name: true } } },
    });
    if (!briefing) return fail(404, "Briefing não encontrado.");

    const pdf = await renderBriefingPdf(
      briefing.id,
      request.headers.get("cookie"),
    );

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName(briefing.client.name)}"`,
        "Cache-Control": "no-store",
      },
    });
  });
}

/** Nome de arquivo seguro: sem acento, espaço nem caractere de caminho. */
function fileName(clientName: string): string {
  const slug =
    clientName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "briefing";

  const date = new Date().toISOString().slice(0, 10);
  return `briefing-${slug}-${date}.pdf`;
}
