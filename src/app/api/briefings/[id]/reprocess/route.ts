import { fail, handle, ok } from "@/server/api";
import { requireUser } from "@/server/auth";
import { processAndPersist } from "@/server/briefing";
import { prisma } from "@/server/db";

/**
 * Recalcula sinais e diagnóstico de um briefing já enviado.
 *
 * Necessário porque o diagnóstico é gravado no envio: quando as regras mudam
 * (uma palavra-chave nova, um limite ajustado), briefings antigos continuam
 * mostrando o resultado antigo até que a administradora peça o recálculo.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;

    const briefing = await prisma.briefing.findFirst({
      where: { id, client: { userId: user.id } },
      select: { id: true },
    });
    if (!briefing) return fail(404, "Briefing não encontrado.");

    const result = await processAndPersist(briefing.id);

    return ok({
      reprocessed: true,
      signalCount: result.signals.length,
      diagnoses: result.diagnoses,
    });
  });
}
