"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UserCog, type LucideIcon } from "lucide-react";

/**
 * Panel sections (DS v2 sidebar, frames D1–D3; bottom bar on phones, D4).
 * Which items show is decided on the server from permissions; icons travel as
 * keys because components can't be passed from a server component.
 */

const ICONS: Record<string, LucideIcon> = { clients: Users, members: UserCog };

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

function isCurrent(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/clientes") || pathname.startsWith("/admin/briefings");
  }
  return pathname.startsWith(href);
}

export function AdminNav({ items, variant }: { items: NavItem[]; variant: "sidebar" | "bottom" }) {
  const pathname = usePathname();

  if (variant === "bottom") {
    return (
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      >
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const current = isCurrent(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-[0.75rem] no-underline ${
                current ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
              } hover:text-foreground`}
            >
              <Icon className="size-[22px]" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Principal" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const current = isCurrent(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm no-underline transition-colors duration-(--duration-fast) ${
              current
                ? "bg-muted font-semibold text-foreground hover:text-foreground"
                : "font-medium text-(--text-secondary) hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-[18px]" aria-hidden />
            <span className="flex-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
