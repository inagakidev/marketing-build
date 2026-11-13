# Segurança e privacidade

Leia antes de: mexer em autenticação, rotas, payloads públicos, logs ou variáveis de ambiente. Vale em toda história, não numa fase.

- Validar toda entrada no servidor (tipo, opções, limites).
- Rotas autenticadas que alteram dados chamam `assertSameOrigin` (`src/server/security/origin.ts`); rotas públicas ou caras usam `enforceRateLimit`.
- Payload público contém só o necessário para responder; nada de notas internas, ids internos ou diagnóstico.
- Logs só via `logError` (`src/server/log.ts`): sem tokens, respostas livres, e-mails, telefones ou outra PII.
- Variáveis de ambiente lidas por `serverEnv()` (`src/server/env.ts`), nunca `process.env` direto em código de aplicação.
- Tokens de link são credenciais: opacos, expiráveis, revogáveis.
