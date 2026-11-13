import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";

/**
 * Área autenticada.
 *
 * A checagem acontece aqui, no servidor, e não apenas no `proxy.ts`: o proxy é
 * a primeira barreira, mas a autorização precisa valer também para quem chega
 * por navegação interna, quando o proxy pode não rodar.
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
          <Link href="/admin" className="font-semibold tracking-tight">
            Briefing Inteligente
          </Link>
          <span className="text-sm text-muted-foreground truncate">
            {user.name}
          </span>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
