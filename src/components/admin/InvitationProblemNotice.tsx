import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Mascot } from "@/components/Mascot";
import { INVITATION_PROBLEM_MESSAGES, type InvitationProblem } from "@/lib/invitationProblems";

/** An invitation link that can't be used, with what to do next. */
export function InvitationProblemNotice({ problem }: { problem: InvitationProblem }) {
  const message = INVITATION_PROBLEM_MESSAGES[problem];
  const canSignIn = problem === "accepted" || problem === "already_has_account";

  return (
    <div className="w-full space-y-6">
      <header className="space-y-3">
        <Mascot name="missing" />
        <h1 className="text-xl font-semibold tracking-tight">{message.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{message.text}</p>
      </header>
      {canSignIn && (
        <Link href="/login" className={buttonVariants({ size: "lg", className: "w-full" })}>
          Ir para o login
        </Link>
      )}
    </div>
  );
}
