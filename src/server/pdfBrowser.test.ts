import { describe, expect, it } from "vitest";
import { chooseBrowserSource } from "./pdfBrowser";

describe("chooseBrowserSource (DEPLOY-01)", () => {
  it("uses the serverless Chromium on Vercel", () => {
    expect(chooseBrowserSource({ VERCEL: "1" })).toEqual({ kind: "serverless" });
  });

  it("on AWS Lambda too", () => {
    expect(chooseBrowserSource({ AWS_LAMBDA_FUNCTION_NAME: "fn" })).toEqual({ kind: "serverless" });
  });

  it("uses the installed Chromium locally, with an optional path", () => {
    expect(chooseBrowserSource({})).toEqual({ kind: "local" });
    expect(chooseBrowserSource({ CHROMIUM_EXECUTABLE_PATH: " /usr/bin/chromium " })).toEqual({
      kind: "local",
      executablePath: "/usr/bin/chromium",
    });
  });

  it("an empty CHROMIUM_EXECUTABLE_PATH is ignored", () => {
    expect(chooseBrowserSource({ CHROMIUM_EXECUTABLE_PATH: "" })).toEqual({ kind: "local" });
  });
});
