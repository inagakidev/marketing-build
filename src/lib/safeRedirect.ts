/**
 * Destino seguro para o redirecionamento pós-login (SEC-02).
 *
 * O valor vem do query string (`/login?redirect=...`), então é controlado por
 * quem monta o link. Aceitar qualquer coisa transformaria a tela de login num
 * open redirect: um link legítimo do nosso domínio levando a um site falso.
 *
 * Usado no servidor e no browser — por isso vive em `src/lib` e é puro.
 */

export const DEFAULT_REDIRECT = "/admin";

/** Base fictícia: só serve para o `URL` resolver o caminho e revelar a origem. */
const PROBE_ORIGIN = "http://interno.invalid";

export function safeRedirectPath(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_REDIRECT;

  // Só caminho absoluto interno. `//x` e `/\x` são lidos pelos navegadores
  // como "outro host", e caractere de controle pode ser descartado no meio
  // do caminho, fazendo `/\t/x` virar `//x`.
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_REDIRECT;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return DEFAULT_REDIRECT;

  let url: URL;
  try {
    url = new URL(value, PROBE_ORIGIN);
  } catch {
    return DEFAULT_REDIRECT;
  }
  if (url.origin !== PROBE_ORIGIN) return DEFAULT_REDIRECT;

  // Voltar para o próprio login criaria um laço sem saída.
  if (url.pathname === "/login") return DEFAULT_REDIRECT;

  return `${url.pathname}${url.search}${url.hash}`;
}
