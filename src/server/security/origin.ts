import { serverEnv } from "../env";

/**
 * Proteção contra CSRF nas mutações autenticadas (SEC-03).
 *
 * Os cookies do Supabase já são `SameSite=Lax`, o que barra POST cross-site.
 * A checagem de origem fecha o que sobra: subdomínios irmãos (same-site, mas
 * não same-origin) e a dependência de um detalhe de configuração de cookie.
 */

export interface OriginCheckInput {
  origin: string | null;
  secFetchSite: string | null;
  allowedOrigins: string[];
}

export function isTrustedRequestOrigin({
  origin,
  secFetchSite,
  allowedOrigins,
}: OriginCheckInput): boolean {
  if (origin) {
    // "null" é enviado por iframes sandbox e alguns redirecionamentos: não é
    // uma origem confiável.
    return allowedOrigins.includes(origin);
  }

  if (secFetchSite) {
    // "none" = ação direta do usuário (barra de endereço, favorito).
    return secFetchSite === "same-origin" || secFetchSite === "none";
  }

  // Sem nenhum dos dois: não é um navegador moderno enviando cookies de uma
  // vítima. A sessão continua sendo exigida pela rota.
  return true;
}

/** Origens aceitas: a da própria requisição e a URL pública configurada. */
export function allowedOriginsFor(request: Request): string[] {
  const origins = new Set<string>([new URL(request.url).origin]);
  // Já validada como URL http(s) em `serverEnv` (NEW-03).
  origins.add(new URL(serverEnv().appUrl).origin);
  return [...origins];
}

export class ForbiddenOriginError extends Error {
  constructor() {
    super("Origem da requisição não permitida");
    this.name = "ForbiddenOriginError";
  }
}

/** Lança `ForbiddenOriginError` quando a requisição vem de outra origem. */
export function assertSameOrigin(request: Request): void {
  const trusted = isTrustedRequestOrigin({
    origin: request.headers.get("origin"),
    secFetchSite: request.headers.get("sec-fetch-site"),
    allowedOrigins: allowedOriginsFor(request),
  });
  if (!trusted) throw new ForbiddenOriginError();
}
