# Qualidade e testes

Leia antes de: escrever testes ou dar uma entrega por pronta.

**Gate obrigatório antes de considerar pronto:**

```bash
npm run lint && npm run typecheck && npm test && npm run test:db && npm run build
```

- Teste de comportamento e invariante, não de cobertura percentual.
- Toda regra de acesso tem **teste negativo** (sem sessão, sem permissão, outra organização, outro projeto).
- Testes unitários (`*.test.ts`) não dependem de banco; regras puras ficam em arquivos sem import do Prisma.
- Testes de integração rodam contra PostgreSQL real (`*.itest.ts`).
- O CI (`.github/workflows/ci.yml`) roda o mesmo gate num clone limpo. Algo que só passa na sua máquina (tipos gerados, arquivos ignorados) não está pronto.
- Relatar resultado com fidelidade: se algo falhou ou foi pulado, dizer.
