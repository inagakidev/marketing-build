import { serverEnv } from "./env";
import { launchBrowser } from "./pdfBrowser";

/**
 * Geração de PDF a partir da página de impressão.
 *
 * Reaproveitar a página em vez de desenhar o PDF em código é deliberado: o
 * layout já existe, já é responsivo e já está traduzido. Manter dois
 * renderizadores separados garantiria que um deles ficasse desatualizado.
 *
 * Qual Chromium é usado (serverless ou local) fica em `pdfBrowser.ts`.
 */

/**
 * Renderiza a página de impressão de um briefing em PDF.
 *
 * Os cookies da requisição são repassados ao navegador: a página de impressão
 * é autenticada, e sem eles o Playwright receberia um redirecionamento para o
 * login e geraria o PDF da tela errada.
 */
export async function renderBriefingPdf(
  briefingId: string,
  cookieHeader: string | null,
): Promise<Buffer> {
  const baseUrl = serverEnv().appUrl;
  const url = `${baseUrl}/print/briefing/${briefingId}`;

  const browser = await launchBrowser();

  try {
    const context = await browser.newContext();

    if (cookieHeader) {
      const { hostname } = new URL(baseUrl);
      const cookies = parseCookieHeader(cookieHeader, hostname);
      if (cookies.length > 0) await context.addCookies(cookies);
    }

    const page = await context.newPage();

    const response = await page.goto(url, {
      // `networkidle` esperaria conexões que o Next mantém abertas em
      // desenvolvimento e estouraria o tempo limite.
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    if (!response || !response.ok()) {
      throw new Error(
        `Página de impressão respondeu ${response?.status() ?? "sem resposta"}.`,
      );
    }

    // Garante que as fontes carregaram antes de medir a paginação.
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

/** Converte o cabeçalho `Cookie` no formato que o Playwright espera. */
function parseCookieHeader(header: string, domain: string) {
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const separator = part.indexOf("=");
      if (separator <= 0) return [];
      return [
        {
          name: part.slice(0, separator),
          value: part.slice(separator + 1),
          domain,
          path: "/",
        },
      ];
    });
}
