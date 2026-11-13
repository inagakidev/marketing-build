import type { MetadataRoute } from "next";

/**
 * Nada do produto deve ser indexado: o painel é interno e o formulário público
 * só faz sentido com o token, que é uma credencial (SEC-05).
 *
 * `robots.txt` é um pedido, não uma proteção — as rotas privadas também
 * enviam `X-Robots-Tag: noindex` (next.config.ts) e exigem sessão ou token.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/$",
      disallow: ["/admin", "/briefing", "/print", "/login", "/api"],
    },
  };
}
