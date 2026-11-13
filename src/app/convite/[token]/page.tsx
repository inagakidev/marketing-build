import { findInvitationByToken } from "@/modules/identity/application/invitations";
import { LoginShell } from "@/components/admin/LoginShell";
import { AcceptInvitationForm } from "@/components/admin/AcceptInvitationForm";
import { InvitationProblemNotice } from "@/components/admin/InvitationProblemNotice";

/**
 * Where an invitee lands from the link the administrator sent (D12). Public:
 * the token in the URL is the only credential, which is why next.config.ts
 * sends this route with `no-referrer` and `noindex`.
 */
export default async function ConvitePage({ params }: PageProps<"/convite/[token]">) {
  const { token } = await params;
  const result = await findInvitationByToken(token);

  return (
    <LoginShell>
      {result.ok ? (
        <AcceptInvitationForm
          token={token}
          email={result.invitation.email}
          role={result.invitation.role}
          organizationName={result.invitation.organizationName}
        />
      ) : (
        <InvitationProblemNotice problem={result.problem} />
      )}
    </LoginShell>
  );
}
