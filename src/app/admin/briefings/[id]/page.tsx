import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { loadBriefingDetail } from "@/server/briefingDetail";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnswersByCategory } from "@/components/admin/AnswersByCategory";
import { DiagnosisPanel } from "@/components/admin/DiagnosisPanel";
import { RawAnswers } from "@/components/admin/RawAnswers";
import { ReprocessButton } from "@/components/admin/ReprocessButton";
import {
  BRIEFING_STATUS_LABELS,
  BRIEFING_STATUS_TONE,
  BUSINESS_TYPE_LABELS,
  formatDateTime,
} from "@/lib/labels";

export default async function BriefingPage({
  params,
}: PageProps<"/admin/briefings/[id]">) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;
  const detail = await loadBriefingDetail(id, user.id);
  if (!detail) notFound();

  const { briefing, client } = detail;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <Link
            href={`/admin/clientes/${client.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← {client.name}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Briefing</h1>
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <Badge variant={BRIEFING_STATUS_TONE[briefing.status] ?? "secondary"}>
              {BRIEFING_STATUS_LABELS[briefing.status]}
            </Badge>
            {briefing.businessType && (
              <Badge variant="outline">
                {BUSINESS_TYPE_LABELS[briefing.businessType]}
              </Badge>
            )}
            <span className="text-muted-foreground">
              {detail.answeredCount} de {detail.visibleCount} respondidas
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <ReprocessButton briefingId={briefing.id} />
          <a
            href={`/api/briefings/${briefing.id}/pdf`}
            className={buttonVariants({ variant: "brand" })}
          >
            Exportar PDF
          </a>
        </div>
      </div>

      {briefing.submittedAt ? (
        <p className="text-sm text-muted-foreground">
          Enviado em {formatDateTime(briefing.submittedAt)}.
        </p>
      ) : (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Este briefing ainda não foi enviado pelo cliente. As respostas abaixo
            são o que já foi preenchido; o diagnóstico só é gerado no envio.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={briefing.submittedAt ? "diagnostico" : "respostas"}>
        <TabsList>
          <TabsTrigger value="respostas">Respostas</TabsTrigger>
          <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
          <TabsTrigger value="brutas">Respostas brutas</TabsTrigger>
        </TabsList>

        <TabsContent value="respostas" className="mt-5">
          <AnswersByCategory detail={detail} />
        </TabsContent>

        <TabsContent value="diagnostico" className="mt-5">
          <DiagnosisPanel detail={detail} />
        </TabsContent>

        <TabsContent value="brutas" className="mt-5">
          <RawAnswers detail={detail} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
