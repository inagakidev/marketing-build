# Fontes de verdade e decisões

Leia antes de: começar qualquer tarefa nova, ou quando o código e os documentos divergirem.

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

## Onde registrar

- Auditoria da Fase 0: `docs/05-auditoria-fase-0.md`.
- Decisões de produto/arquitetura tomadas durante o desenvolvimento: `docs/decisoes.md` (data, contexto, decisão, alternativas, impacto).
