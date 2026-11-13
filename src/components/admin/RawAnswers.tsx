import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BriefingDetail } from "@/server/briefingDetail";
import { formatDateTime } from "@/lib/labels";

/**
 * Raw answers, with each question's technical key.
 *
 * Used for checking and for investigating why a signal fired (or didn't):
 * rules reference questions by `key`, and that's the key shown here.
 */
export function RawAnswers({ detail }: { detail: BriefingDetail }) {
  const rows = detail.categories.flatMap((category) =>
    category.answers.map((answer) => ({ ...answer, category: category.label })),
  );

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chave</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Respondida em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.questionKey}>
                <TableCell className="align-top">
                  <code className="text-xs">{row.questionKey}</code>
                </TableCell>
                <TableCell className="align-top text-muted-foreground whitespace-nowrap">
                  {row.category}
                </TableCell>
                <TableCell className="align-top max-w-md">
                  {row.value == null ? (
                    <span className="text-muted-foreground italic">null</span>
                  ) : (
                    <span className="whitespace-pre-wrap break-words text-sm">
                      {Array.isArray(row.value)
                        ? JSON.stringify(row.value)
                        : row.value}
                    </span>
                  )}
                </TableCell>
                <TableCell className="align-top text-muted-foreground whitespace-nowrap">
                  {formatDateTime(row.answeredAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
