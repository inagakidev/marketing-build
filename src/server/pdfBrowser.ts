import type { Browser } from "playwright-core";

/**
 * Qual Chromium o gerador de PDF usa (DEPLOY-01).
 *
 * - **Serverless (Vercel/Lambda):** `@sparticuz/chromium`, um Chromium
 *   compactado que cabe numa função e é extraído para /tmp na primeira
 *   chamada de cada instância.
 * - **Local / contêiner:** o Chromium instalado pelo Playwright (dev
 *   dependency) ou o indicado em `CHROMIUM_EXECUTABLE_PATH`.
 *
 * As versões estão fixadas em par no package.json: `playwright-core` 1.63
 * fala o protocolo do Chromium 153, e `@sparticuz/chromium` 153.0.0 entrega
 * esse Chromium. Atualizar um exige atualizar o outro.
 */

export type BrowserSource = { kind: "serverless" } | { kind: "local"; executablePath?: string };

export function chooseBrowserSource(env: Record<string, string | undefined>): BrowserSource {
  if (env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME) return { kind: "serverless" };
  const executablePath = env.CHROMIUM_EXECUTABLE_PATH?.trim();
  return executablePath ? { kind: "local", executablePath } : { kind: "local" };
}

export async function launchBrowser(
  env: Record<string, string | undefined> = process.env,
): Promise<Browser> {
  const { chromium } = await import("playwright-core");
  const source = chooseBrowserSource(env);

  if (source.kind === "serverless") {
    const { default: serverlessChromium } = await import("@sparticuz/chromium");
    return chromium.launch({
      args: serverlessChromium.args,
      executablePath: await serverlessChromium.executablePath(),
    });
  }

  return chromium.launch({
    ...(source.executablePath ? { executablePath: source.executablePath } : {}),
    // Necessário em contêineres, onde o sandbox do Chromium não tem as
    // permissões de que precisa.
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
}
