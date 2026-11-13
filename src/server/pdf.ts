import { serverEnv } from "./env";
import { launchBrowser } from "./pdfBrowser";

/**
 * PDF generation from the print page.
 *
 * Reusing the page instead of drawing the PDF in code is deliberate: the
 * layout already exists, is responsive and is already in pt-BR. Keeping two
 * separate renderers would guarantee one of them goes stale.
 *
 * Which Chromium is used (serverless or local) lives in `pdfBrowser.ts`.
 */

/**
 * Renders a briefing's print page to PDF.
 *
 * The request's cookies are passed on to the browser: the print page is
 * authenticated, and without them Playwright would get a redirect to the
 * login and render the PDF of the wrong screen.
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
      // `networkidle` would wait for connections Next keeps open in
      // development and hit the timeout.
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    if (!response || !response.ok()) {
      throw new Error(
        `Print page responded ${response?.status() ?? "with no response"}.`,
      );
    }

    // Makes sure fonts loaded before measuring pagination.
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

/** Converts the `Cookie` header into the shape Playwright expects. */
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
