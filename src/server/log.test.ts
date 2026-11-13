import { describe, expect, it } from "vitest";
import { redact, serializeError } from "./log";

describe("redact (logs without tokens/PII)", () => {
  it("masks emails", () => {
    expect(redact("falhou para ana.silva@exemplo.com.br agora")).toBe("falhou para [email] agora");
  });

  it("masks tokens and long secrets", () => {
    expect(redact("token=Ab3dEf7hJk9mNpQrStUvWxYz ok")).toBe("token=[token] ok");
    expect(redact("/briefing/Ab3dEf7hJk9mNpQrStUvWxYz")).toBe("/briefing/[token]");
  });

  it("masks phone numbers", () => {
    expect(redact("ligar (11) 98765-4321")).toBe("ligar [phone]");
  });

  it("masks credentials in a connection string", () => {
    expect(redact("postgresql://briefing:senha@localhost:5432/db")).toBe("postgresql://[credentials]@localhost:5432/db");
  });

  it("truncates long messages", () => {
    expect(redact("a ".repeat(1000)).length).toBeLessThanOrEqual(501);
  });
});

describe("serializeError", () => {
  it("keeps name, code and redacted message, not the whole object", () => {
    const error = Object.assign(new Error("Unique constraint em ana@exemplo.com"), {
      name: "PrismaClientKnownRequestError",
      code: "P2002",
      meta: { target: ["email"], value: "ana@exemplo.com" },
    });
    const out = serializeError(error);
    expect(out).toEqual({
      name: "PrismaClientKnownRequestError",
      code: "P2002",
      message: "Unique constraint em [email]",
    });
    expect(JSON.stringify(out)).not.toContain("ana@exemplo.com");
  });

  it("handles values that aren't Errors", () => {
    expect(serializeError("x")).toEqual({ name: "NonError", message: "x" });
  });
});
