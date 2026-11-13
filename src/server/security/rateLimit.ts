import { prisma } from "../db";
import {
  clientIp,
  RATE_LIMITS,
  rateLimitKey,
  retryAfterSeconds,
  windowStartFor,
  type RateLimitPolicy,
  type RateLimitResult,
  type RateLimitScope,
} from "./rateLimitRules";

export { RATE_LIMITS, rateLimitKey, type RateLimitScope } from "./rateLimitRules";

/**
 * Rate limiting por janela fixa, com contador no Postgres (SEC-04, D2).
 *
 * Em Vercel serverless cada instância tem a própria memória, então um contador
 * local não limitaria nada. O Postgres já existe — nenhuma dependência nova.
 *
 * Se o banco falhar ao contar, a requisição PASSA (fail-open): bloquear
 * respondentes legítimos por um problema de infraestrutura seria pior do que
 * deixar de limitar por alguns instantes.
 */

/**
 * Conta uma requisição e diz se ela está dentro do limite.
 *
 * Um único `INSERT ... ON CONFLICT` faz leitura e escrita atômicas: duas
 * requisições simultâneas nunca leem o mesmo valor antigo.
 */
export async function consumeRateLimit(
  scope: string,
  identifier: string,
  policy: RateLimitPolicy,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const key = rateLimitKey(scope, identifier);
  const windowStart = windowStartFor(now, policy.windowMs);

  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limit_buckets (key, window_start, count)
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limit_buckets.window_start = EXCLUDED.window_start
          THEN rate_limit_buckets.count + 1
        ELSE 1
      END,
      window_start = EXCLUDED.window_start
    RETURNING count
  `;

  const count = Number(rows[0]?.count ?? 1);
  maybeCleanup(now);

  return {
    allowed: count <= policy.limit,
    remaining: Math.max(0, policy.limit - count),
    retryAfterSeconds: retryAfterSeconds(now, windowStart, policy.windowMs),
  };
}

/**
 * Limpeza ocasional de chaves inativas, sem job agendado: ~1% das chamadas
 * apaga contadores parados há mais de um dia. Não bloqueia a resposta.
 */
function maybeCleanup(now: Date): void {
  if (Math.random() >= 0.01) return;
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  prisma.rateLimitBucket
    .deleteMany({ where: { windowStart: { lt: cutoff } } })
    .catch(() => {
      // Limpeza é oportunista; a próxima tentativa resolve.
    });
}

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Muitas requisições");
    this.name = "RateLimitError";
  }
}

/**
 * Aplica o limite da superfície e lança `RateLimitError` se estourar.
 * `identifier` padrão é o IP; rotas autenticadas podem passar o id do usuário.
 */
export async function enforceRateLimit(
  request: Request,
  scope: RateLimitScope,
  identifier: string = clientIp(request.headers),
): Promise<void> {
  let result: RateLimitResult;
  try {
    result = await consumeRateLimit(scope, identifier, RATE_LIMITS[scope]);
  } catch (error) {
    // Fail-open (ver comentário do módulo). Loga só o escopo, nunca o IP.
    console.error(`[rate-limit] falha ao contar escopo=${scope}`, error instanceof Error ? error.name : "erro");
    return;
  }
  if (!result.allowed) throw new RateLimitError(result.retryAfterSeconds);
}
