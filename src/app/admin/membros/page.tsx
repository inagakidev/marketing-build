import { getSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { canManageMembers } from "@/modules/identity/domain/permissions";
import { listOrganizationMembers } from "@/modules/identity/application/members";
import { Badge } from "@/components/ui/badge";
import { InviteMemberDialog } from "@/components/admin/InviteMemberDialog";
import { MemberActions } from "@/components/admin/MemberActions";
import { MemberAvatar } from "@/components/admin/MemberAvatar";
import { PermissionDenied } from "@/components/admin/PermissionDenied";
import { RevokeInvitationButton } from "@/components/admin/RevokeInvitationButton";
import { formatDate, MEMBERSHIP_ROLE_LABELS } from "@/lib/labels";
import { PageBody, PageHeader } from "@/components/admin/PageHeader";

/**
 * Members and access (EP-04.5), after the "Membros e acessos" block of the
 * DS v2 admin dashboard (frame D1). Administrators only (D11).
 */
export default async function MembrosPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!canManageMembers(user.role)) {
    return (
      <PermissionDenied description="Só pessoas administradoras gerenciam membros e convites. Se precisar convidar alguém, fale com uma delas." />
    );
  }

  const [{ members, invitations }, organization] = await Promise.all([
    listOrganizationMembers(user),
    prisma.organization.findUniqueOrThrow({ where: { id: user.organizationId }, select: { name: true } }),
  ]);
  const activeCount = members.filter((m) => m.status === "active").length;

  return (
    <>
      <PageHeader context={organization.name} title="Membros e acessos" actions={<InviteMemberDialog />} />
      <PageBody>

      <section aria-labelledby="members-title" className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="members-title" className="text-[1.0625rem] font-semibold">
            Membros
          </h2>
          <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
            {activeCount} {activeCount === 1 ? "ativo" : "ativos"}
          </span>
        </div>
        <ul className="divide-y divide-border">
          {members.map((member) => {
            const active = member.status === "active";
            return (
              <li key={member.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
                <MemberAvatar name={member.name} muted={!active} />
                <div className="min-w-0 flex-1 basis-48">
                  <p className={`truncate text-sm font-medium ${active ? "" : "text-muted-foreground"}`}>
                    {member.name}
                    {member.isSelf && <span className="font-normal text-muted-foreground"> · você</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email} · {MEMBERSHIP_ROLE_LABELS[member.role]} · desde {formatDate(member.joinedAt)}
                  </p>
                </div>
                <Badge variant={active ? "success" : "neutral"}>{active ? "Ativo" : "Desativado"}</Badge>
                <MemberActions
                  membershipId={member.id}
                  name={member.name}
                  role={member.role}
                  status={member.status}
                  isSelf={member.isSelf}
                />
              </li>
            );
          })}
        </ul>
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Membros desativados perdem o acesso na hora, mas a autoria do que fizeram continua no histórico.
        </p>
      </section>

      <section aria-labelledby="invites-title" className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="invites-title" className="text-[1.0625rem] font-semibold">
            Convites pendentes
          </h2>
          <span className="text-[0.8125rem] text-muted-foreground tabular-nums">{invitations.length}</span>
        </div>
        {invitations.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            Nenhum convite pendente. Use “Convidar membro” para gerar um link de acesso.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-sm font-medium">{invitation.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {MEMBERSHIP_ROLE_LABELS[invitation.role]} · convidado por {invitation.invitedByName} · expira em{" "}
                    {formatDate(invitation.expiresAt)}
                  </p>
                </div>
                <Badge variant="info">Aguardando</Badge>
                <RevokeInvitationButton invitationId={invitation.id} email={invitation.email} />
              </li>
            ))}
          </ul>
        )}
      </section>
      </PageBody>
    </>
  );
}
