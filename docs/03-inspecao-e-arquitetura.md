# Briefing Inteligente — Inspeção Técnica e Plano de Arquitetura

> **Versão:** 1.0  
> **Data:** 12/11/2026  
> **Base inspecionada:** repositório local, commit `4804a91` (estado inicial do Create Next App) + alterações não commitadas do MVP  
> **Escopo:** produto, segurança, integridade de dados, arquitetura, testes, operação e experiência

---

## 1. Sumário executivo

### Veredito

O projeto tem uma **base acima da média para um MVP**: o núcleo de regras é puro e testado, a ramificação é orientada a dados, o fluxo público funciona de ponta a ponta e há preocupação real com UX (autosave, estados de link, mobile-first). A arquitetura atual já separa corretamente `core`, `server` e `app`.

O produto, porém, **ainda não está pronto para operar com dados reais de clientes em produção**. Os bloqueadores não são de tela; são de **confiança**:

1. Qualquer conta Supabase pode, em tese, se tornar administradora (auto-provisionamento sem allowlist).
2. O envio do briefing não é atômico e não tem transição condicional de status.
3. O catálogo de perguntas é global e sem versionamento: uma alteração pode afetar briefings em andamento e diagnósticos históricos.
4. Respostas não são validadas contra o tipo/opções da pergunta.
5. Rotas públicas não têm rate limiting.
6. O ciclo de vida do link é incompleto (não revoga, não regenera, não reenvia).
7. Não há trilha de auditoria, retenção, exportação/exclusão LGPD nem observabilidade.

### Nota de maturidade

| Dimensão | Nota | Comentário |
|---|---:|---|
| Domínio e regras de negócio | 8/10 | Núcleo puro, boa modelagem, testes relevantes |
| Arquitetura de código | 7/10 | Boa separação; falta camada de aplicação/transação |
| Segurança | 4/10 | Allowlist, CSRF, rate limit, headers e `noindex` ausentes |
| Integridade de dados | 5/10 | Envio não atômico; catálogo sem versão; validação semântica fraca |
| Experiência do respondente | 8/10 | Autosave, etapas, ramificação e telas de erro bem cuidadas |
| Experiência da administradora | 6/10 | Painel bom; faltam aprovação, revogação, busca e histórico |
| Testes | 6/10 | Unitários fortes; sem API, componentes ou E2E; integração manual |
| Operação e observabilidade | 3/10 | Sem health check, logs estruturados, métricas, CI ou runbooks |
| Privacidade/LGPD | 3/10 | Sem consentimento, retenção, exportação, exclusão ou `noindex` |

### Esforço estimado para produção

- **1 a 2 dias:** correções críticas de baixo esforço (allowlist, redirect seguro, headers, `noindex`, validação de env, ordenação de diagnóstico).
- **1 a 2 semanas:** integridade (envio atômico, validação semântica, versionamento de catálogo, ciclo de vida do link).
- **2 a 3 semanas:** operação e qualidade (CI, observabilidade, testes de API/E2E, LGPD, PDF em produção).

---

## 2. O que já está bom

Registrar os acertos é importante para não desmontar o que funciona.

| Ponto forte | Evidência | Por que importa |
|---|---|---|
| Núcleo independente de infraestrutura | `src/core` não importa Next, Prisma ou Supabase | Testável sem banco; regras reutilizáveis |
| Ramificação por dados | `Question.visibilityRule` + `src/core/visibility.ts` | Adicionar tipo de negócio não exige alterar tela |
| Visibilidade determinística de passada única | `resolveVisibility` | Evita regras oscilantes e respostas fantasmas |
| Respostas invisíveis ignoradas | `withVisibleAnswersOnly` em `runSignals` e `processBriefing` | Trocar o tipo de negócio não contamina o diagnóstico |
| Motor de sinais por registro | `src/core/signals/registry.ts` | Nova regra é um arquivo + uma linha |
| Diagnóstico com cinza | `src/core/diagnosis/score.ts` | Diferencia ausência de dado de diagnóstico ruim |
| Rastreabilidade | `Signal.sourceAnswerIds` | Permite explicar de onde veio o sinal |
| Reprocessamento transacional | `processAndPersist` em `src/server/briefing.ts` | Idempotência real na recriação de sinais/diagnóstico |
| Token forte | `customAlphabet` com 24 caracteres | ~124 bits; não derivado de dados do cliente |
| Isolamento por dono | Filtros `userId` nas consultas administrativas | Multiusuário já nasce correto |
| Formulário público não expõe PII | `buildPublicForm` + `loadBriefingByToken` | Superfície pública mínima |
| UX de autosave | `useAutosave` | Debounce, retry, fila por pergunta, aviso de saída |
| Estados de link | `LinkProblem` + 404/410 | Cada erro tem mensagem e ação diferentes |
| PDF sem template duplicado | `src/app/print/briefing/[id]/page.tsx` + `src/server/pdf.ts` | Painel e PDF não divergem |
| Testes do domínio | 133 testes em 7 arquivos | Rede de proteção real para evoluir regras |
| Comentários de decisão | Vários arquivos | Explicam o “porquê”, não o “o quê” |

---

## 3. Arquitetura atual

### 3.1 Visão em camadas

```
┌──────────────────────────────────────────────────────────────┐
│ Interface (src/app)                                          │
│  Páginas RSC · Route Handlers · proxy.ts                     │
│  /admin · /briefing · /print · /login · /api/**              │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Componentes (src/components)                                 │
│  admin/* · briefing/* · ui/*                                 │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Servidor / adaptadores (src/server)                          │
│  auth · briefing · briefingDetail · publicForm · pdf · db     │
│  validação · supabase · api helpers                          │
└───────────────┬──────────────────────────────┬───────────────┘
                │                              │
┌───────────────▼──────────────┐  ┌────────────▼───────────────┐
│ Domínio puro (src/core)      │  │ Infraestrutura              │
│  visibility · signals        │  │  PostgreSQL (Prisma 7)      │
│  diagnosis · form · text     │  │  Supabase Auth              │
│  tipos e chaves              │  │  Playwright/Chromium        │
└──────────────────────────────┘  └────────────────────────────┘
```

### 3.2 Fluxos principais

**Formulário público (leitura)**
```
GET /briefing/[token]
  → loadBriefingByToken (status/prazo)
  → loadEvalContext (briefing + questions + answers)
  → buildPublicForm (visibilidade + etapas)
  → BriefingFlow (RSC entrega a primeira tela pronta)
```

**Autosave**
```
handleChange
  → pending[key] = value
  → debounce 600 ms
  → PUT /api/public/briefing/[token]/answers
  → saveAnswers (upsert por briefing+pergunta)
  → recarrega contexto e devolve form atualizado
```

**Envio**
```
POST /api/public/briefing/[token]/submit
  → loadBriefingByToken (404/410/já enviado)
  → submitBriefing
      → loadEvalContext
      → missingRequiredKeys
      → update status = ready_for_review
      → processAndPersist (transação: apaga sinais/diagnósticos, recria)
```

**Painel**
```
GET /admin/briefings/[id]
  → loadBriefingDetail
      → briefing + signals + diagnoses
      → loadEvalContext
      → visibleQuestions + questions + answers
      → reidrata diagnóstico gravado
      → buildSummary
  → Tabs: respostas · diagnóstico · brutas
```

### 3.3 Dependências entre módulos

| Módulo | Pode importar | Não pode importar |
|---|---|---|
| `src/core` | apenas `src/core` | Next, Prisma, Supabase, `src/server`, `src/app` |
| `src/server` | `src/core`, Prisma, Supabase, Playwright | componentes React |
| `src/components` | `src/core` (tipos), `src/server` (tipos) | Prisma diretamente |
| `src/app` | `src/server`, `src/components`, `src/core` | Prisma diretamente (exceto páginas que já fazem isso hoje) |

**Observação:** algumas páginas administrativas consultam Prisma diretamente (`src/app/admin/page.tsx`, `src/app/admin/clientes/[id]/page.tsx`, `src/app/admin/clientes/[id]/editar/page.tsx`). Isso não é um erro grave, mas quebra a regra de que toda persistência passa por `src/server`. Vale consolidar em funções de leitura.

---

## 4. Achados priorizados

### 4.1 Tabela mestra

Severidade: **P0** = bloqueia produção; **P1** = corrigir antes de operar com clientes reais; **P2** = importante, próximo ciclo; **P3** = melhoria contínua.  
Esforço: **P** = pequeno (até 1 dia), **M** = médio (2–5 dias), **G** = grande (> 1 semana).

| ID | Sev. | Área | Achado | Evidência | Esforço |
|---|---|---|---|---|---|
| SEC-01 | P0 | Auth | Conta Supabase não autorizada pode virar `User` local e ter seu próprio tenant | `src/server/auth.ts:49` | P |
| SEC-02 | P1 | Auth | Open redirect no parâmetro `redirect` do login | `src/app/login/page.tsx:17`, `src/components/admin/LoginForm.tsx:78` | P |
| SEC-03 | P1 | HTTP | Sem CSRF/origin check em mutações administrativas | rotas `POST/PATCH/DELETE` em `src/app/api/**` | P |
| SEC-04 | P1 | HTTP | Sem rate limiting nas rotas públicas (leitura, autosave, envio, PDF) | `src/app/api/public/**`, `src/app/api/briefings/[id]/pdf/route.ts` | M |
| SEC-05 | P1 | Privacidade | Páginas privadas sem `noindex`/`no-referrer`; token pode vazar por referrer | `src/app/layout.tsx`, `src/app/briefing/[token]/page.tsx` | P |
| SEC-06 | P1 | HTTP | Sem cabeçalhos de segurança/CSP | `next.config.ts` vazio | P |
| SEC-07 | P2 | Logs | `console.error` pode registrar erro com valores de query/PII | `src/server/api.ts` | P |
| DATA-01 | P0 | Integridade | Envio não é atômico; status muda antes de gerar diagnóstico; corrida com autosave | `src/server/briefing.ts:253-268` | M |
| DATA-02 | P0 | Integridade | Catálogo global sem versionamento; re-seed altera briefings em andamento/históricos | `prisma/seed/index.ts`, `src/server/briefing.ts:57` | G |
| DATA-03 | P1 | Integridade | Respostas validadas só por forma; `business_type` é convertido com cast | `src/server/validation.ts:33`, `src/server/briefing.ts:231` | M |
| DATA-04 | P1 | Integridade | Categoria cinza perde as perguntas faltantes no painel/PDF | `src/server/briefingDetail.ts:193` | P |
| DATA-05 | P1 | Produto | Estados `submitted` e `approved` não são usados; não há aprovação, revogação ou regeneração | `prisma/schema.prisma`, rotas de briefing | M |
| DATA-06 | P1 | Integridade | Ordem dos diagnósticos depende da ordem do banco | `src/server/briefingDetail.ts:186` | P |
| DATA-07 | P2 | Modelo | `sourceAnswerIds`/`signalIds` são arrays sem FK; viram referências órfãs | `prisma/schema.prisma` | M |
| DATA-08 | P2 | Modelo | `Signal (briefingId, code)` único impede mais de um sinal do mesmo tipo | `prisma/schema.prisma` | P |
| DATA-09 | P2 | Modelo | `Question.order` sem unicidade/ordenação determinística | `prisma/schema.prisma` | P |
| DATA-10 | P2 | Modelo | Exclusão de cliente é hard delete em cascata, sem soft delete/auditoria | `src/app/api/clients/[id]/route.ts` | M |
| PERF-01 | P1 | Performance | Proxy roda `getUser` do Supabase em toda requisição, inclusive públicas | `src/proxy.ts:48,66` | P |
| PERF-02 | P2 | Performance | Visibilidade recalculada várias vezes no mesmo processamento | `src/core/index.ts:91-96`, `src/core/signals/run.ts` | P |
| PERF-03 | P2 | Performance | Autosave faz upsert sequencial e recarrega catálogo a cada lote | `src/server/briefing.ts:191` | M |
| PERF-04 | P2 | Performance | Painel sem paginação/busca; lista carrega todos os clientes | `src/app/admin/page.tsx` | M |
| PROD-01 | P1 | Produto | Página inicial ainda é o template padrão do Next.js | `src/app/page.tsx:3` | P |
| PROD-02 | P1 | Produto | Link não pode ser revogado/regenerado/reenviado; não há e-mail | `src/components/admin/CreateBriefingButton.tsx` | M |
| PROD-03 | P2 | Produto | Filtro do painel olha só o briefing mais recente e aceita status arbitrário | `src/app/admin/page.tsx:16,49` | P |
| PROD-04 | P2 | Produto | Tela de revisão não resume respostas; “Revisar respostas” volta à última etapa | `src/components/briefing/BriefingFlow.tsx` | M |
| PROD-05 | P2 | Produto | Oportunidades só consideram categorias verdes; amarelas ficam de fora | `src/core/diagnosis/summary.ts:58` | P |
| PROD-06 | P2 | Motor | Heurísticas de texto (palavras-chave/Jaccard) têm falso positivo/negativo | `src/core/signals/keywords.ts`, `src/core/signals/rules/*` | M |
| PROD-07 | P2 | Motor | `regulated_profession_flag` só cobre `freelancer` | `src/core/signals/rules/regulatedProfessionFlag.ts:47` | P |
| QUAL-01 | P2 | Código | Helpers duplicados (`emptyToNull`, `isBlank`) e `cn` importado de formas diferentes | `src/app/api/clients/route.ts`, `src/app/api/clients/[id]/route.ts`, `src/components/admin/BrandMark.tsx` | P |
| QUAL-02 | P2 | Config | Sem validação de env; `BRIEFING_LINK_TTL_DAYS` inválido gera data inválida | `src/server/briefing.ts:136` | P |
| QUAL-03 | P2 | Config | `NEXT_PUBLIC_APP_URL` vazio gera link relativo e PDF apontando para localhost | `src/app/api/briefings/route.ts:21`, `src/server/pdf.ts:45` | P |
| QUAL-04 | P2 | Testes | Sem testes de rotas, componentes ou E2E; integração exige seed manual | `src/server/briefing.itest.ts` | M |
| QUAL-05 | P2 | CI | Sem pipeline de CI; `npm run build` não aplica migrations | `package.json` | M |
| QUAL-06 | P1 | Observabilidade | Sem logs estruturados, request id, métricas, health check ou error tracking | `src/server/api.ts` | M |
| QUAL-07 | P3 | Código | Rótulos como `Record<string, string>` permitem drift de enums | `src/lib/labels.ts` | P |
| QUAL-08 | P3 | Código | Rota de reprocessamento permite recalcular briefing não enviado | `src/app/api/briefings/[id]/reprocess/route.ts` | P |
| QUAL-09 | P3 | Código | `draft` e `submitted` são estados mortos no fluxo | `src/server/briefing.ts` | P |
| A11Y-01 | P2 | Acessibilidade | Label do grupo de rádio aponta para id inexistente; revisão não tem sumário | `src/components/briefing/QuestionField.tsx` | M |
| A11Y-02 | P3 | Acessibilidade | `beforeunload` não define `returnValue`; aviso pode não aparecer | `src/components/briefing/useAutosave.ts` | P |
| LGPD-01 | P1 | Privacidade | Sem consentimento, retenção, exportação, exclusão ou anonimização | projeto inteiro | G |
| DEPLOY-01 | P1 | Deploy | Playwright com Chromium completo não roda em função serverless da Vercel | `src/server/pdf.ts` | M |
| DEPLOY-02 | P2 | Deploy | Sem health check, runbook de restore ou checklist de release | projeto inteiro | M |
| MISC-01 | P3 | UX | Datas formatadas no fuso do servidor | `src/lib/labels.ts` | P |

---

## 5. Detalhamento dos achados críticos

### SEC-01 — Auto-provisionamento de administradora (P0)

**Evidência:** `src/server/auth.ts:40-52`

```ts
const existing = await prisma.user.findUnique({
  where: { supabaseAuthId: user.id },
  ...
});
if (existing) return existing;

return prisma.user.create({
  data: { supabaseAuthId: user.id, email: user.email, name },
});
```

**Problema:** qualquer pessoa que consiga uma sessão Supabase válida — inclusive criando conta pelo signup do projeto, se ele estiver habilitado — vira um `User` local com seu próprio tenant. O produto não tem allowlist, papel nem convite.

**Impacto:** isolamento entre tenants funciona, mas o acesso ao produto não é restrito. Em um cenário de signup aberto, qualquer pessoa cria uma conta e usa o painel. Mesmo com signup fechado, um usuário criado manualmente no Supabase vira administrador sem revisão.

**Correção recomendada:**
1. Desativar signup público no Supabase Auth.
2. Adicionar allowlist explícita (`ADMIN_EMAILS`) ou tabela `AllowedAdmin`.
3. Se o e-mail autenticado não estiver autorizado, retornar 401/403 sem criar `User`.
4. Adicionar teste de integração: conta não autorizada não cria registro local.

**Esforço:** P.

---

### SEC-02 — Open redirect no login (P1)

**Evidência:** `src/app/login/page.tsx:14-20` e `src/components/admin/LoginForm.tsx:78`

```ts
const { redirect: redirectTo } = await searchParams;
if (user) redirect(typeof redirectTo === "string" ? redirectTo : "/admin");
...
router.push(redirectTo);
```

**Problema:** `redirect` aceita qualquer string. Um link `/login?redirect=https://atacante.example` pode levar a pessoa a uma página externa após o login, inclusive com aparência de confiança.

**Correção recomendada:**
```ts
function safeRedirect(value: unknown): string {
  if (typeof value !== "string") return "/admin";
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value;
}
```
Usar a mesma função na página e no formulário.

**Esforço:** P.

---

### SEC-03 — CSRF em mutações administrativas (P1)

**Evidência:** rotas `POST`, `PATCH` e `DELETE` em `src/app/api/clients/**` e `src/app/api/briefings/**` confiam apenas no cookie de sessão.

**Problema:** dependendo da configuração de `SameSite` dos cookies do Supabase, um site externo pode disparar mutações autenticadas. Não há verificação de `Origin`/`Referer` nem token CSRF.

**Correção recomendada:**
- Validar `Origin`/`Referer` contra `APP_URL` em toda mutação.
- Ou adicionar token CSRF (double-submit cookie) para o painel.
- Garantir cookies `HttpOnly`, `Secure` e `SameSite=Lax` (ou `Strict` onde possível).
- Testar requisição cross-origin simulada.

**Esforço:** P.

---

### SEC-04 — Falta de rate limiting (P1)

**Evidência:** `src/app/api/public/briefing/[token]/**` e `src/app/api/briefings/[id]/pdf/route.ts` não têm limite de requisições.

**Problema:** o token tem entropia alta, então brute force é inviável, mas:
- autosave pode ser abusado para inflar escrita no banco;
- submit pode ser martelado;
- PDF abre um Chromium por requisição, custo alto e risco de esgotar recursos;
- GET público pode ser usado para scraping se um token vazar.

**Correção recomendada:**
- Rate limit por IP e por token (ex.: 60 req/min para leitura, 30/min para autosave, 5/min para submit, 3/min para PDF).
- Retornar `429` com `Retry-After`.
- Limitar tamanho de corpo (`413`) e número de respostas por lote (já há `max(100)`).
- Em produção, combinar com WAF/edge rate limit.

**Esforço:** M.

---

### SEC-05 — Páginas privadas indexáveis e vazamento por referrer (P1)

**Evidência:** `src/app/layout.tsx` define apenas título/descrição; `/briefing/[token]` e `/admin/**` não têm `robots`.

**Problema:** o token está na URL. Se a página for indexada, aparecer em histórico compartilhado ou enviar `Referer` a um recurso externo, o link pode vazar. O conteúdo contém respostas de negócio.

**Correção recomendada:**
- `metadata.robots = { index: false, follow: false }` em layouts de `/briefing`, `/admin` e `/print`.
- Header global `Referrer-Policy: no-referrer`.
- `X-Robots-Tag: noindex, nofollow` nas rotas.
- Não carregar recursos externos na página pública (ou usar `referrerpolicy="no-referrer"`).

**Esforço:** P.

---

### SEC-06 — Cabeçalhos de segurança ausentes (P1)

**Evidência:** `next.config.ts` está vazio.

**Correção recomendada:**
```ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // CSP: começar em Report-Only, com nonce/hash para os scripts do Next.
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```
CSP exige cuidado com scripts inline do Next; começar em `Content-Security-Policy-Report-Only` e evoluir.

**Esforço:** P.

---

### DATA-01 — Envio não atômico e sem transição condicional (P0)

**Evidência:** `src/server/briefing.ts:253-268`

```ts
const ctx = await loadEvalContext(briefingId);
const missing = missingRequiredKeys(ctx);
if (missing.length > 0) return { ok: false as const, missing };

await prisma.briefing.update({
  where: { id: briefingId },
  data: { status: "ready_for_review", submittedAt: new Date() },
});
const result = await processAndPersist(briefingId);
```

**Problemas:**
1. O status é fechado **antes** de gerar sinais/diagnóstico. Se `processAndPersist` falhar, o briefing fica “pronto para revisão” sem diagnóstico.
2. Não há verificação de status: um segundo submit (duplo clique, retry, corrida) reexecuta o fechamento e sobrescreve `submittedAt`.
3. Um autosave em voo pode gravar depois do fechamento, porque `saveAnswers` não verifica status.
4. O `loadBriefingByToken` verifica antes, mas a chamada de `submitBriefing` em si não é protegida — a janela de corrida existe.

**Correção recomendada:**
- Fazer tudo em uma transação (`prisma.$transaction`).
- Usar transição condicional (`updateMany` com `where: { status: { in: [...] } }`) e checar `count`.
- Dentro da transação, carregar respostas, validar, processar e persistir sinais/diagnóstico.
- Retornar `conflict` quando o briefing já estiver fechado.
- Em `saveAnswers`, incluir `where` de status no upsert ou checar status dentro da transação.

Esboço:
```ts
return prisma.$transaction(async (tx) => {
  const ctx = await loadEvalContextTx(tx, briefingId);
  const missing = missingRequiredKeys(ctx);
  if (missing.length > 0) return { ok: false as const, reason: "missing", missing };

  const { count } = await tx.briefing.updateMany({
    where: { id: briefingId, status: { in: ["awaiting_response", "in_progress"] } },
    data: { status: "ready_for_review", submittedAt: new Date() },
  });
  if (count === 0) return { ok: false as const, reason: "closed" };

  const result = processBriefing(ctx);
  await persistResultTx(tx, briefingId, result);
  return { ok: true as const, result };
});
```

**Esforço:** M.

---

### DATA-02 — Catálogo global sem versionamento (P0)

**Evidência:** `prisma/seed/index.ts` faz upsert por `key` e atualiza texto, opções, obrigatoriedade e `visibilityRule`; `src/server/briefing.ts:57` sempre carrega o catálogo atual.

**Problema:** o catálogo é uma tabela global. Se uma pergunta for renomeada, tiver opções alteradas ou deixar de ser obrigatória:
- briefings em andamento mudam de regra no meio do preenchimento;
- respostas antigas podem referenciar opções que não existem mais;
- o painel mostra o texto novo para uma resposta antiga;
- o diagnóstico histórico deixa de ser reproduzível;
- não é possível saber com qual versão de regras um diagnóstico foi gerado.

**Correção recomendada (duas opções):**

**Opção A — Versionamento leve (recomendada):**
- `QuestionVersion` com `questionKey`, `version`, `text`, `options`, `required`, `visibilityRule`, `createdAt`.
- `Briefing.catalogVersion` no momento da criação.
- `Diagnosis.rulesVersion` e `Diagnosis.catalogVersion`.
- Leitura histórica usa a versão gravada.

**Opção B — Snapshot por briefing:**
- Criar `BriefingQuestion` no momento da criação do briefing, copiando texto/opções/regras.
- Mais simples de raciocinar, mais armazenamento e mais difícil de evoluir.

Também é necessário versionar as **regras de sinal**: exportar `RULES_VERSION` de `src/core/signals/registry.ts` e gravar em `Diagnosis`.

**Esforço:** G.

---

### DATA-03 — Validação semântica insuficiente (P1)

**Evidência:** `src/server/validation.ts:33-40` valida apenas forma; `src/server/briefing.ts:231` faz cast:

```ts
data.businessType = isBlankValue(branch.value)
  ? null
  : (String(branch.value) as BusinessType);
```

**Problemas:**
- `single_choice` aceita qualquer string, mesmo fora das opções.
- `multi_choice` aceita qualquer array de strings, inclusive vazio ou com opções inexistentes.
- `short_text` aceita array e vice-versa.
- `business_type` inválido gera erro de enum no banco e um 500 em vez de 400.
- Respostas podem chegar a perguntas invisíveis ou não existentes (estas últimas já são bloqueadas por `saveAnswers`).

**Correção recomendada:**
- Função pura `validateAnswer(question, value): AnswerValidationIssue[]` em `src/core`.
- `single_choice`: valor deve ser uma das opções.
- `multi_choice`: array de valores válidos, sem duplicatas, respeitando limite.
- `short_text`/`long_text`: string, com limites por pergunta.
- `business_type`: validar contra o enum antes de gravar.
- Validar se a pergunta está visível no momento do save (ou pelo menos se pertence ao catálogo).
- Retornar 400/422 com issues por chave.

**Esforço:** M.

---

### DATA-04 — Cinza sem explicação persistida (P1)

**Evidência:** `src/server/briefingDetail.ts:186-194`

```ts
const diagnoses = briefing.diagnoses.map((d) => ({
  ...
  missingRequiredKeys: [] as string[],
  ...
}));
```

O motor calcula `missingRequiredKeys` em `src/core/diagnosis/score.ts:63-71`, mas o schema `Diagnosis` não tem coluna para isso. Ao reidratar do banco, o painel sempre mostra lista vazia.

**Impacto:** a administradora vê uma categoria cinza sem saber o que faltou. O produto perde uma das suas melhores explicações.

**Correção recomendada:**
- Adicionar `missingRequiredKeys String[]` em `Diagnosis` (ou JSON com chaves/labels).
- Persistir no `processAndPersist`.
- Exibir no `DiagnosisPanel` e no PDF.
- Testar o round-trip banco → painel.

**Esforço:** P.

---

### DATA-05 — Ciclo de vida incompleto (P1)

**Evidência:** `prisma/schema.prisma` tem `submitted` e `approved`, mas o fluxo só usa `awaiting_response`, `in_progress` e `ready_for_review`. Não há rota nem UI para aprovar, revogar, regenerar ou reenviar.

**Impacto:** o produto não fecha o ciclo operacional. A administradora não consegue:
- aprovar formalmente um briefing;
- invalidar um link enviado por engano;
- gerar novo link quando o cliente perde o antigo;
- registrar reenvio;
- excluir/arquivar um briefing específico.

**Correção recomendada:**
- Implementar máquina de estados explícita.
- Rotas:
  - `POST /api/briefings/[id]/approve`
  - `POST /api/briefings/[id]/revoke`
  - `POST /api/briefings/[id]/regenerate-token`
  - `POST /api/briefings/[id]/resend` (quando houver e-mail)
  - `DELETE /api/briefings/[id]`
- Campos: `approvedAt`, `approvedBy`, `revokedAt`, `lastSentAt`.
- UI com confirmação e feedback.
- Testes de transição inválida.

**Esforço:** M.

---

### DATA-06 — Ordem dos diagnósticos não determinística (P1)

**Evidência:** `src/server/briefingDetail.ts:186` faz `briefing.diagnoses.map(...)` sem `orderBy`.

**Impacto:** a ordem das 5 categorias no painel e no PDF pode variar entre consultas. Isso não quebra o cálculo, mas quebra a leitura e a comparação.

**Correção recomendada:**
- Ordenar por `DIAGNOSIS_CATEGORIES` em `loadBriefingDetail`.
- Ou `orderBy: { category: "asc" }` no Prisma (ordem alfabética não é a ordem de produto; melhor mapear explicitamente).

**Esforço:** P.

---

### PERF-01 — Proxy em todas as rotas (P1)

**Evidência:** `src/proxy.ts:66-68` — matcher exclui apenas estáticos e imagens. Portanto roda em `/briefing/[token]`, `/api/public/**` e `/print/**`.

Em cada execução: `supabase.auth.getUser()` (chamada de rede ao Supabase).

**Impacto:** latência adicional em toda abertura de formulário público, custo de auth desnecessário e dependência do Supabase no caminho crítico do respondente.

**Correção recomendada:**
- Restringir o matcher a `/admin/:path*`, `/login` e rotas administrativas de API.
- Manter a autorização em cada rota/página (já existe) como defesa em profundidade.
- Se precisar renovar sessão em outras rotas, fazer só quando houver cookie de auth.

**Esforço:** P.

---

### DEPLOY-01 — PDF em serverless (P1)

**Evidência:** `src/server/pdf.ts` usa `playwright` com Chromium completo e já documenta que não roda na Vercel serverless.

**Impacto:** a exportação de PDF é uma funcionalidade central e pode falhar no ambiente de produção.

**Correção recomendada:**
- Trocar o adaptador por `puppeteer-core` + `@sparticuz/chromium-min`, mantendo `renderBriefingPdf` como único ponto de mudança.
- Ou mover a geração para um worker/fila (QStash, Inngest, BullMQ) e entregar por URL assinada.
- Adicionar timeout, retry e fallback de erro claro.
- Testar em preview da Vercel.

**Esforço:** M.

---

### PROD-01 — Página inicial padrão do Next.js (P1)

**Evidência:** `src/app/page.tsx:3` ainda é o template “To get started, edit the page.tsx file”.

**Impacto:** a raiz do produto parece inacabada; visitante não entende o que é nem para onde ir.

**Correção recomendada:**
- Redirecionar `/` para `/admin` (se sessão) ou `/login`.
- Ou criar uma landing mínima com proposta de valor e CTA.
- Adicionar `noindex` se for apenas redirecionamento.

**Esforço:** P.

---

### LGPD-01 — Ausência de ciclo de vida de dados pessoais (P1)

**Evidência:** o produto coleta nome, e-mail, telefone, notas internas e respostas livres (que podem conter dados sensíveis), sem aviso, consentimento, retenção, exportação ou exclusão.

**Impacto:** risco jurídico e reputacional; impossibilidade de atender titulares.

**Correção recomendada:**
- Aviso de privacidade no formulário público.
- Registrar consentimento (data/hora/versão do aviso).
- Definir retenção por tipo de dado e automatizar expiração/anonimização.
- Endpoint/rotina de exportação e exclusão por cliente/titular.
- Documentar suboperadores (Supabase, Vercel).
- Redigir política de privacidade e termos de uso.

**Esforço:** G.

---

## 6. Arquitetura-alvo

### 6.1 Princípios

1. **Domínio puro e explícito.** Regras de negócio em `src/core`, sem I/O.
2. **Casos de uso transacionais.** Toda operação que muda estado passa por um caso de uso com transação e invariantes.
3. **Adaptadores isolados.** Prisma, Supabase, Playwright, e-mail e rate limit ficam atrás de interfaces.
4. **Bordas finas.** Rotas apenas validam entrada, autenticam, chamam caso de uso e formatam resposta.
5. **Configuração validada.** Nenhum módulo lê `process.env` cru; tudo passa por `config`.
6. **Observabilidade por padrão.** Request id, logs estruturados, métricas e erros rastreáveis.
7. **Segurança em profundidade.** Proxy + rota + caso de uso + banco.

### 6.2 Estrutura de pastas proposta

```
src/
├─ app/                         # interface Next (páginas + rotas)
│  ├─ (public)/briefing/[token]/
│  ├─ (admin)/admin/**
│  ├─ print/**
│  └─ api/**
├─ components/
│  ├─ admin/
│  ├─ briefing/
│  └─ ui/
├─ core/                        # domínio puro
│  ├─ briefing/
│  │  ├─ visibility.ts
│  │  ├─ form.ts
│  │  └─ answerValidation.ts    # NOVO
│  ├─ signals/
│  │  ├─ registry.ts
│  │  ├─ rules/
│  │  └─ version.ts             # NOVO: RULES_VERSION
│  ├─ diagnosis/
│  ├─ catalog/
│  │  └─ version.ts             # NOVO
│  └─ types.ts
├─ application/                 # NOVO: casos de uso
│  ├─ submitBriefing.ts
│  ├─ saveAnswers.ts
│  ├─ createBriefing.ts
│  ├─ reprocessBriefing.ts
│  ├─ approveBriefing.ts
│  └─ revokeBriefing.ts
├─ infrastructure/              # NOVO: adaptadores
│  ├─ db/
│  │  ├─ client.ts
│  │  └─ repositories/
│  ├─ auth/
│  ├─ pdf/
│  ├─ rateLimit/
│  └─ email/
├─ server/                      # helpers de borda atuais (migrar aos poucos)
└─ lib/
   ├─ config.ts                 # NOVO: schema de env
   ├─ logger.ts                 # NOVO
   └─ errors.ts                 # NOVO: taxonomia
```

A migração pode ser incremental: criar `application/` e mover `submitBriefing`, `saveAnswers`, `processAndPersist` primeiro; o restante pode continuar em `server/` até ser tocado.

### 6.3 Casos de uso e invariantes

| Caso de uso | Invariantes |
|---|---|
| `createBriefing` | Cliente pertence ao usuário; token único; TTL válido; status inicial `awaiting_response`. |
| `saveAnswers` | Briefing aberto e não expirado; perguntas existem e estão visíveis; valores válidos para o tipo; branco apaga; `businessType` sincronizado. |
| `submitBriefing` | Apenas de status aberto; obrigatórias visíveis respondidas; transição atômica; diagnóstico persistido na mesma transação. |
| `reprocessBriefing` | Briefing pertence ao usuário; status `ready_for_review` ou `approved`; idempotente; grava versão de regras. |
| `approveBriefing` | Briefing `ready_for_review`; grava `approvedAt`/`approvedBy`; não altera respostas. |
| `revokeBriefing` | Briefing aberto; grava `revokedAt`; autosave/submit passam a falhar. |

### 6.4 Máquina de estados explícita

```
draft ──► awaiting_response ──► in_progress ──► ready_for_review ──► approved
                │                    │                  │
                └──── revoke ────────┴───── revoke ─────┘
                                     │
                                  expire
```

Regras:
- `submit` só de `awaiting_response`/`in_progress`.
- `approve` só de `ready_for_review`.
- `revoke` de qualquer estado aberto.
- `expire` é derivado de `expiresAt`, não um status persistido (ou job diário).
- `submitted` pode ser removido ou usado como alias de `ready_for_review`; hoje é estado morto.

### 6.5 Mudanças de modelo recomendadas

```prisma
model Briefing {
  // ...
  catalogVersion Int      @default(1)
  rulesVersion   String?
  revokedAt      DateTime?
  approvedAt     DateTime?
  approvedById   String?
  lastActivityAt DateTime?
  lastSentAt     DateTime?
}

model Diagnosis {
  // ...
  missingRequiredKeys String[]
  rulesVersion        String?
  catalogVersion      Int?
  processedAt         DateTime @default(now())
}

model QuestionVersion {
  id             String   @id @default(cuid())
  questionKey    String
  version        Int
  text           String
  options        Json?
  required       Boolean
  visibilityRule Json?
  createdAt      DateTime @default(now())

  @@unique([questionKey, version])
  @@index([questionKey])
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String
  entityType String
  entityId   String
  metadata   Json?
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId, createdAt])
}

model AccessLog {
  id         String   @id @default(cuid())
  briefingId String
  kind       String   // open | autosave | submit | pdf
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([briefingId, createdAt])
}
```

Também vale considerar:
- `Client.deletedAt` (soft delete) em vez de cascata imediata.
- `Answer.updatedAt` já existe; usar para detectar edição após envio.
- `Signal` sem unique por código, se uma regra puder emitir mais de um sinal; ou manter e documentar.
- Substituir `String[]` de IDs por tabelas de junção (`SignalSourceAnswer`, `DiagnosisSignal`) se a integridade referencial for prioridade.

### 6.6 Validação de configuração

```ts
// src/lib/config.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().url(),
  APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  BRIEFING_LINK_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  ADMIN_EMAILS: z.string().optional(),
});

export const config = envSchema.parse(process.env);
```

Benefícios: falha rápida, tipos corretos, fim do `Number(process.env.X ?? 30)` espalhado.

### 6.7 Taxonomia de erros

```ts
export class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

// Exemplos
throw new AppError("BRIEFING_CLOSED", 409, "Este briefing já foi enviado.");
throw new AppError("ANSWER_INVALID", 422, "Resposta inválida.", { issues });
throw new AppError("RATE_LIMITED", 429, "Tente novamente em instantes.");
```

O `handle` atual já centraliza erros; evoluir para mapear `AppError` e manter `ZodError`/`UnauthorizedError`.

### 6.8 Borda de API padronizada

Criar um wrapper para rotas administrativas e públicas:

```ts
export const adminRoute = (handler: AdminHandler) =>
  handle(async (req, ctx) => {
    const user = await requireUser();
    assertSameOrigin(req);
    await rateLimit(req, "admin");
    return handler({ req, ctx, user });
  });
```

Isso elimina repetição de `requireUser` + `handle` + validação em cada rota.

### 6.9 Observabilidade

- **Logs:** `pino` com `requestId`, `userId`, `briefingId` e redaction de PII.
- **Erros:** Sentry (ou equivalente) no servidor e no cliente.
- **Métricas:** contadores de briefings criados/enviados/reprocessados, latência de autosave, falhas de PDF, 401/429.
- **Health check:** `/api/health` verifica processo e conexão com o banco (sem expor segredo).
- **Alertas:** taxa de erro 5xx, p95 de autosave, falhas de PDF, tentativas de auth não autorizadas.

### 6.10 Testes

| Camada | Ferramenta | Cobertura mínima |
|---|---|---|
| Domínio | Vitest | 80% de `src/core` |
| Integração | Vitest + Postgres efêmero | Casos de uso e repositórios |
| API | Vitest + route handlers | 401, 403, 404, 409, 410, 422, 429 |
| Componentes | Testing Library | Formulário, autosave, validação |
| E2E | Playwright | Fluxo completo admin + respondente + PDF |
| Segurança | `npm audit`, secret scanning | Sem vulnerabilidade alta/crítica |

Pipeline sugerido:

```
lint → typecheck → unit → integration (Postgres service)
     → build → e2e (preview) → deploy
```

### 6.11 Deploy e operação

- **Vercel + Supabase** para aplicação e banco.
- **Migrações:** `prisma migrate deploy` no job de release, nunca no runtime.
- **PDF:** Chromium compatível ou worker dedicado; monitorar duração e falhas.
- **Backup:** PITR do Supabase ou dump diário; testar restore trimestralmente.
- **Runbooks:** revogar link, reprocessar em massa, restaurar banco, incidente de vazamento, rotação de chaves.
- **Feature flags** para rollout de novas regras e do catálogo versionado.

---

## 7. Plano de ação priorizado

### Fase 0 — Correções rápidas (1–2 dias)

| Tarefa | Achados | Critério de conclusão |
|---|---|---|
| Allowlist de administradores + desativar signup | SEC-01 | Conta não autorizada não acessa e não cria `User` |
| Redirect seguro no login | SEC-02 | `redirect` externo cai em `/admin` |
| Cabeçalhos de segurança e `noindex`/`no-referrer` | SEC-05, SEC-06 | Headers presentes em resposta; páginas privadas não indexáveis |
| Validação de env no start | QUAL-02, QUAL-03 | App falha com mensagem clara se env inválido |
| Ordenação determinística do diagnóstico | DATA-06 | Painel e PDF sempre na mesma ordem |
| Página inicial redireciona para login/painel | PROD-01 | `/` não mostra template do Next |
| Restringir proxy às rotas admin | PERF-01 | Formulário público não chama Supabase Auth |
| Persistir `missingRequiredKeys` | DATA-04 | Categoria cinza mostra o que faltou |

### Fase 1 — Integridade e segurança (1–2 semanas)

| Tarefa | Achados | Critério de conclusão |
|---|---|---|
| Envio atômico com transição condicional | DATA-01 | Concorrência testada; sem briefing fechado sem diagnóstico |
| Validação semântica de respostas | DATA-03 | `single_choice`/`multi_choice`/`business_type` validados |
| Rate limiting nas rotas públicas e PDF | SEC-04 | 429 com `Retry-After`; testes de limite |
| CSRF/origin check | SEC-03 | Mutação cross-origin rejeitada |
| Ciclo de vida do link | DATA-05, PROD-02 | Revogar, regenerar e reenviar funcionam |
| Versionamento de catálogo e regras | DATA-02 | Briefing histórico reproduzível |
| Testes de API e E2E iniciais | QUAL-04 | 401/404/410/422/429 e fluxo completo cobertos |
| CI com lint/typecheck/test/integration | QUAL-05 | Pipeline bloqueia merge quebrado |

### Fase 2 — Produto e operação (1–2 semanas)

| Tarefa | Achados | Critério de conclusão |
|---|---|---|
| Aprovação e histórico de ações | DATA-05, PROD-03 | Status `approved` e audit log funcionando |
| Observabilidade (logs, métricas, health, Sentry) | QUAL-06 | Dashboard e alertas ativos |
| LGPD: consentimento, retenção, exportação, exclusão | LGPD-01 | Fluxo documentado e testado |
| PDF em produção | DEPLOY-01 | PDF funciona em preview e produção |
| Busca/paginação e filtros corretos | PERF-04, PROD-03 | Volume de teste suportado |
| Acessibilidade e revisão do formulário | A11Y-01, PROD-04 | Teste com teclado e leitor de tela; resumo de revisão |
| Consolidação de helpers e tipos | QUAL-01, QUAL-07 | Sem duplicação; labels tipados |

### Fase 3 — Escala (contínuo)

- Multiusuário com papéis e convites.
- Catálogo gerenciável por interface.
- E-mail transacional.
- Analytics de funil e benchmarking.
- Assistente opcional de IA com revisão humana.
- Testes de carga e chaos engineering leve.

---

## 8. Checklist de go-live

### Segurança
- [ ] Signup público do Supabase desativado.
- [ ] Allowlist de administradores implementada.
- [ ] CSRF/origin check em mutações.
- [ ] Rate limit em rotas públicas e PDF.
- [ ] Cabeçalhos de segurança e CSP.
- [ ] `noindex`/`no-referrer` em páginas privadas.
- [ ] Segredos fora do bundle e do repositório.
- [ ] `npm audit` sem alta/crítica.

### Dados
- [ ] Envio atômico e transição condicional.
- [ ] Validação semântica de respostas.
- [ ] Catálogo/regras versionados.
- [ ] `missingRequiredKeys` persistido.
- [ ] Ordem determinística do diagnóstico.
- [ ] Backups e restore testados.
- [ ] Migrações aplicadas por pipeline.

### Produto
- [ ] Página inicial do produto.
- [ ] Revogar/regenerar/reenviar link.
- [ ] Aprovação e histórico.
- [ ] Busca/paginação.
- [ ] Revisão do formulário com resumo.

### Qualidade
- [ ] lint, typecheck, unit, integration e E2E no CI.
- [ ] Cobertura do core ≥ 80%.
- [ ] Testes de API para erros principais.
- [ ] Teste manual em mobile e desktop.

### Operação
- [ ] Health check.
- [ ] Logs estruturados sem PII.
- [ ] Error tracking.
- [ ] Métricas e alertas.
- [ ] Runbooks de incidente, restore e revogação.
- [ ] PDF validado no ambiente de produção.

### Privacidade
- [ ] Aviso de privacidade no formulário.
- [ ] Consentimento registrado.
- [ ] Retenção definida e implementada.
- [ ] Exportação e exclusão disponíveis.
- [ ] Suboperadores documentados.

---

## 9. Apêndice — Verificação do estado atual

Executado em 12/11/2026:

| Comando | Resultado |
|---|---|
| `npm run lint` | Passou sem erros |
| `npm run typecheck` | Passou sem erros |
| `npm test` | 7 arquivos, 133 testes passando |
| `npm run test:db` | Não executado nesta inspeção; exige `docker compose up -d` e `npm run db:seed` |
| `npm run build` | Não executado nesta inspeção |

Comandos recomendados antes de qualquer release:

```bash
npm run db:up
npm run db:migrate
npm run db:seed
npm run db:seed:admin
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
```

### Mapa de arquivos-chave

| Caminho | Responsabilidade |
|---|---|
| `src/core/visibility.ts` | Visibilidade condicional |
| `src/core/form.ts` | Montagem das etapas |
| `src/core/signals/*` | Regras e execução de sinais |
| `src/core/diagnosis/score.ts` | Pontuação e status |
| `src/core/diagnosis/summary.ts` | Problemas e oportunidades |
| `src/server/briefing.ts` | Persistência e casos de uso atuais |
| `src/server/briefingDetail.ts` | Leitura do painel/PDF |
| `src/server/publicForm.ts` | Payload do formulário público |
| `src/server/auth.ts` | Sessão e provisionamento |
| `src/server/api.ts` | Helpers de resposta/erro |
| `src/proxy.ts` | Proteção de rotas e renovação de sessão |
| `src/app/api/public/**` | Superfície pública |
| `src/app/admin/**` | Painel |
| `src/app/print/**` | Fonte do PDF |
| `prisma/schema.prisma` | Modelo de dados |
| `prisma/seed/**` | Catálogo de perguntas |
