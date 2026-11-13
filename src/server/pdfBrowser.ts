import type { Browser } from "playwright-core";

/**
 * Which Chromium the PDF generator uses (DEPLOY-01).
 *
 * - **Serverless (Vercel/Lambda):** `@sparticuz/chromium`, a compressed
 *   Chromium that fits in a function and is extracted to /tmp on each
 *   instance's first call.
 * - **Local / container:** the Chromium installed by Playwright (dev
 *   dependency) or the one set in `CHROMIUM_EXECUTABLE_PATH`.
 *
 * Versions are pinned as a pair in package.json: `playwright-core` 1.63
 * speaks Chromium 153's protocol, and `@sparticuz/chromium` 153.0.0 ships that
 * Chromium. Upgrading one requires upgrading the other.
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
    // Needed in containers, where Chromium's sandbox lacks the permissions it
    // needs.
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
}
