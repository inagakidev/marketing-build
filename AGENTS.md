<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Guidelines de desenvolvimento — Briefing Inteligente

Valem para pessoas e agentes. O detalhe de cada tema fica em `docs/guidelines/`. **Antes de cada tipo de tarefa, leia o arquivo correspondente.**

## Regras que valem sempre

- **Fontes de verdade:** `PRODUCT.md` > `docs/02-requisitos.md` > `docs/03-inspecao-e-arquitetura.md` > `docs/04-roadmap-melhorias.md`. Divergência entre código e documento é registrada e decidida, nunca resolvida em silêncio.
- **Decisões pendentes (PD-xx) não são decididas por conveniência técnica:** parar e perguntar.
- **Sem IA generativa no produto (V1).** Diagnóstico e recomendações são código determinístico.
- **Planejar antes de codar; teste primeiro** para regra de domínio e correção de bug.
- **Git:** branch a partir da `main` atualizada; PR sempre com base `main`; após o merge, voltar para a `main`; apagar branches que não são mais usadas.
- **Pronto = gate verde:** `npm run lint && npm run typecheck && npm test && npm run test:db && npm run build`.
- **Segurança em toda história:** entrada validada no servidor, autorização no servidor, logs sem PII.

## Qual guideline ler

| Antes de… | Leia |
|---|---|
| Começar qualquer tarefa, ou quando código e documentos divergirem | [`fontes-de-verdade.md`](docs/guidelines/fontes-de-verdade.md) |
| Planejar ou iniciar uma história; escrever commits | [`fluxo-de-trabalho.md`](docs/guidelines/fluxo-de-trabalho.md) |
| Criar branch, abrir PR, fazer merge ou limpar branches | [`git.md`](docs/guidelines/git.md) |
| Criar módulo, rota, caso de uso, autorização ou fluxo com várias escritas | [`arquitetura.md`](docs/guidelines/arquitetura.md) |
| Alterar o schema, criar migração ou mudar exclusão/arquivamento | [`dados-e-migracoes.md`](docs/guidelines/dados-e-migracoes.md) |
| Escrever testes ou dar uma entrega por pronta | [`qualidade.md`](docs/guidelines/qualidade.md) |
| Mexer em auth, rotas, payload público, logs ou variáveis de ambiente | [`seguranca-e-privacidade.md`](docs/guidelines/seguranca-e-privacidade.md) |
| Escrever componentes, telas ou textos de interface | [`codigo-e-interface.md`](docs/guidelines/codigo-e-interface.md) |

Ao criar ou mudar uma guideline: um tema por arquivo, linha "Leia antes de:" no topo, e uma linha nesta tabela.
