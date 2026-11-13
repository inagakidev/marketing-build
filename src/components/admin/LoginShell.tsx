import { BrandGlyph } from "./BrandMark";
import { LoginBrandPanel } from "./LoginBrandPanel";

/**
 * Login screen frame: a single centered card, split into a showcase panel
 * (left, on desktop) and the form area (right).
 *
 * Below the `lg` breakpoint the panel disappears and the card becomes a narrow
 * column, with a reduced mark on top of the form — the essentials stay visible
 * without squeezing the fields.
 */
export function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main data-context="admin" className="flex min-h-svh w-full items-center justify-center bg-muted/40 p-4 sm:p-6">
      <div className="grid w-full max-w-md overflow-hidden rounded-2xl bg-card text-card-foreground shadow-lg shadow-foreground/5 ring-1 ring-foreground/10 lg:max-w-5xl lg:grid-cols-[1.05fr_1fr]">
        <LoginBrandPanel />

        <div className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <BrandGlyph className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Briefing Inteligente
            </span>
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}
