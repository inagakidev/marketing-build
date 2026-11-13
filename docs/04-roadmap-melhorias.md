# Briefing Inteligente — Roadmap de Melhorias

> **Versão:** 1.0  
> **Data:** 12/11/2026  
> **Status:** plano de evolução do MVP para produto operável  
> **Base:** `docs/01-produto.md`, `docs/02-requisitos.md`, `docs/03-inspecao-e-arquitetura.md` e código atual

---

## 1. Resumo executivo

O Briefing Inteligente já tem o mais difícil: um domínio claro, um motor determinístico testável, um fluxo público completo e uma base visual consistente. O que falta não é “mais tela”; é **confiança operacional** e **identidade de produto**.

Este roadmap parte de três decisões:

1. **Não trocar a stack.** Next.js full-stack, PostgreSQL, Prisma, Supabase Auth e o núcleo puro em `src/core` continuam sendo a escolha certa para o estágio atual.
2. **Evoluir para um monólito modular.** Criar casos de uso e adaptadores sem transformar o projeto em microserviços, GraphQL ou event sourcing.
3. **Colocar design no mesmo nível de arquitetura.** O produto lida com confiança, ansiedade e percepção de julgamento; a experiência visual e a escrita são parte da solução, não acabamento.

### Horizontes

| Horizonte | Objetivo | Resultado esperado |
|---|---|---|
| **30 dias** | Pode operar com dados reais | P0/P1 resolvidos, CI ativo, env validado, headers, allowlist, envio atômico |
| **90 dias** | Operação confiável e ciclo completo | Ciclo de vida do link, LGPD básica, observabilidade, PDF em produção, design system documentado |
| **6 meses** | Produto com identidade e escala inicial | Landing, painel maduro, papéis, catálogo gerenciável, analytics, acessibilidade AA |

### Estratégia

```
Confiabilidade → Integridade → Operação → Experiência → Escala
```

Não inverter essa ordem. Um produto bonito que perde resposta, fecha briefing sem diagnóstico ou deixa qualquer conta entrar no painel não é um produto pronto.

---

## 2. North star e princípios

### Métrica norteadora

**Briefings concluídos e revisados por semana, com diagnóstico considerado útil pela administradora.**

Ela combina aquisição de link, conclusão pelo respondente, leitura do painel e valor percebido. Métricas de tela sem essa métrica são vaidade.

### Princípios

1. **Confiabilidade antes de features.** Nenhuma funcionalidade nova enquanto houver risco de perda de dados ou acesso indevido.
2. **Segurança em profundidade.** Proxy, rota, caso de uso e banco; nunca uma única barreira.
3. **Determinismo e auditabilidade.** O diagnóstico continua reproduzível, versionado e explicável.
4. **Simplicidade arquitetural.** Monólito modular, transações explícitas, adaptadores apenas onde há troca real de tecnologia.
5. **Design system como código.** Tokens, componentes e estados vivem no repositório, não só no Figma.
6. **Mobile-first e acessível.** O respondente frequentemente abre o link no celular, com pressa e sem contexto técnico.
7. **Privacidade por padrão.** Coletar o mínimo, explicar o uso, permitir exclusão e não expor PII em rota pública.
8. **Evidência antes de opinião.** Decisões de produto e design guiadas por testes, analytics e conversas com usuários.

---

## 3. Onde estamos

### Maturidade atual

| Dimensão | Nota | Leitura |
|---|---:|---|
| Domínio e regras | 8/10 | Núcleo puro, ramificação por dados, testes relevantes |
| Arquitetura de código | 7/10 | Boa separação; falta camada de aplicação e transações |
| Segurança | 5/10 | Base boa, mas allowlist, CSRF, rate limit e headers ainda pendentes |
| Integridade de dados | 5/10 | Envio não atômico, catálogo sem versão, validação semântica fraca |
| Experiência do respondente | 8/10 | Autosave, etapas, ramificação e estados de erro bem cuidados |
| Experiência da administradora | 6/10 | Painel funcional; falta ciclo de vida, busca, aprovação e histórico |
| Design system | 7/10 | Tokens e densidades existem; falta documentação, estados e governança |
| Testes | 6/10 | Unitários fortes; faltam API, componentes e E2E |
| Operação e observabilidade | 3/10 | Sem health check, logs estruturados, métricas, CI ou runbooks |
| Privacidade/LGPD | 3/10 | Sem consentimento, retenção, exportação, exclusão ou `noindex` |

### O que não vamos refazer

- O motor determinístico em `src/core`.
- A ramificação orientada a dados (`Question.visibilityRule`).
- O token opaco como credencial do respondente.
- O PDF gerado a partir da página de impressão.
- A stack Next.js + PostgreSQL + Prisma + Supabase.
- O sistema de tokens visuais e a identidade laranja/preto/off-white.

### Dívidas que bloqueiam a próxima fase

| Prioridade | Dívida | Efeito |
|---|---|---|
| P0 | Auto-provisionamento de administradora | Qualquer conta Supabase pode virar usuário local |
| P0 | Envio não atômico | Briefing pode fechar sem diagnóstico |
| P0 | Catálogo global sem versão | Briefing histórico deixa de ser reproduzível |
| P1 | Validação semântica fraca | Resposta inválida chega ao banco e quebra o motor |
| P1 | Ciclo de vida incompleto | Não revoga, regenera, reenvia nem aprova |
| P1 | Sem rate limit/CSRF/headers/`noindex` | Superfície pública e painel expostos |
| P1 | Sem observabilidade | Falhas invisíveis em produção |
| P1 | Sem LGPD básica | Risco jurídico para operar com clientes reais |
| P1 | Página inicial padrão do Next | Produto parece inacabado |
| P2 | Design system sem documentação | Componentes e estados divergem com o tempo |

---

## 4. Decisões de arquitetura

### ADR-01 — Manter um monólito modular

**Decisão:** continuar com um único projeto Next.js full-stack. Não criar API separada, microserviços ou GraphQL agora.

**Por quê:** o volume inicial é baixo, há uma única administradora e o domínio é bem delimitado. O custo de distribuir autenticação, banco, PDF e e-mail seria maior que o benefício.

**Quando reconsiderar:** equipe maior que 5 pessoas, necessidade de escalar PDF/e-mail independentemente, cadências de deploy conflitantes ou latência que justifique separar um serviço.

**Consequência:** a organização interna precisa ser rigorosa: bordas finas, casos de uso explícitos e adaptadores isolados.

---

### ADR-02 — Criar camada de aplicação e adaptadores

**Decisão:** introduzir `src/application` para casos de uso e `src/infrastructure` para adaptadores externos, migrando `src/server` aos poucos.

**Por quê:** hoje `src/server/briefing.ts` mistura regra de aplicação, transação e persistência. Isso dificulta testar concorrência, trocar o gerador de PDF e evoluir o ciclo de vida.

**Escopo pragmático:**

- Criar casos de uso para `submitBriefing`, `saveAnswers`, `createBriefing`, `reprocessBriefing`, `approveBriefing`, `revokeBriefing` e `regenerateToken`.
- Manter consultas de leitura em query services (`briefingDetail`, `publicForm`), sem inventar repositório para tudo.
- Criar interfaces apenas para o que realmente pode trocar: `PdfRenderer`, `EmailSender`, `RateLimiter`, `JobQueue`, `Clock`.
- Não criar abstração genérica de “repository” sobre Prisma sem necessidade.

**Consequência:** mais arquivos, mas transações e invariantes ficam visíveis e testáveis.

---

### ADR-03 — Manter PostgreSQL + Prisma, com versionamento e auditoria

**Decisão:** continuar com PostgreSQL e Prisma 7. Evoluir o modelo com versionamento de catálogo/regras, auditoria e integridade referencial onde importa.

**Mudanças recomendadas:**

- `Briefing.catalogVersion`, `rulesVersion`, `revokedAt`, `approvedAt`, `approvedById`, `lastActivityAt`, `lastSentAt`.
- `Diagnosis.missingRequiredKeys`, `rulesVersion`, `catalogVersion`, `processedAt`.
- `QuestionVersion` (ou snapshot por briefing) para leitura histórica.
- `AuditLog` para ações administrativas e `AccessLog` para acessos ao link público.
- `Client.deletedAt` para soft delete operacional; exclusão/anonimização LGPD à parte.
- Índices por dono, status, cliente e par resposta/pergunta.

**Consequência:** migrações maiores, mas o diagnóstico passa a ser auditável de verdade.

---

### ADR-04 — Supabase Auth com allowlist explícita

**Decisão:** manter Supabase Auth, mas desativar signup público e autorizar apenas e-mails previamente permitidos.

**Implementação:**

- `ADMIN_EMAILS` em env ou tabela `AllowedAdmin`.
- Se o e-mail autenticado não estiver autorizado, retornar 401/403 sem criar `User`.
- Seed da administradora continua sendo o caminho de provisionamento.
- Teste de integração cobrindo conta não autorizada.

**Consequência:** o modelo multiusuário continua possível, mas o acesso deixa de ser aberto.

---

### ADR-05 — Núcleo determinístico e versionado

**Decisão:** manter o motor sem IA e versionar regras e catálogo.

**Implementação:**

- `RULES_VERSION` exportado de `src/core/signals/registry.ts`.
- `catalogVersion` no briefing, no envio.
- Diagnóstico grava as versões usadas.
- Reprocessamento explícito, nunca automático em leitura.
- Feature flag para rollout de novas regras.

**Consequência:** um diagnóstico antigo continua explicável mesmo depois de uma mudança de regra.

---

### ADR-06 — Assíncrono apenas onde necessário

**Decisão:** não introduzir filas/eventos para tudo. Usar execução assíncrona apenas para PDF, e-mail, retenção e tarefas de manutenção.

**Implementação:**

- `PdfRenderer` como adaptador; em produção, Chromium compatível com serverless ou worker dedicado.
- `EmailSender` como adaptador; começar com provedor transacional simples.
- `JobQueue` para envio de e-mail e geração de PDF quando o volume justificar.
- Se notificações e efeitos colaterais crescerem, usar transactional outbox; não event sourcing.

**Consequência:** o caminho crítico do formulário público continua simples e rápido.

---

### ADR-07 — Borda de API padronizada

**Decisão:** manter Route Handlers como única borda HTTP e padronizar autenticação, origem, rate limit, validação e erros.

**Implementação:**

- `adminRoute` e `publicRoute` como wrappers.
- `AppError` com `code`, `status`, `details` e `requestId`.
- Zod para entrada; validação semântica no domínio.
- `Origin`/`Referer` check em mutações administrativas.
- `429` com `Retry-After` nas rotas públicas.
- Limite de corpo e de lote de respostas.

**Consequência:** menos repetição nas rotas e respostas de erro consistentes.

---

### ADR-08 — Observabilidade e CI desde o começo

**Decisão:** tratar logs, métricas, health check e pipeline como parte da entrega, não como fase posterior.

**Implementação:**

- Logs estruturados com `requestId`, `userId`, `briefingId` e redaction de PII.
- Error tracking no servidor e no cliente.
- `/api/health` verificando processo e banco.
- Métricas de funil, autosave, PDF, 401/429 e 5xx.
- GitHub Actions: lint, typecheck, unit, integration com Postgres, build, audit e E2E em preview.

**Consequência:** falhas deixam de ser descobertas pelo cliente.

---

### ADR-09 — Design system em código

**Decisão:** a fonte de verdade visual é o repositório. Figma, se existir, acompanha; não precede.

**Implementação:**

- Tokens documentados e separados por categoria.
- Componentes com estados completos: default, hover, focus, active, disabled, loading, error, empty, success.
- Catálogo interno de componentes em rota protegida; Storybook só quando houver equipe.
- Testes de regressão visual nas telas críticas.
- Checklist de acessibilidade por componente.

**Consequência:** menos divergência entre telas e mais velocidade para evoluir.

---

### ADR-10 — Privacidade por padrão

**Decisão:** LGPD não é projeto separado; é requisito de arquitetura e design.

**Implementação:**

- Aviso de privacidade no formulário público.
- Consentimento com data, hora e versão do aviso.
- Retenção configurável e rotina de expiração/anonimização.
- Exportação e exclusão por cliente/titular.
- `noindex`, `no-referrer`, redaction de logs e minimização de dados.
- Suboperadores documentados.

**Consequência:** o produto pode ser vendido e operado com dados reais.

---

## 5. Arquitetura-alvo

### Visão em camadas

```
┌─────────────────────────────────────────────────────────────┐
│ Interface — src/app                                         │
│  RSC · Route Handlers · layouts · páginas                   │
│  /admin · /briefing · /print · /login · /api/**             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ Aplicação — src/application                                 │
│  casos de uso · transações · invariantes · autorização      │
│  submitBriefing · saveAnswers · approveBriefing · ...       │
└───────────────┬──────────────────────────────┬──────────────┘
                │                              │
┌───────────────▼──────────────┐  ┌────────────▼──────────────┐
│ Domínio — src/core           │  │ Infraestrutura            │
│  visibility · signals        │  │  Prisma · Supabase        │
│  diagnosis · form · text     │  │  PDF · e-mail · rate limit│
│  validação semântica         │  │  fila · logs · config     │
└──────────────────────────────┘  └───────────────────────────┘
```

### Estrutura de pastas proposta

```
src/
├─ app/                         # interface Next
├─ components/
│  ├─ admin/
│  ├─ briefing/
│  └─ ui/
├─ core/                        # domínio puro
│  ├─ briefing/
│  │  ├─ visibility.ts
│  │  ├─ form.ts
│  │  └─ answerValidation.ts    # novo
│  ├─ signals/
│  │  ├─ registry.ts
│  │  ├─ rules/
│  │  └─ version.ts             # novo
│  ├─ diagnosis/
│  ├─ catalog/
│  │  └─ version.ts             # novo
│  └─ types.ts
├─ application/                 # novo: casos de uso
│  ├─ submitBriefing.ts
│  ├─ saveAnswers.ts
│  ├─ createBriefing.ts
│  ├─ reprocessBriefing.ts
│  ├─ approveBriefing.ts
│  ├─ revokeBriefing.ts
│  └─ regenerateToken.ts
├─ infrastructure/              # novo: adaptadores
│  ├─ db/
│  ├─ auth/
│  ├─ pdf/
│  ├─ email/
│  ├─ rateLimit/
│  └─ jobs/
├─ server/                      # helpers de borda; migrar aos poucos
└─ lib/
   ├─ config.ts                 # novo: env com Zod
   ├─ logger.ts                 # novo
   └─ errors.ts                 # novo: AppError
```

### Regras de dependência

| Módulo | Pode importar | Não pode importar |
|---|---|---|
| `src/core` | apenas `src/core` | Next, Prisma, Supabase, React |
| `src/application` | `src/core`, `src/infrastructure`, tipos | componentes React, Next |
| `src/infrastructure` | Prisma, Supabase, Playwright, SDKs | `src/app`, componentes |
| `src/app` | `src/application`, `src/server`, componentes | Prisma diretamente |
| `src/components` | `src/core` (tipos), `src/server` (tipos) | Prisma, segredos |

### Fluxo de uma mutação

```
Route Handler
  → wrapper (auth + origin + rate limit + body limit)
  → validação de forma (Zod)
  → caso de uso
      → carrega contexto
      → valida invariantes
      → transação
          → domínio puro
          → persistência
      → retorna resultado
  → resposta padronizada
```

---

## 6. Workstreams

| Workstream | Foco | Dono conceitual |
|---|---|---|
| **A. Arquitetura e código** | Casos de uso, transações, adaptadores, config, erros | Engenharia |
| **B. Segurança e integridade** | Auth, CSRF, rate limit, validação, versionamento, auditoria | Engenharia + produto |
| **C. Produto e operação** | Ciclo de vida, aprovação, notificações, métricas, LGPD | Produto |
| **D. Design e experiência** | Marca, design system, IA, fluxos, conteúdo, acessibilidade | Design + produto |
| **E. Qualidade e operação** | CI, testes, observabilidade, deploy, runbooks | Engenharia |

As fases abaixo combinam workstreams; não são sequenciais por área.

---

## 7. Roadmap por fase

> As durações assumem uma pessoa em tempo parcial e devem ser ajustadas à capacidade real. O que importa é a ordem e o critério de saída de cada fase, não o calendário.

### Fase 0 — Blindagem e baseline

**Duração sugerida:** 1 sprint (1–2 semanas)  
**Objetivo:** o sistema pode receber dados reais sem risco óbvio.

| Área | Entregas |
|---|---|
| Arquitetura | `config.ts` com Zod; `AppError`; wrappers de rota; esqueleto de CI |
| Segurança | Allowlist de admin; signup desativado; redirect seguro; headers; `noindex`; proxy restrito ao admin |
| Dados | `missingRequiredKeys` persistido; ordem determinística do diagnóstico; guarda de status no autosave |
| Produto | `/` redireciona para login/painel; logout visível |
| Design | Auditoria de acessibilidade; correção do label de rádio; `beforeunload`; copy de privacidade |
| Qualidade | Testes de API para 401/403/404/410/422; CI com lint/typecheck/unit/integration |

**Critério de saída:**

- Conta Supabase não autorizada não cria `User`.
- Nenhuma rota administrativa responde sem sessão.
- Headers de segurança e `noindex` presentes.
- `npm audit --omit=dev` sem critical/high.
- CI bloqueia merge quebrado.

---

### Fase 1 — Núcleo confiável

**Duração sugerida:** 2 sprints (3–4 semanas)  
**Objetivo:** o briefing não perde dados, não fecha sem diagnóstico e não aceita resposta inválida.

| Área | Entregas |
|---|---|
| Arquitetura | Casos de uso de submit/save/reprocess; transações; taxonomia de erros |
| Dados | Envio atômico com transição condicional; validação semântica; versionamento de catálogo/regras |
| Segurança | CSRF/origin check; rate limit público; limite de corpo; logs sem PII |
| Produto | Revogar, regenerar e reenviar link; aprovação; histórico de ações |
| Design | App shell do admin; UI de ciclo de vida; resumo real na revisão |
| Qualidade | Testes de concorrência; testes de API; E2E do fluxo principal |

**Critério de saída:**

- Dois submits concorrentes não duplicam diagnóstico nem sobrescrevem `submittedAt`.
- Autosave após envio é rejeitado.
- `single_choice`, `multi_choice` e `business_type` validados contra o catálogo.
- Briefing antigo continua legível após mudança de catálogo.
- E2E cobre criar cliente → criar link → responder → enviar → ver diagnóstico.

---

### Fase 2 — Operação e privacidade

**Duração sugerida:** 2 sprints (3–4 semanas)  
**Objetivo:** operar com clientes reais, com suporte, privacidade e observabilidade.

| Área | Entregas |
|---|---|
| Arquitetura | Adaptadores de PDF/e-mail/rate limit/fila; observabilidade |
| Produto | Aprovação e histórico completos; busca/paginação; métricas de funil |
| Privacidade | Consentimento; retenção; exportação; exclusão/anonimização; suboperadores |
| Design | IA do painel; dashboard; PDF com identidade; estados vazios/carregando/erro |
| Qualidade | E2E completo; regressão visual; auditoria de acessibilidade; teste de carga leve |
| Operação | Health check; logs estruturados; error tracking; backup/restore; runbooks |

**Critério de saída:**

- PDF funciona em preview e produção.
- Consentimento registrado com versão do aviso.
- Exportação e exclusão testadas.
- Health check e alertas ativos.
- Fluxo completo coberto por E2E e regressão visual.

---

### Fase 3 — Identidade e experiência

**Duração sugerida:** 2 sprints (3–4 semanas)  
**Objetivo:** o produto parece acabado, é prazeroso de usar e tem identidade própria.

| Área | Entregas |
|---|---|
| Marca | Sistema de marca, logo, aplicações, tom de voz, OG image, capa de PDF |
| Design system | Tokens documentados, componentes com estados, catálogo interno, dark mode auditado |
| UX | Landing ou página institucional mínima; onboarding; revisão com resumo; diagnóstico explicado |
| Acessibilidade | WCAG 2.1 AA; teclado; leitor de tela; contraste; movimento reduzido; toque |
| Conteúdo | Microcopy de erros, salvamento, privacidade, diagnóstico e próximos passos |
| Qualidade | Testes de usabilidade; Core Web Vitals; checklist de design review |

**Critério de saída:**

- Nenhuma tela crítica com violação séria de acessibilidade.
- Teste de usabilidade com 5 administradoras/respondentes.
- Taxa de conclusão do formulário medida por etapa.
- Identidade aplicada em painel, formulário e PDF.

---

### Fase 4 — Escala e inteligência

**Duração:** contínuo, orientado por demanda  
**Objetivo:** crescer sem perder a simplicidade.

| Área | Entregas |
|---|---|
| Produto | Multiusuário com papéis e convites; catálogo gerenciável por interface |
| Inteligência | Analytics de funil; comparação entre clientes; benchmarking |
| Integrações | CRM, automação, e-mail transacional, webhooks |
| IA opcional | Sugestão de recomendações a partir dos sinais, sempre com revisão humana |
| Arquitetura | Outbox/eventos se necessário; testes de carga; chaos engineering leve |

**Critério de saída:** cada item só entra quando houver demanda real e métrica que justifique.

---

## 8. Backlog detalhado

Esforço: **P** = até 1 dia; **M** = 2–5 dias; **G** = mais de 1 semana.

### Fase 0

| ID | Item | Área | Esforço | Depende |
|---|---|---|---|---|
| ARQ-01 | Schema de env com Zod e falha rápida | Arquitetura | P | — |
| ARQ-02 | `AppError` + wrapper `adminRoute`/`publicRoute` | Arquitetura | M | ARQ-01 |
| ARQ-03 | CI com lint, typecheck, unit, integration e build | Qualidade | M | — |
| SEC-01 | Allowlist de administradores + signup desativado | Segurança | P | — |
| SEC-02 | Redirect seguro no login | Segurança | P | — |
| SEC-05 | `noindex`/`no-referrer` em rotas privadas | Segurança | P | — |
| SEC-06 | Headers de segurança no `next.config` | Segurança | P | — |
| PERF-01 | Restringir proxy a rotas administrativas | Performance | P | — |
| DATA-04 | Persistir `missingRequiredKeys` | Dados | P | Migração |
| DATA-06 | Ordem determinística do diagnóstico | Dados | P | — |
| PROD-01 | `/` redireciona para login/painel | Produto | P | — |
| A11Y-01 | Corrigir label do grupo de rádio | Design | P | — |
| A11Y-02 | Corrigir `beforeunload` | Design | P | — |
| TEST-01 | Testes de API para erros principais | Qualidade | M | ARQ-02 |

### Fase 1

| ID | Item | Área | Esforço | Depende |
|---|---|---|---|---|
| ARQ-04 | Casos de uso de submit/save/reprocess | Arquitetura | M | ARQ-02 |
| DATA-01 | Envio atômico com transição condicional | Dados | M | ARQ-04 |
| DATA-03 | Validação semântica de respostas | Dados | M | — |
| DATA-02 | Versionamento de catálogo e regras | Dados | G | Migração |
| DATA-05 | Máquina de estados e campos de ciclo de vida | Dados | M | Migração |
| SEC-03 | CSRF/origin check em mutações | Segurança | P | ARQ-02 |
| SEC-04 | Rate limit público com `Retry-After` | Segurança | M | Adaptador |
| SEC-07 | Redaction de PII nos logs | Segurança | P | Logger |
| QUAL-06 | Audit log de ações administrativas | Operação | M | Migração |
| PROD-02 | Revogar, regenerar e reenviar link | Produto | M | DATA-05 |
| PROD-03 | Filtro do painel por status válido | Produto | P | — |
| PROD-04 | Revisão com resumo por categoria | Design | M | — |
| PERF-03 | Autosave em lote e catálogo cacheado | Performance | M | — |
| TEST-02 | Testes de concorrência no envio | Qualidade | M | DATA-01 |
| TEST-03 | E2E smoke do fluxo principal | Qualidade | M | — |

### Fase 2

| ID | Item | Área | Esforço | Depende |
|---|---|---|---|---|
| OPS-01 | Logs estruturados, request id e error tracking | Operação | M | — |
| OPS-02 | `/api/health` | Operação | P | — |
| OPS-03 | Adaptador de PDF para produção/worker | Operação | M | — |
| OPS-04 | E-mail transacional (reenvio/notificação) | Produto | M | — |
| LGPD-01 | Consentimento com versão do aviso | Privacidade | M | — |
| LGPD-02 | Retenção e anonimização | Privacidade | M | — |
| LGPD-03 | Exportação e exclusão por cliente/titular | Privacidade | M | — |
| PROD-05 | Aprovação e histórico no painel | Produto | M | DATA-05 |
| PROD-06 | Busca e paginação de clientes/briefings | Produto | M | — |
| PERF-04 | Índices e consultas de lista | Performance | P | — |
| DESIGN-01 | App shell do admin com navegação e menu de usuário | Design | M | — |
| DESIGN-02 | Template de PDF com identidade e sumário | Design | M | — |
| TEST-04 | E2E completo com PDF | Qualidade | M | OPS-03 |
| TEST-05 | Regressão visual e acessibilidade | Qualidade | M | — |

### Fase 3

| ID | Item | Área | Esforço | Depende |
|---|---|---|---|---|
| DESIGN-03 | Sistema de marca e aplicações | Design | M | — |
| DESIGN-04 | Landing ou página institucional mínima | Design | M | DESIGN-03 |
| DESIGN-05 | Catálogo interno de componentes | Design | M | — |
| DESIGN-06 | Polimento do formulário público | Design | M | — |
| DESIGN-07 | Visualização do diagnóstico e explicação do cinza | Design | M | DATA-04 |
| DESIGN-08 | Guia de conteúdo e microcopy | Design | P | — |
| DESIGN-09 | Auditoria de dark mode | Design | P | — |
| DESIGN-10 | Testes de usabilidade com 5 pessoas | Design | M | — |
| ARQ-05 | Performance, caching e feature flags | Arquitetura | M | — |
| PROD-07 | Onboarding da administradora | Produto | M | — |
| QUAL-07 | Labels tipados e sem drift de enum | Código | P | — |
| QUAL-08 | Reprocessamento só em briefing enviado | Código | P | — |

### Fase 4

| ID | Item | Área | Esforço | Depende |
|---|---|---|---|---|
| SCALE-01 | Papéis, convites e permissões | Produto | G | — |
| SCALE-02 | Catálogo gerenciável por interface | Produto | G | DATA-02 |
| SCALE-03 | Analytics de funil e benchmarking | Produto | G | OPS-01 |
| SCALE-04 | Integrações com CRM/automação | Produto | G | — |
| SCALE-05 | Assistente opcional de IA com revisão humana | Produto | G | SCALE-03 |
| SCALE-06 | Outbox/eventos para efeitos colaterais | Arquitetura | M | — |
| SCALE-07 | Testes de carga e chaos engineering leve | Qualidade | M | — |

---

## 9. Roadmap de design

Design não é uma fase final. As fundações entram cedo; a identidade amadurece depois.

### 9.1 Fundações de marca

**Decisão:** manter a base atual — laranja como cor de sinal/ação, preto e off-white como base, Inter como tipografia, glifo de três níveis.

**O que formalizar:**

- Plataforma de marca: “clareza antes da execução”.
- Tom de voz: direto, humano, não julgador, sem jargão de agência.
- Sistema de logo: glifo, wordmark, lockup horizontal e vertical.
- Aplicações: favicon, OG image, login, PDF, e-mail e estados de erro.
- Paleta com papéis semânticos, não só nomes de cor.
- Tipografia com escala e pesos documentados.
- Iconografia Lucide com stroke 1.5; ilustração só se ajudar a explicar.
- Movimento discreto; respeitar `prefers-reduced-motion`.

**Entregáveis:**

- `docs/brand-guide.md`
- Arquivos de logo e favicon
- OG image
- Capa e rodapé do PDF
- Guia de tom de voz

### 9.2 Design system

**Estado atual:** bons tokens em `globals.css`, componentes shadcn, densidades `admin`/`public`, tema claro/escuro.

**Próximos passos:**

- Separar `globals.css` em `tokens.css`, `base.css`, `components.css`, `layout.css` e `print.css`.
- Documentar tokens: cor, tipografia, espaço, raio, elevação, movimento, breakpoints e densidade.
- Definir estados de componente: default, hover, focus, active, disabled, loading, error, empty, success.
- Padronizar botões, campos, seleção, cards, badges, alerts, tabelas, diálogos, tabs, progresso, skeleton e toast.
- Criar catálogo interno em rota protegida (`/admin/design`) ou Storybook quando houver equipe.
- Adicionar regressão visual nas telas críticas.
- Checklist de acessibilidade por componente.

**Entregáveis:**

- `docs/design-system.md`
- Catálogo de componentes
- Testes de regressão visual
- Checklist de acessibilidade

### 9.3 Arquitetura de informação

**Administração:**

```
Login
  └─ Clientes
       ├─ Cliente
       │    ├─ Briefings
       │    └─ Novo briefing
       └─ Briefing
            ├─ Diagnóstico
            ├─ Respostas
            ├─ Respostas brutas
            ├─ Ações (revogar, regenerar, reenviar, aprovar)
            └─ PDF
  └─ Métricas (fase 2)
  └─ Configurações (fase 3)
```

**Público:**

```
Boas-vindas
  └─ Etapas do formulário
       └─ Revisão
            └─ Enviado
```

**Navegação do admin:**

- Header com marca, navegação principal e menu de usuário.
- Breadcrumbs em cliente e briefing.
- Ações primárias visíveis; ações destrutivas com confirmação.
- Busca e filtros no nível da lista, não escondidos em menu.

### 9.4 Fluxos e telas

| Tela | Melhoria principal |
|---|---|
| `/` | Landing mínima ou redirect claro; nunca template do Next |
| `/login` | Reforçar confiança, recuperação de senha e mensagens genéricas |
| `/admin` | Dashboard com métricas, lista de clientes, filtros e busca |
| `/admin/clientes/[id]` | Histórico de briefings, ações e status |
| `/admin/briefings/[id]` | Diagnóstico explicado, respostas, ações de ciclo de vida |
| `/briefing/[token]` | Boas-vindas, progresso, autosave, ramificação, revisão e privacidade |
| `/print/briefing/[id]` | PDF com capa, sumário, diagnóstico, problemas, oportunidades e respostas |
| Estados de link | Inválido, expirado, já enviado e revogado com ações claras |
| Estados vazios | Explicar o próximo passo, não só “nada aqui” |
| Carregamento | Skeletons com a forma do conteúdo |
| Erro | Mensagem humana, ação de recuperação e sem PII |

### 9.5 Conteúdo e microcopy

**Princípios:**

- Falar com a administradora como par, não como fornecedor.
- Falar com o respondente sem julgamento.
- Explicar o que o sistema fará com a resposta.
- Nunca usar “erro 422” ou “payload inválido” na interface.
- Dizer o que aconteceu, por que aconteceu e o que fazer.

**Textos que precisam existir:**

- Aviso de privacidade e consentimento.
- Explicação de categoria cinza.
- “Diagnóstico não é sentença.”
- Estado de salvamento: salvando, salvo, sem conexão.
- Erros de link inválido, expirado, enviado e revogado.
- Confirmação de envio e próximo passo.
- Ações destrutivas: revogar, regenerar, excluir.

### 9.6 Acessibilidade

Meta: **WCAG 2.1 AA**.

Checklist mínimo:

- Navegação completa por teclado.
- Foco visível e gerenciado ao trocar de etapa.
- Labels corretos em rádio, checkbox e grupos.
- `aria-live` para salvamento, erros e confirmações.
- Contraste de texto e componentes.
- Alvos de toque de pelo menos 44 px no formulário público.
- Respeito a `prefers-reduced-motion`.
- Textos alternativos e hierarquia de headings.
- Teste com leitor de tela em pelo menos uma passagem completa.
- Teste com zoom de 200%.

### 9.7 Validação e design ops

- **Testes de usabilidade:** 5 administradoras e 5 respondentes, tarefas reais.
- **Métricas de experiência:** conclusão por etapa, tempo, abandono, erros de validação, uso do autosave.
- **Analytics:** eventos de link aberto, início, etapa concluída, revisão, envio e PDF.
- **Design review:** checklist antes de merge de tela nova.
- **Figma:** se existir, manter biblioteca e sincronizar tokens; o código continua sendo a fonte de verdade.
- **Regressão visual:** Playwright screenshots das telas críticas em mobile e desktop.
- **Changelog de design:** registrar mudanças de padrão e componentes.

### 9.8 Entregáveis de design por fase

| Fase | Entregáveis |
|---|---|
| Fase 0 | Auditoria de acessibilidade, correções rápidas, copy de privacidade |
| Fase 1 | App shell, UI de ciclo de vida, resumo de revisão, estados de erro |
| Fase 2 | IA do painel, dashboard, PDF com identidade, estados vazios/carregando |
| Fase 3 | Marca, landing, catálogo de componentes, guia de conteúdo, dark mode, testes de usabilidade |
| Fase 4 | Design ops, benchmarking visual, novas superfícies |

---

## 10. Métricas e critérios de sucesso

### Confiabilidade

| Métrica | Meta |
|---|---|
| Briefings enviados com diagnóstico | 100% |
| Sucesso de submit | > 99,5% |
| p95 do autosave | < 500 ms |
| Sucesso de geração de PDF | > 99% |
| Disponibilidade mensal | 99,5% |
| Incidentes P0 | 0 |

### Produto

| Métrica | Meta inicial |
|---|---|
| Taxa de conclusão do formulário | > 50% |
| Tempo mediano de preenchimento | 12–18 min |
| Briefings revisados pela administradora | > 90% |
| Briefings aprovados | > 70% |
| Categorias cinza por briefing | < 20% |
| Exportações de PDF por briefing revisado | > 50% |

### Design e experiência

| Métrica | Meta |
|---|---|
| SUS (System Usability Scale) | > 80 |
| Violações críticas de acessibilidade | 0 |
| Sucesso de tarefa no mobile | > 90% |
| Abandono por etapa | Reduzir 30% no primeiro ciclo |
| Reclamações de “não sei se salvou” | 0 |

### Segurança e privacidade

| Métrica | Meta |
|---|---|
| Vulnerabilidades critical/high em produção | 0 |
| Rotas administrativas com auth no servidor | 100% |
| PII em payload público | 0 |
| PII em logs | 0 |
| Testes de 401/403/404/410/422/429 | Cobertos |

---

## 11. Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Over-engineering arquitetural | Média | Alto | Casos de uso só onde há transação/invariante; sem abstração genérica |
| Versionamento de catálogo travar o time | Média | Alto | Começar com `catalogVersion` + `QuestionVersion`; não fazer snapshot por briefing |
| PDF continuar falhando em serverless | Alta | Alto | Adaptador isolado; testar em preview; worker se necessário |
| LGPD virar projeto infinito | Média | Alto | Entregar consentimento, retenção, exportação e exclusão em incrementos |
| Design system virar burocracia | Média | Médio | Tokens e componentes primeiro; Storybook só com equipe |
| Testes de usabilidade atrasarem | Média | Médio | 5 pessoas, tarefas curtas, rodar a cada fase |
| Dependência de uma única administradora | Alta | Médio | Documentação, runbooks, evolução para papéis |
| Mudança de regra quebrar histórico | Média | Alto | Versão de regras/catálogo e reprocessamento explícito |
| Aumento de escopo de IA | Baixa | Médio | IA só como assistente opcional, com revisão humana |

---

## 12. Não-objetivos

Não fazem parte deste ciclo:

- Microserviços, GraphQL ou event sourcing.
- Aplicativo mobile nativo.
- IA generativa como núcleo do diagnóstico.
- White-label por cliente.
- Cobrança/assinatura.
- Cadastro público de contas.
- Catálogo visual de perguntas antes de o catálogo versionado estar estável.
- Storybook completo antes de haver equipe de design/engenharia.
- Dashboard analítico avançado antes de haver volume de dados.

---

## 13. Primeiros 30 dias

### Semana 1 — Segurança e baseline

- Allowlist de admin e signup desativado.
- Redirect seguro.
- Headers de segurança e `noindex`.
- Proxy restrito ao admin.
- Schema de env com Zod.
- Home redirecionando.
- CI inicial.

### Semana 2 — Integridade do envio

- Caso de uso de submit.
- Transação e transição condicional.
- `missingRequiredKeys` persistido.
- Ordem determinística do diagnóstico.
- Testes de concorrência.
- Guarda de status no autosave.

### Semana 3 — Validação e ciclo de vida

- Validação semântica de respostas.
- Revogar/regenerar link.
- Aprovação e histórico.
- Rate limit e CSRF.
- Audit log.
- Testes de API.

### Semana 4 — Experiência e operação

- App shell do admin.
- Resumo de revisão.
- Correções de acessibilidade.
- E2E smoke.
- Design audit.
- Deploy em preview com PDF.

---

## 14. Definition of Done

Uma entrega só está pronta quando:

- O critério de aceite é verificável.
- Há teste automatizado do caminho feliz e dos erros relevantes.
- `lint`, `typecheck`, unitários, integração e build passam no CI.
- Não introduz regressão de segurança, privacidade ou acessibilidade.
- Logs e mensagens não expõem PII.
- Funciona em mobile e desktop.
- Foi validada em preview antes de produção.
- Migrações e variáveis de ambiente foram previstas.
- Documentação de produto, requisitos, arquitetura e design foi atualizada.
- O impacto operacional (backup, retenção, custo) foi considerado.

---

## 15. Mapa com os documentos existentes

| Documento | Uso neste roadmap |
|---|---|
| `docs/01-produto.md` | Visão, personas, escopo, métricas e evolução de produto |
| `docs/02-requisitos.md` | RF/RNF, critérios de aceite, contratos de API e LGPD |
| `docs/03-inspecao-e-arquitetura.md` | Achados SEC/DATA/PERF/PROD/QUAL, arquitetura-alvo e plano de ação |
| `docs/04-roadmap-melhorias.md` | Sequência integrada de arquitetura, segurança, produto e design |

### Rastreabilidade dos achados

| Achado | Fase |
|---|---|
| SEC-01, SEC-02, SEC-05, SEC-06, PERF-01, DATA-04, DATA-06, PROD-01, A11Y-01, A11Y-02, QUAL-05 | Fase 0 |
| DATA-01, DATA-02, DATA-03, DATA-05, SEC-03, SEC-04, SEC-07, QUAL-06, PROD-04 | Fase 1 |
| LGPD-01, DEPLOY-01, PERF-04, PROD-05, PROD-06 | Fase 2 |
| QUAL-07, QUAL-08, identidade visual, acessibilidade aprofundada | Fase 3 |
| Multiusuário, catálogo visual, analytics, IA, integrações | Fase 4 |

---

## 16. Decisão final

O caminho mais curto para um produto confiável não é adicionar funcionalidades; é **fechar as brechas de confiança** e **transformar a experiência em linguagem de produto**.

A ordem recomendada é:

1. **Blindar** o que já existe.
2. **Proteger** os dados e o envio.
3. **Fechar** o ciclo operacional.
4. **Dar identidade** ao produto.
5. **Escalar** apenas quando a operação pedir.

Esse sequenciamento preserva o que o projeto já tem de melhor — o núcleo determinístico, a ramificação por dados e a atenção ao respondente — e evita trocar complexidade técnica por complexidade de produto.
