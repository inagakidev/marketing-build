import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BriefingDetail } from "@/server/briefingDetail";

/** Answers organized by category — the main way to read the briefing. */
export function AnswersByCategory({ detail }: { detail: BriefingDetail }) {
  return (
    <div className="space-y-5">
      {detail.categories.map((category) => (
        <Card key={category.category}>
          <CardHeader>
            <CardTitle className="text-base">{category.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {category.answers.map((answer) => (
              <div key={answer.questionKey} className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {answer.text}
                </p>
                <AnswerValue value={answer.value} required={answer.required} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AnswerValue({
  value,
  required,
}: {
  value: string | string[] | null;
  required: boolean;
}) {
  const empty =
    value == null ||
    (Array.isArray(value) ? value.length === 0 : value.trim() === "");

  if (empty) {
    return (
      <p
        className={`text-sm italic ${required ? "text-destructive" : "text-muted-foreground"}`}
      >
        {required ? "Obrigatória, sem resposta" : "Não respondida"}
      </p>
    );
  }

  if (Array.isArray(value)) {
    return (
      <ul className="text-sm list-disc list-inside">
        {value.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  // `whitespace-pre-wrap` keeps the line breaks the client typed — in long
  // answers they're usually the structure of their reasoning.
  return <p className="text-sm whitespace-pre-wrap leading-relaxed">{value}</p>;
}
