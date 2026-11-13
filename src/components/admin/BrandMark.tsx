import { cn } from "cn";

/**
 * Product mark: three rising levels.
 *
 * It references what the system produces — signals classified into bands
 * (green/yellow/red) that make up the diagnosis. It inherits the context color
 * (`currentColor`), so it works on both dark and light panels.
 */
export function BrandGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      <rect x="3" y="13.5" width="4.6" height="7.5" rx="2.3" fill="currentColor" />
      <rect x="9.7" y="8.5" width="4.6" height="12.5" rx="2.3" fill="currentColor" />
      <rect x="16.4" y="3.5" width="4.6" height="17.5" rx="2.3" fill="currentColor" />
    </svg>
  );
}

/** The mark inside a rounded square, for use as a "logo". */
export function BrandMarkBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background",
        className,
      )}
    >
      <BrandGlyph className="size-5" />
    </span>
  );
}
