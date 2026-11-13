import { describe, expect, it } from "vitest";
import { redact, serializeError } from "./log";

describe("redact (logs sem token/PII)", () => {
  it("mascara e-mails", () => {
    expect(redact("falhou para ana.silva@exemplo.com.br agora")).toBe("falhou para [email] agora");
  });

  it("mascara tokens e segredos longos", () => {
    expect(redact("token=Ab3dEf7hJk9mNpQrStUvWxYz ok")).toBe("token=[token] ok");
    expect(redact("/briefing/Ab3dEf7hJk9mNpQrStUvWxYz")).toBe("/briefing/[token]");
  });

  it("mascara telefones", () => {
    expect(redact("ligar (11) 98765-4321")).toBe("ligar [telefone]");
  });

  it("mascara credenciais em connection string", () => {
    expect(redact("postgresql://briefing:senha@localhost:5432/db")).toBe("postgresql://[credenciais]@localhost:5432/db");
  });

  it("trunca mensagens longas", () => {
    expect(redact("a ".repeat(1000)).length).toBeLessThanOrEqual(501);
  });
});

describe("serializeError", () => {
  it("guarda nome, código e mensagem redigida, sem o objeto inteiro", () => {
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

  it("lida com valores que não são Error", () => {
    expect(serializeError("x")).toEqual({ name: "NonError", message: "x" });
  });
});
