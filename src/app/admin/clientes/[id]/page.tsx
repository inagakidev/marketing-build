import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { canEditProject, canManageClients } from "@/modules/identity/domain/permissions";
import { prisma } from "@/server/db";
import { serverEnv } from "@/server/env";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { CreateBriefingButton } from "@/components/admin/CreateBriefingButton";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import {
  BRIEFING_STATUS_LABELS,
  BRIEFING_STATUS_TONE,
  formatDate,
} from "@/lib/labels";

export default async function ClientePage({
  params,
}: PageProps<"/admin/clientes/[id]">) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, userId: user.id },
    include: {
      briefings: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          token: true,
          createdAt: true,
          expiresAt: true,
          submittedAt: true,
        },
      },
    },
  });

  if (!client) notFound();

  const baseUrl = serverEnv().appUrl;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Clientes
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            {client.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {client.contactEmail}
            {client.phone ? ` · ${client.phone}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {canManageClients(user.role) && (
            <Link
              href={`/admin/clientes/${client.id}/editar`}
              className={buttonVariants({ variant: "outline" })}
            >
              Editar
            </Link>
          )}
          {/* Briefings move under projects in EP-05 (see the API route). */}
          {canEditProject(user.role, null) && <CreateBriefingButton clientId={client.id} />}
        </div>
      </div>

      {client.internalNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notas internas
            </CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm leading-relaxed">
            {client.internalNotes}
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Briefings</h2>

        {client.briefings.length === 0 ? (
          <EmptyState
            title="Nenhum briefing ainda."
            description="Crie um para gerar o link do cliente."
          />
        ) : (
          <div className="space-y-3">
            {client.briefings.map((briefing) => (
              <Card key={briefing.id}>
                <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          BRIEFING_STATUS_TONE[briefing.status] ?? "neutral"
                        }
                      >
                        {BRIEFING_STATUS_LABELS[briefing.status]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Criado em {formatDate(briefing.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {briefing.submittedAt
                        ? `Enviado em ${formatDate(briefing.submittedAt)}`
                        : `Válido até ${formatDate(briefing.expiresAt)}`}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!briefing.submittedAt && (
                      <CopyLinkButton
                        url={`${baseUrl}/briefing/${briefing.token}`}
                      />
                    )}
                    <Link
                      href={`/admin/briefings/${briefing.id}`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      Abrir
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
