import { describe, expect, it } from "vitest";
import { chooseBrowserSource } from "./pdfBrowser";

describe("chooseBrowserSource (DEPLOY-01)", () => {
  it("na Vercel usa o Chromium para serverless", () => {
    expect(chooseBrowserSource({ VERCEL: "1" })).toEqual({ kind: "serverless" });
  });

  it("em AWS Lambda também", () => {
    expect(chooseBrowserSource({ AWS_LAMBDA_FUNCTION_NAME: "fn" })).toEqual({ kind: "serverless" });
  });

  it("localmente usa o Chromium instalado, com caminho opcional", () => {
    expect(chooseBrowserSource({})).toEqual({ kind: "local" });
    expect(chooseBrowserSource({ CHROMIUM_EXECUTABLE_PATH: " /usr/bin/chromium " })).toEqual({
      kind: "local",
      executablePath: "/usr/bin/chromium",
    });
  });

  it("CHROMIUM_EXECUTABLE_PATH vazio é ignorado", () => {
    expect(chooseBrowserSource({ CHROMIUM_EXECUTABLE_PATH: "" })).toEqual({ kind: "local" });
  });
});
