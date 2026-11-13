# Briefing Inteligente — Auditoria de Confirmação (Fase 0 / EP-00)

> **Data:** 12/11/2026  
> **Base auditada:** branch `front`, commit `5f27745` + documentação v2.0 (`a2d8607`)  
> **Referências:** `docs/03-inspecao-e-arquitetura.md` §3.2, `docs/04-roadmap-melhorias.md` §4 e §16  
> **Status:** revisada. Decisões D1–D5 registradas em `docs/decisoes.md` (12/11/2026).

Classificação usada: `confirmado`, `corrigido`, `não reproduzido`, `parcial`, `substituído por decisão nova`.

---

## 1. Baseline

| Item | Resultado |
|---|---|
| Branches | Só existe `front` (local e `origin`). **Não há `main`.** |
| Estado local | Limpo antes da auditoria |
| Schema | 1 migração (`20260907161804_init`); modelos `User`, `Client`, `Briefing`, `Question`, `Answer`, `Signal`, `Diagnosis` |
| Modelo de dono | `Client.userId` → isolamento por usuário, sem organização nem projeto |
| `npm run lint` | ✅ passa |
| `npm run typecheck` | ✅ passa |
| `npm test` | ✅ 133 testes em 7 arquivos (só `src/core`) |
| `npm run test:db` | ✅ 12 testes em 1 arquivo (`src/server/briefing.itest.ts`) |
| `npm run build` | ✅ passa (Next 16.4.6, Turbopack) |
| CI | ❌ inexistente (sem `.github/`) |
| Deploy | Nenhuma configuração de deploy no repositório; o ambiente real não pode ser verificado daqui |

Pontos fortes registrados na inspeção anterior (§3.1) foram **confirmados**: `src/core` puro, visibilidade por dados, registro de sinais, estado cinza, `sourceAnswerIds`, token de 24 caracteres (~124 bits), `processAndPersist` transacional e idempotente.

---

## 2. Achados históricos

| ID | Classificação | Evidência | Prioridade proposta |
|---|---|---|---|
| **SEC-01** | **confirmado** | `src/server/auth.ts` `getSessionUser`: qualquer conta autenticada no Supabase vira `User` na primeira visita (`prisma.user.create`). Se o signup do Supabase estiver ligado (padrão do Supabase, não verificável pelo repo), qualquer pessoa obtém um painel. O isolamento por `userId` impede ver clientes alheios, mas o acesso em si não deveria existir. | **P0** |
| **SEC-02** | **confirmado** | `src/app/login/page.tsx:17` faz `redirect(redirectTo)` e `LoginForm.tsx:78` faz `router.push(redirectTo)` com o valor cru do query string. `/login?redirect=https://site-malicioso` funciona como open redirect. | P1 |
| **SEC-03** | **parcial** | Não há verificação de `Origin` nas mutações. Mitigação existente: cookies do Supabase são `SameSite=Lax` (`@supabase/ssr`), que bloqueiam POST/PATCH/DELETE cross-site. Resta: subdomínios same-site e o `GET /api/briefings/[id]/pdf`, que é caro (abre um Chromium) e aceita navegação top-level cross-site. | P1 |
| **SEC-04** | **confirmado** | Nenhum rate limiting em `/api/public/**` nem no PDF. | P1 |
| **SEC-05** | **confirmado** | Sem `robots`, `noindex` ou `Referrer-Policy` explícita. O token está na URL `/briefing/<token>`; a política padrão dos navegadores já não vaza o caminho cross-origin, mas isso deve ser explícito. | P1 |
| **SEC-06** | **confirmado** | `next.config.ts` não define `headers()`; sem CSP, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`. | P1 |
| **DATA-01** | **confirmado** | `submitBriefing` (`src/server/briefing.ts`): valida → `update` de status → `processAndPersist` em **três passos fora de uma transação única**. (a) se o diagnóstico falhar, o briefing fica fechado sem diagnóstico; (b) `saveAnswers` não checa de novo o status dentro da transação, então um autosave concorrente pode alterar respostas depois do cálculo; (c) dois envios simultâneos passam pela checagem e disputam a unique `(briefingId, code)` de `Signal`, e um deles devolve 500. | **P0** |
| **DATA-02** | **confirmado** | `Question` é catálogo global sem versão; editar uma pergunta muda briefings antigos. Entrega estrutural na Fase 2 (EP-07). Mitigação até lá: não editar o catálogo em produção, só adicionar. | P0 (mitigar na Fase 0, resolver na Fase 2) |
| **DATA-03** | **confirmado** | `saveAnswersSchema` só valida "string ou array de strings". Não confere tipo × `answerType` nem valor × `options`. Um `business_type` inválido chega ao `prisma.briefing.update` como enum desconhecido → **500**. | P1 |
| **DATA-04** | **confirmado** | `missingRequiredKeys` das categorias cinzas é recalculado na leitura (`briefingDetail.ts:197`) contra o catálogo **atual**; não é persistido. | P1 (Fase 2, junto com DATA-02) |
| **DATA-05** | **confirmado** | Não há revogação, regeneração, reabertura nem aprovação. Os status `draft`, `submitted` e `approved` existem no enum, mas nenhum fluxo os usa. | P1 (Fase 2, EP-09; BRF-04 é Must) |
| **DATA-06** | **confirmado** (baixo impacto) | `loadBriefingDetail` lê `signals` e `diagnoses` sem `orderBy`; o sumário ordena por pontuação e, no empate, herda a ordem do banco. A ordem das perguntas é determinística (`order` global no seed). | P2 |
| **PERF-01** | **confirmado** | O `matcher` do `src/proxy.ts` inclui `/briefing/*` e `/api/public/*`; com Supabase configurado, cada autosave público faz uma chamada `auth.getUser()` à toa. | P1 |
| **QUAL-04** | **confirmado** | Não há testes de API, de componentes nem E2E. O único teste de acesso cruzado é "não devolve briefing de outra conta". | P2 → parte do DoD de cada correção |
| **QUAL-05** | **confirmado** | Sem pipeline de CI. | P1 (a Fase 0 exige "CI bloqueia regressões") |
| **QUAL-06** | **confirmado** | Só `console.error("[api]", error)`; sem logs estruturados, request ID ou health check. | P2 |
| **LGPD-01** | **confirmado** | A única exclusão é o hard delete em cascata do cliente (`DELETE /api/clients/[id]`); não há exportação, retenção nem anonimização. | P1 (transversal; depende de PD-12) |
| **DEPLOY-01** | **confirmado** (código) | `src/server/pdf.ts` usa o Chromium completo do Playwright; o próprio arquivo registra que isso não roda em função serverless da Vercel. O ambiente de deploy real não está definido no repositório. | P1, depende da decisão D1 |

---

## 3. Achados novos

| ID | Achado | Evidência | Prioridade proposta |
|---|---|---|---|
| NEW-01 | JSON malformado no corpo devolve **500** em vez de 400 | `parseBody` lança `SyntaxError`, e `handle()` só traduz `UnauthorizedError` e `ZodError` | P1 |
| NEW-02 | Payload público inclui o `id` interno do briefing | `GET /api/public/briefing/[token]` devolve `briefing.id` (FORM-14: só o necessário) | P3 |
| NEW-03 | Link de briefing pode sair relativo/quebrado sem aviso | `POST /api/briefings` usa `NEXT_PUBLIC_APP_URL ?? ""`; não há validação de env na inicialização | P1 (entra na validação de env) |
| NEW-04 | Excluir cliente apaga em cascata briefings, respostas e diagnósticos | `onDelete: Cascade` + `deleteMany`; conflita com "histórico preservado" (PRODUCT.md, princípio 8) | **Conflito com a v2**: depende de PD-12 |

---

## 4. Backlog proposto para a Fase 0

Só achados confirmados/parciais. Ordem por risco (roadmap §3.1).

### EP-01 — Segurança do MVP
1. **SEC-01**: parar de criar `User` automaticamente; só entra quem já existe na tabela `users` (criado por seed/ação administrativa). Conta desconhecida → sessão encerrada + mensagem clara. *Provisória até os convites da Fase 1.*
2. **SEC-02**: aceitar em `redirect` apenas caminhos internos (`/…`, nunca `//…` nem URL absoluta), validado no servidor e no cliente.
3. **SEC-05/06**: headers de segurança, `Referrer-Policy: no-referrer` no formulário público, `noindex` em `/admin`, `/briefing`, `/print`, `/login`, `robots.ts`.
4. **SEC-03**: checagem de `Origin` nas mutações autenticadas; PDF via POST ou com checagem equivalente.
5. **PERF-01**: excluir rotas públicas do `matcher` do proxy.
6. **SEC-04**: rate limiting nas rotas públicas e no PDF (depende da decisão D2).

### EP-02 — Integridade do briefing
7. **DATA-01**: envio atômico: transição condicional de status + diagnóstico na **mesma transação**, com lock da linha do briefing; `saveAnswers` rechecando o status dentro da transação; reenvio concorrente idempotente.
8. **DATA-03 / NEW-01**: validação semântica das respostas contra o catálogo (tipo, opções, `business_type`) → 400/422, nunca 500; JSON inválido → 400.
9. **DATA-06**: ordenação determinística de sinais e diagnósticos.

### EP-03 — Qualidade e operação mínima
10. **QUAL-05**: CI (GitHub Actions) com lint, typecheck, unit, integração com Postgres e build.
11. **NEW-03**: validação de variáveis de ambiente com falha explícita.
12. Logs sem token/PII (`handle()` hoje loga o erro inteiro, e erros do Prisma podem carregar valores).
13. Testes de API para as rotas existentes, incluindo os negativos (sem sessão, outro usuário, link expirado/enviado).
14. **DEPLOY-01**: documentar a limitação e decidir a estratégia de PDF (depende de D1).

**Fica para fases posteriores** (conforme roadmap): DATA-02/DATA-04 → Fase 2 (EP-07/08); DATA-05 → Fase 2 (EP-09); QUAL-06 → contínuo; LGPD-01 e NEW-04 → dependem de PD-12.

---

## 5. Decisões necessárias

### Para executar a Fase 0
| ID | Pergunta | Por que importa |
|---|---|---|
| D1 | Onde a aplicação vai rodar em produção (Vercel serverless, contêiner/VPS, outro)? | Define a estratégia de PDF (DEPLOY-01) e onde guardar o rate limit |
| D2 | Rate limit: tabela no Postgres (sem dependência nova) ou serviço externo (ex.: Upstash/Redis)? | Memória local não funciona com várias instâncias serverless |
| D3 | Confirma a política provisória do SEC-01 (só entra usuário pré-cadastrado até existirem convites)? | Fecha o P0 sem antecipar a Fase 1 |
| D4 | Até a PD-12 ser decidida, excluir cliente continua sendo hard delete ou passa a arquivar? | NEW-04 / histórico preservado |
| D5 | Criar uma branch `main` a partir da `front` para servir de base dos PRs? | Hoje não há branch principal |

### Para preparar a Fase 1 (roadmap §16, item 8)
- **PD-01**: matriz de permissões por função (admin, líder, integrante) × ação.
- **PD-02**: como combinar permissões de quem tem mais de uma função.
- **PD-13**: acesso a projeto por atribuição individual, por equipe ou ambos.
- Líderes podem convidar membros? (pendência de AUTH, `02-requisitos.md` §2.2)
- Política de migração dos dados atuais para a organização inicial.
