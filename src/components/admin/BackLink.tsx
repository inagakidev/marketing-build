import Link from "next/link";

/** "← Where you came from", the context line of a page header. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-muted-foreground no-underline hover:text-foreground hover:underline">
      ← {children}
    </Link>
  );
}
