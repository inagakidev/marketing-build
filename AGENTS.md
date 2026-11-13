<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Guidelines de desenvolvimento — Briefing Inteligente

> Status: **rascunho para aprovação**. Vale para pessoas e agentes.

## 1. Fontes de verdade

| Documento | Define |
|---|---|
| `PRODUCT.md` | Visão, princípios, limites (o "porquê") |
| `docs/02-requisitos.md` | Comportamento esperado e critérios de aceite (o "quê") |
| `docs/03-inspecao-e-arquitetura.md` | Organização técnica (o "como") |
| `docs/04-roadmap-melhorias.md` | Sequência, fases e épicos (o "quando") |

- Em conflito, vale essa ordem. Se o código divergir dos documentos, **registrar a divergência e decidir explicitamente** se muda o código ou o documento. Nunca escolher em silêncio.
- **Decisões pendentes (PD-01 a PD-14) não são resolvidas por conveniência técnica.** Se uma tarefa esbarra em uma delas, parar, registrar e perguntar. Isolar o ponto de decisão (ex.: uma função de policy) quando der para avançar sem ele.
- Achados históricos (SEC-xx, DATA-xx...) **não são backlog** até serem confirmados no código e classificados como `confirmado`, `corrigido`, `não reproduzido`, `parcial` ou `substituído por decisão nova`.
- Sem IA generativa no produto (V1). Diagnóstico e recomendações são código determinístico.

## 2. Fluxo de trabalho

1. **Planejar antes de codar.** Cada história passa pelo Definition of Ready (roadmap §12): requisito/ID vinculado, critério de aceite verificável, impacto em dados, permissão e estados de UI avaliados.
2. **Teste primeiro** para regras de domínio e para correções de bug (um teste que reproduz o problema e falha antes da correção).
3. **Implementar no menor escopo revisável.** Uma história = um conjunto de commits coeso.
4. **Verificar** com o gate de qualidade (§5) antes de dar por pronto.
5. **Atualizar a documentação na mesma entrega** (requisitos, arquitetura, roadmap, README) quando o comportamento ou a decisão mudar.

- Commits em Conventional Commits, mensagem em pt-BR, citando o ID rastreável: `fix(briefing): torna envio atômico (DATA-01)`.
- Não adicionar dependência nova sem justificar no commit/PR (o que resolve e por que não dá com o que já existe).
- Não ampliar escopo: o que surgir fora da história vira anotação no backlog, não código.

## 3. Arquitetura

- **Monólito modular** (arquitetura §5). Introduzir `src/modules/<contexto>/{domain,application,infrastructure,presentation}` **somente quando um fluxo for implementado ou refatorado**. Nada de pastas vazias nem reescrita em massa.
- `src/core` continua puro: sem Next, React, Prisma, Supabase ou rede.
- **Rotas finas:** autenticar → validar formato (zod) → chamar caso de uso → converter em HTTP (helpers de `src/server/api.ts`). Regra de negócio não mora em route handler nem em componente.
- **Autorização no servidor**, centralizada em funções de policy, nunca só na interface. A partir da Fase 1, toda consulta e mutação é limitada por `organizationId` por meio de helpers reutilizáveis (não por filtros lembrados um a um).
- Fluxos com mais de uma escrita relacionada (envio, diagnóstico, aprovação, conversão) rodam em **transação** e são **idempotentes**.
- Repositório só quando houver ganho real (transação, isolamento, teste). Nada de wrapper genérico do Prisma.
- Next.js 16 tem breaking changes: **ler o guia em `node_modules/next/dist/docs/` antes** de usar API de roteamento, cache, proxy, server actions etc.

## 4. Dados e migrações

- Toda mudança de schema via `prisma migrate`, com migração versionada no repositório. Nunca editar migração já aplicada.
- Avaliar em cada migração: dados existentes (backfill), compatibilidade e rollback. Documentar no PR quando não for trivial.
- Migrações são aplicadas por etapa controlada de release, nunca na inicialização da aplicação.
- Histórico é preservado: entidades estratégicas (diagnóstico, recomendação, objetivo, meta, medição) são versionadas ou arquivadas com motivo/autor, não sobrescritas nem apagadas fisicamente.

## 5. Qualidade

**Gate obrigatório antes de considerar pronto:**

```bash
npm run lint && npm run typecheck && npm test && npm run test:db && npm run build
```

- Teste de comportamento e invariante, não de cobertura percentual.
- Toda regra de acesso tem **teste negativo** (sem sessão, sem permissão, outra organização, outro projeto).
- Testes de integração rodam contra PostgreSQL real (`*.itest.ts`).
- Relatar resultado com fidelidade: se algo falhou ou foi pulado, dizer.

## 6. Segurança e privacidade (em toda história, não numa fase)

- Validar toda entrada no servidor (tipo, opções, limites).
- Payload público contém só o necessário para responder; nada de notas internas ou diagnóstico.
- Logs sem tokens, respostas livres, e-mails, telefones ou outra PII desnecessária.
- Variáveis de ambiente validadas na inicialização, com falha explícita.
- Tokens de link são credenciais: opacos, expiráveis, revogáveis.

## 7. Código e interface

- Identificadores de código em inglês; comentários, textos de UI, mensagens de erro e documentação em **pt-BR**. Manter o padrão de nomes de arquivo já existente em cada pasta.
- Comentários explicam o *porquê*, não o *quê*.
- UI responsiva e acessível (WCAG 2.2 AA como referência): teclado, foco visível, rótulos, contraste, status nunca só por cor, respeito a movimento reduzido.
- Toda tela prevê estados de **carregamento, vazio, erro, sucesso e permissão insuficiente**.
- Tom: direto, humano, não julgador. Distinguir visualmente sugestão automática × decisão humana × resultado confirmado.

## 8. Registro de decisões e auditoria

- Resultado da auditoria da Fase 0: `docs/05-auditoria-fase-0.md`.
- Decisões de produto/arquitetura tomadas durante o desenvolvimento: `docs/decisoes.md` (data, contexto, decisão, alternativas, impacto).
