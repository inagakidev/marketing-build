# Fluxo de trabalho

Leia antes de: planejar ou começar uma história.

1. **Planejar antes de codar.** Cada história passa pelo Definition of Ready (`docs/04-roadmap-melhorias.md` §12): requisito/ID vinculado, critério de aceite verificável, impacto em dados, permissão e estados de UI avaliados.
2. **Teste primeiro** para regras de domínio e para correções de bug (um teste que reproduz o problema e falha antes da correção).
3. **Implementar no menor escopo revisável.** Uma história = um conjunto de commits coeso.
4. **Verificar** com o gate de qualidade (`qualidade.md`) antes de dar por pronto.
5. **Atualizar a documentação na mesma entrega** (requisitos, arquitetura, roadmap, README) quando o comportamento ou a decisão mudar.

- Commits em Conventional Commits, mensagem em pt-BR, citando o ID rastreável: `fix(briefing): torna envio atômico (DATA-01)`.
- Não adicionar dependência nova sem justificar no commit/PR (o que resolve e por que não dá com o que já existe).
- Não ampliar escopo: o que surgir fora da história vira anotação no backlog, não código.
