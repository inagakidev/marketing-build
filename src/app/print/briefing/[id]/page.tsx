import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { loadBriefingDetail } from "@/server/briefingDetail";
import {
  BRIEFING_STATUS_LABELS,
  BUSINESS_TYPE_LABELS,
  DIAGNOSIS_STATUS_LABELS,
  SEVERITY_LABELS,
  formatDate,
  formatDateTime,
} from "@/lib/labels";

/**
 * Print page: the PDF's source.
 *
 * Authenticated like any panel screen — Playwright gets here with the admin's
 * cookies (see `src/server/pdf.ts`).
 *
 * The styling is intentionally different from the panel: white background, no
 * interactivity, no theme color, and `break-inside` so sections don't split
 * across pages.
 */
export default async function PrintBriefingPage({
  params,
}: PageProps<"/print/briefing/[id]">) {
  const user = await getSessionUser();
  if (!user) notFound();

  const { id } = await params;
  const detail = await loadBriefingDetail(id, user.id);
  if (!detail) notFound();

  const { briefing, client, diagnoses, summary } = detail;

  return (
    <div className="print-root">
      <style>{PRINT_CSS}</style>

      <header className="cabecalho">
        <div>
          <p className="rotulo">Briefing</p>
          <h1>{client.name}</h1>
        </div>
        <div className="meta">
          <p>{BRIEFING_STATUS_LABELS[briefing.status]}</p>
          {briefing.businessType && (
            <p>{BUSINESS_TYPE_LABELS[briefing.businessType]}</p>
          )}
          <p>
            {briefing.submittedAt
              ? `Enviado em ${formatDateTime(briefing.submittedAt)}`
              : `Criado em ${formatDate(briefing.createdAt)}`}
          </p>
        </div>
      </header>

      {diagnoses.length > 0 && (
        <section className="secao">
          <h2>Diagnóstico</h2>
          <table className="semaforo">
            <thead>
              <tr>
                <th>Categoria</th>
                <th className="num">Pontuação</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {diagnoses.map((diagnosis) => (
                <tr key={diagnosis.category}>
                  <td>{diagnosis.label}</td>
                  <td className="num">{diagnosis.score ?? "—"}</td>
                  <td>
                    <span className={`pastilha ${diagnosis.status}`}>
                      {DIAGNOSIS_STATUS_LABELS[diagnosis.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {summary.problems.length > 0 && (
        <section className="secao">
          <h2>Principais problemas</h2>
          {summary.problems.map((problem) => (
            <div key={problem.category} className="bloco">
              <h3>
                {problem.label}{" "}
                <span className="pontuacao">{problem.score}/100</span>
              </h3>
              {problem.signals.map((signal) => (
                <div key={signal.code} className="sinal">
                  <p className="sinal-titulo">
                    {SEVERITY_LABELS[signal.severity]} · {signal.code}
                  </p>
                  <p>{signal.description}</p>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {summary.opportunities.length > 0 && (
        <section className="secao">
          <h2>Oportunidades</h2>
          <ul className="lista">
            {summary.opportunities.map((opportunity, index) => (
              <li key={`${opportunity.label}-${index}`}>
                <strong>{opportunity.label}:</strong> {opportunity.detail}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="secao quebra-antes">
        <h2>Respostas</h2>
        {detail.categories.map((category) => (
          <div key={category.category} className="bloco">
            <h3>{category.label}</h3>
            {category.answers.map((answer) => (
              <div key={answer.questionKey} className="resposta">
                <p className="pergunta">{answer.text}</p>
                <p className={answer.value == null ? "vazia" : "valor"}>
                  {formatValue(answer.value)}
                </p>
              </div>
            ))}
          </div>
        ))}
      </section>

      <footer className="rodape">
        Gerado por Briefing Inteligente em {formatDateTime(new Date())}.
      </footer>
    </div>
  );
}

function formatValue(value: string | string[] | null): string {
  if (value == null) return "Não respondida";
  if (Array.isArray(value)) {
    return value.length === 0 ? "Não respondida" : value.join(" · ");
  }
  return value.trim() === "" ? "Não respondida" : value;
}

/**
 * CSS embedded in the page instead of coming from Tailwind.
 *
 * Tailwind's stylesheet is built for screens: theme colors, dark mode,
 * viewport-relative units. For print, a handful of explicit rules in
 * millimeters and points gives a much more predictable result — and keeps a
 * theme change in the panel from accidentally altering the PDF.
 */
const PRINT_CSS = `
  .print-root {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #111;
    background: #fff;
    font-size: 10.5pt;
    line-height: 1.5;
    max-width: 190mm;
    margin: 0 auto;
    padding: 0 4mm;
  }
  .print-root h1 { font-size: 20pt; margin: 0; letter-spacing: -0.01em; }
  .print-root h2 {
    font-size: 13pt;
    margin: 0 0 3mm;
    padding-bottom: 1.5mm;
    border-bottom: 1px solid #ddd;
  }
  .print-root h3 { font-size: 11pt; margin: 0 0 2mm; }
  .print-root p { margin: 0 0 1.5mm; }

  .cabecalho {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8mm;
    padding-bottom: 4mm;
    margin-bottom: 6mm;
    border-bottom: 2px solid #111;
  }
  .rotulo {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 8pt;
    color: #666;
  }
  .meta { text-align: right; font-size: 9pt; color: #555; }

  .secao { margin-bottom: 7mm; }
  /* Don't leave an orphan heading at the bottom of a page. */
  .secao h2 { break-after: avoid; }
  .bloco { margin-bottom: 4mm; break-inside: avoid; }

  .semaforo { width: 100%; border-collapse: collapse; font-size: 10pt; }
  .semaforo th {
    text-align: left;
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #666;
    padding: 1.5mm 2mm;
    border-bottom: 1px solid #ddd;
  }
  .semaforo td { padding: 2mm; border-bottom: 1px solid #eee; }
  .semaforo .num { text-align: right; font-variant-numeric: tabular-nums; }

  .pastilha {
    display: inline-block;
    padding: 0.5mm 2mm;
    border-radius: 2mm;
    font-size: 9pt;
    border: 1px solid;
  }
  .pastilha.green  { background: #ecfdf5; color: #065f46; border-color: #6ee7b7; }
  .pastilha.yellow { background: #fffbeb; color: #92400e; border-color: #fcd34d; }
  .pastilha.red    { background: #fef2f2; color: #991b1b; border-color: #fca5a5; }
  .pastilha.gray   { background: #f4f4f5; color: #52525b; border-color: #d4d4d8; }

  .pontuacao { font-weight: 400; color: #666; font-size: 10pt; }
  .sinal { border-left: 2px solid #ddd; padding-left: 3mm; margin-bottom: 2.5mm; }
  .sinal-titulo {
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #666;
  }

  .lista { margin: 0; padding-left: 5mm; }
  .lista li { margin-bottom: 1.5mm; }

  .resposta { margin-bottom: 3mm; break-inside: avoid; }
  .pergunta { color: #555; font-size: 9.5pt; }
  .valor { white-space: pre-wrap; }
  .vazia { color: #999; font-style: italic; }

  .quebra-antes { break-before: page; }

  .rodape {
    margin-top: 8mm;
    padding-top: 3mm;
    border-top: 1px solid #ddd;
    font-size: 8.5pt;
    color: #888;
  }
`;
