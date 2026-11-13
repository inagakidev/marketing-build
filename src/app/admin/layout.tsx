import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminNav, type NavItem } from "@/components/admin/AdminNav";
import { MemberAvatar } from "@/components/admin/MemberAvatar";
import { canManageMembers } from "@/modules/identity/domain/permissions";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/labels";

/**
 * Authenticated area, in the DS v2 panel frame (D1–D4): a 248px sidebar on
 * desktop; on phones a top bar and a bottom navigation bar.
 *
 * The check happens here, on the server, and not only in `proxy.ts`: the
 * proxy is the first barrier, but authorization must also apply to whoever
 * arrives through internal navigation, when the proxy may not run.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/admin");

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: user.organizationId },
    select: { name: true },
  });

  const nav: NavItem[] = [
    { href: "/admin", label: "Clientes", icon: "clients" },
    ...(canManageMembers(user.role) ? [{ href: "/admin/membros", label: "Membros", icon: "members" } as const] : []),
  ];
  const roleLabel = MEMBERSHIP_ROLE_LABELS[user.role] ?? user.role;

  return (
    <div data-context="admin" className="flex flex-1 flex-col md:flex-row">
      <aside className="hidden w-[248px] shrink-0 flex-col gap-5 border-r border-border bg-card px-3.5 py-5 md:sticky md:top-0 md:flex md:h-svh">
        <Brand />
        <p className="flex h-10 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium">
          <span className="truncate">{organization.name}</span>
        </p>
        <AdminNav items={nav} variant="sidebar" />
        <div className="mt-auto flex items-center gap-2.5 border-t border-border px-1.5 pt-3">
          <MemberAvatar name={user.name} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[0.8125rem] font-semibold">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
          </span>
          <ThemeToggle />
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4 md:hidden">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span title={`${user.name} · ${roleLabel}`}>
            <MemberAvatar name={user.name} />
          </span>
        </div>
      </header>

      <main className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">{children}</main>

      <AdminNav items={nav} variant="bottom" />
    </div>
  );
}

function Brand() {
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2.5 px-1.5 text-[0.9375rem] font-bold tracking-[-0.01em] text-foreground no-underline hover:text-foreground"
    >
      {/* Decorative: the product name is written next to it. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG, no optimization to gain */}
      <img src="/brand/symbol.svg" alt="" aria-hidden="true" className="h-[30px] w-auto dark:invert" />
      Briefing Inteligente
    </Link>
  );
}
