import { fail, handle } from "@/server/api";
import { requireUser } from "@/server/auth";
import { assertSameOrigin } from "@/server/security/origin";
import { prisma } from "@/server/db";
import { renderBriefingPdf } from "@/server/pdf";
import { enforceRateLimit } from "@/server/security/rateLimit";

/**
 * Exports the briefing as a PDF.
 *
 * Opening a browser is expensive (~1–2s), so this route is always dynamic and
 * never cached — and the permission check happens BEFORE launching Chromium,
 * so an invalid id doesn't cost a process.
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
    // Per user, not per IP: it's an authenticated, expensive route.
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

/** Safe file name: no accents, spaces or path characters. */
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
