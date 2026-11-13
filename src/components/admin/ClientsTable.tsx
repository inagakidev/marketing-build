"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BRIEFING_STATUS_LABELS,
  BRIEFING_STATUS_TONE,
  BUSINESS_TYPE_LABELS,
  formatDate,
} from "@/lib/labels";

interface Row {
  id: string;
  name: string;
  contactEmail: string;
  projectType: string | null;
  createdAt: Date;
  latestBriefing: {
    id: string;
    status: string;
    businessType: string | null;
    submittedAt: Date | null;
  } | null;
}

const FILTERS = [
  { value: null, label: "Todos" },
  { value: "awaiting_response", label: "Aguardando" },
  { value: "in_progress", label: "Em preenchimento" },
  { value: "ready_for_review", label: "Para revisar" },
  { value: "approved", label: "Aprovados" },
];

export function ClientsTable({
  rows,
  activeStatus,
}: {
  rows: Row[];
  activeStatus: string | null;
}) {
  const router = useRouter();

  function applyFilter(status: string | null) {
    router.push(status ? `/admin?status=${status}` : "/admin");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((filter) => (
          <Button
            key={filter.label}
            size="sm"
            variant={activeStatus === filter.value ? "default" : "outline"}
            onClick={() => applyFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nenhum cliente com esse status." />
      ) : (
      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo de negócio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/admin/clientes/${row.id}`}
                      className="font-medium hover:underline"
                    >
                      {row.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {row.contactEmail}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.latestBriefing?.businessType
                      ? BUSINESS_TYPE_LABELS[row.latestBriefing.businessType]
                      : row.projectType || "—"}
                  </TableCell>
                  <TableCell>
                    {row.latestBriefing ? (
                      <Badge
                        variant={
                          BRIEFING_STATUS_TONE[row.latestBriefing.status] ??
                          "secondary"
                        }
                      >
                        {BRIEFING_STATUS_LABELS[row.latestBriefing.status]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Sem briefing
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {row.latestBriefing ? (
                      <Link
                        href={`/admin/briefings/${row.latestBriefing.id}`}
                        className={buttonVariants({ size: "sm", variant: "outline" })}
                      >
                        Ver briefing
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/clientes/${row.id}`}
                        className={buttonVariants({ size: "sm", variant: "outline" })}
                      >
                        Abrir
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      )}
    </div>
  );
}
