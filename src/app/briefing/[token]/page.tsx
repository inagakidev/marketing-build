import { loadBriefingByToken, loadEvalContext } from "@/server/briefing";
import { buildPublicForm } from "@/server/publicForm";
import { BriefingFlow } from "@/components/briefing/BriefingFlow";
import { LinkProblem } from "@/components/briefing/LinkProblem";

/**
 * Public form, accessed by token without login.
 *
 * Loading happens on the server so the first screen arrives ready — most
 * respondents open it on their phone, often on a poor connection, and a
 * skeleton screen flashing before the content is exactly what makes the link
 * look broken.
 */
export default async function BriefingPage({
  params,
}: PageProps<"/briefing/[token]">) {
  const { token } = await params;
  const { problem, briefing } = await loadBriefingByToken(token);

  if (problem || !briefing) {
    return <LinkProblem problem={problem ?? "not_found"} />;
  }

  const ctx = await loadEvalContext(briefing.id);
  const form = await buildPublicForm(ctx);

  return (
    <BriefingFlow
      token={token}
      clientName={briefing.client.name}
      senderName={briefing.client.user.name}
      initialForm={form}
    />
  );
}
