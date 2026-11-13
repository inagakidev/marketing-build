import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BriefingDetail } from "@/server/briefingDetail";
import {
  DIAGNOSIS_STATUS_CLASSES,
  DIAGNOSIS_STATUS_LABELS,
  SEVERITY_LABELS,
} from "@/lib/labels";

/**
 * Traffic light, main problems and opportunities.
 *
 * The screen order is deliberate: first the overview of the five categories,
 * then what's worst and why, and only then what can be leveraged. It's the
 * sequence of a diagnosis conversation — situation, problem, way out.
 */
export function DiagnosisPanel({ detail }: { detail: BriefingDetail }) {
  const { diagnoses, summary } = detail;

  if (diagnoses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          O diagnóstico é gerado quando o cliente envia o briefing.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {diagnoses.map((diagnosis) => (
          <div
            key={diagnosis.category}
            className={`rounded-lg border p-4 ${DIAGNOSIS_STATUS_CLASSES[diagnosis.status]}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-medium">{diagnosis.label}</h3>
              <span className="text-2xl font-semibold tabular-nums">
                {diagnosis.score ?? "—"}
              </span>
            </div>
            <p className="text-sm mt-1 opacity-90">
              {DIAGNOSIS_STATUS_LABELS[diagnosis.status]}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Principais problemas</h2>
        {summary.problems.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-muted-foreground text-sm">
              Nenhuma categoria caiu para a faixa vermelha. Vale olhar as
              amarelas na aba de respostas.
            </CardContent>
          </Card>
        ) : (
          summary.problems.map((problem) => (
            <Card key={problem.category}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3 text-base">
                  <span>{problem.label}</span>
                  <span className="text-sm font-normal text-muted-foreground tabular-nums">
                    {problem.score}/100
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {problem.signals.map((signal) => (
                  <div
                    key={signal.code}
                    className="border-l-2 border-destructive/40 pl-3 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {SEVERITY_LABELS[signal.severity]}
                      </Badge>
                      <code className="text-xs text-muted-foreground">
                        {signal.code}
                      </code>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {signal.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Oportunidades</h2>
        {summary.opportunities.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-muted-foreground text-sm">
              Nenhuma alavanca evidente nas respostas.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-4 space-y-3">
              {summary.opportunities.map((opportunity, index) => (
                <div key={`${opportunity.label}-${index}`} className="text-sm">
                  <p className="font-medium">{opportunity.label}</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {opportunity.detail}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
