import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Authenticated area.
 *
 * The check happens here, on the server, and not only in `proxy.ts`: the
 * proxy is the first barrier, but authorization must also apply to whoever
 * arrives through internal navigation, when the proxy may not run.
 */
export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/admin");

  return (
    <div data-context="admin" className="flex flex-1 flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/admin" className="font-bold tracking-tight text-foreground hover:text-foreground">
            Briefing Inteligente
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground truncate">
              {user.name}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
