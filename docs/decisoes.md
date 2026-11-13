# Registro de decisões

Decisões de produto e arquitetura tomadas durante o desenvolvimento. Formato: data, contexto, decisão, alternativas consideradas, impacto.

---

## 2026-11-12 — Decisões para executar a Fase 0

Contexto: auditoria de confirmação (`docs/05-auditoria-fase-0.md`, §5).

| ID | Decisão | Alternativas consideradas | Impacto |
|---|---|---|---|
| D1 | Produção roda em **Vercel serverless**. | Contêiner/VPS | O PDF precisa de Chromium compatível com serverless (DEPLOY-01); estado em memória não é compartilhado entre instâncias. |
| D2 | Rate limiting com **tabela no PostgreSQL**, sem dependência nova. | Upstash/Redis; memória local | Uma escrita por requisição limitada; janela fixa por chave; limpeza periódica de registros antigos. |
| D3 | **Acesso provisório:** só entra quem já existe na tabela `users` (criado por seed ou ação administrativa). Conta Supabase desconhecida é recusada. Vale até os convites da Fase 1. | Allowlist por e-mail em variável de ambiente | Fecha o SEC-01 sem antecipar organização/membros. |
| D4 | Excluir cliente **continua sendo hard delete** em cascata até a PD-12 ser decidida. | Arquivamento lógico | NEW-04 permanece registrado como conflito com o princípio de histórico preservado; revisitar na PD-12. |
| D5 | Branch `main` criada a partir da `front`; os épicos são desenvolvidos em branches próprias e integrados por PR. | Seguir só na `front` | `main` passa a ser a base dos PRs. |

## 2026-11-13 — PDF em serverless (DEPLOY-01)

| ID | Decisão | Alternativas consideradas | Impacto |
|---|---|---|---|
| D6 | PDF gerado com **`playwright-core` + `@sparticuz/chromium`**, versões fixadas em par (1.63.0 ↔ Chromium 153; `@sparticuz/chromium` 153.0.0). Local/contêiner continua usando o Chromium do Playwright. | Impressão pelo navegador (`window.print()`); serviço externo de renderização | Duas dependências de produção; função do PDF precisa de ~1,6 GB de memória; cold start de 1–2 s; atualizar uma versão exige atualizar a outra. |
