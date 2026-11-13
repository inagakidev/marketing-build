import { BrandGlyph } from "./BrandMark";
import { LoginBrandPanel } from "./LoginBrandPanel";

/**
 * Moldura da tela de login: um único cartão centralizado, dividido em painel de
 * apresentação (à esquerda, no desktop) e área do formulário (à direita).
 *
 * Abaixo do breakpoint `lg` o painel some e o cartão vira uma coluna estreita,
 * com a marca reduzida no topo do formulário — o essencial continua visível sem
 * apertar os campos.
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
