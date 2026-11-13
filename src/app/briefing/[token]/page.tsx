import { loadBriefingByToken, loadEvalContext } from "@/server/briefing";
import { buildPublicForm } from "@/server/publicForm";
import { BriefingFlow } from "@/components/briefing/BriefingFlow";
import { LinkProblem } from "@/components/briefing/LinkProblem";

/**
 * Formulário público, acessado por token e sem login.
 *
 * O carregamento acontece no servidor para que a primeira tela chegue pronta —
 * a maior parte dos respondentes abre pelo celular, muitas vezes em conexão
 * ruim, e uma tela de esqueleto piscando antes do conteúdo é justamente o que
 * faz o link parecer quebrado.
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
