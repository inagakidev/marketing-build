import Link from "next/link";
import { getSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientsTable } from "@/components/admin/ClientsTable";

/** Lista de clientes com o status do briefing mais recente de cada. */
export default async function AdminHomePage({
  searchParams,
}: PageProps<"/admin">) {
  const user = await getSessionUser();
  if (!user) return null; // o layout já redirecionou

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

  // O filtro é aplicado aqui, e não na consulta: o volume é de dezenas de
  // clientes, e filtrar por "status do briefing mais recente" no SQL exigiria
  // uma subconsulta lateral que não se paga nesta escala.
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
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">
              Cadastre o primeiro cliente para gerar um link de briefing.
            </p>
            <Link href="/admin/clientes/novo" className={buttonVariants()}>Cadastrar cliente</Link>
          </CardContent>
        </Card>
      ) : (
        <ClientsTable rows={filtered} activeStatus={statusFilter} />
      )}
    </div>
  );
}
