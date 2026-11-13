"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Panel sections. Which links show is decided on the server (permissions);
 * this only marks the current one, with `aria-current` for screen readers.
 */
export function AdminNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal" className="flex items-center gap-1">
      {items.map((item) => {
        const current =
          item.href === "/admin"
            ? pathname === "/admin" || pathname.startsWith("/admin/clientes") || pathname.startsWith("/admin/briefings")
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`flex h-9 items-center rounded-lg px-3 text-sm no-underline transition-colors ${
              current
                ? "bg-muted font-semibold text-foreground hover:text-foreground"
                : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
