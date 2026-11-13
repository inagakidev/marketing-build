import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Screen for an invalid, expired or already submitted link.
 *
 * Each case has its own copy: for whoever received the link, "expired" and
 * "doesn't exist" call for completely different actions, and a generic error
 * message only produces a reply asking what happened.
 */
export function LinkProblem({
  problem,
}: {
  problem: "not_found" | "expired" | "already_submitted";
}) {
  const conteudo = TEXTOS[problem];

  return (
    <main data-context="public" className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-4xl" aria-hidden>
            {conteudo.emoji}
          </div>
          <CardTitle className="text-xl">{conteudo.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground leading-relaxed">
          {conteudo.texto}
        </CardContent>
      </Card>
    </main>
  );
}

const TEXTOS = {
  not_found: {
    emoji: "🔍",
    titulo: "Não encontramos este link",
    texto:
      "O endereço pode ter sido copiado pela metade. Confira se ele está completo ou peça um novo para quem enviou.",
  },
  expired: {
    emoji: "⏳",
    titulo: "Este link expirou",
    texto:
      "Links de briefing têm prazo de validade. Peça um novo para quem enviou — suas respostas anteriores continuam guardadas.",
  },
  already_submitted: {
    emoji: "✅",
    titulo: "Este briefing já foi enviado",
    texto:
      "Obrigado! Suas respostas foram recebidas. Se precisar corrigir alguma coisa, entre em contato com quem enviou o link.",
  },
} as const;
