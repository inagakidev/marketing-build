import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BriefingDetail } from "@/server/briefingDetail";
import { SEVERITY_LABELS } from "@/lib/labels";
import { DiagnosisCategoryCard } from "@/components/admin/DiagnosisCategoryCard";

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
      <section aria-label="Categorias do diagnóstico" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {diagnoses.map((diagnosis) => (
          <DiagnosisCategoryCard
            key={diagnosis.category}
            diagnosis={diagnosis}
            questionTextByKey={detail.questionTextByKey}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg leading-[1.625rem] font-semibold">Principais problemas</h2>
        {summary.problems.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-muted-foreground text-sm">
              Nenhuma categoria ficou como prioritária. Vale olhar as que
              pedem atenção na aba de respostas.
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
        <h2 className="text-lg leading-[1.625rem] font-semibold">Oportunidades</h2>
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
