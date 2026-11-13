import { fail, handle, ok } from "@/server/api";
import { requireUser } from "@/server/auth";
import { loadBriefingDetail } from "@/server/briefingDetail";

/** Processed briefing: answers by category, diagnosis and summary. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;

    const detail = await loadBriefingDetail(id, user.id);
    if (!detail) return fail(404, "Briefing não encontrado.");

    return ok(detail);
  });
}
