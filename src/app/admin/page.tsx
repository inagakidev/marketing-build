import Link from "next/link";
import { getSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { ClientsTable } from "@/components/admin/ClientsTable";

/** Client list with the status of each one's most recent briefing. */
export default async function AdminHomePage({
  searchParams,
}: PageProps<"/admin">) {
  const user = await getSessionUser();
  if (!user) return null; // the layout already redirected

  const { status } = await searchParams;
  const statusFilter = typeof status === "string" ? status : null;

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      contactEmail: true,
      projectType: true,
      createdAt: true,
      briefings: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          businessType: true,
          submittedAt: true,
        },
      },
    },
  });

  const rows = clients.map(({ briefings, ...client }) => ({
    ...client,
    latestBriefing: briefings[0] ?? null,
  }));

  // The filter is applied here, not in the query: volume is dozens of
  // clients, and filtering by "latest briefing status" in SQL would need a
  // lateral subquery that doesn't pay off at this scale.
  const filtered = statusFilter
    ? rows.filter((row) => row.latestBriefing?.status === statusFilter)
    : rows;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length === 0
              ? "Nenhum cliente ainda."
              : `${rows.length} cliente${rows.length > 1 ? "s" : ""}.`}
          </p>
        </div>
        <Link href="/admin/clientes/novo" className={buttonVariants()}>Novo cliente</Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhum cliente ainda."
          description="Cadastre o primeiro cliente para gerar um link de briefing."
          action={
            <Link href="/admin/clientes/novo" className={buttonVariants({ variant: "brand" })}>
              Cadastrar cliente
            </Link>
          }
        />
      ) : (
        <ClientsTable rows={filtered} activeStatus={statusFilter} />
      )}
    </div>
  );
}
