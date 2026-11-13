# Arquitetura

Leia antes de: criar módulo, rota, caso de uso, regra de autorização ou fluxo com várias escritas.

- **Monólito modular** (`docs/03-inspecao-e-arquitetura.md` §5). Introduzir `src/modules/<contexto>/{domain,application,infrastructure,presentation}` **somente quando um fluxo for implementado ou refatorado**. Nada de pastas vazias nem reescrita em massa.
- `src/core` continua puro: sem Next, React, Prisma, Supabase ou rede.
- **Rotas finas:** autenticar → validar formato (zod) → chamar caso de uso → converter em HTTP (helpers de `src/server/api.ts`). Regra de negócio não mora em route handler nem em componente.
- **Autorização no servidor**, centralizada em funções de policy, nunca só na interface. A partir da Fase 1, toda consulta e mutação é limitada por `organizationId` por meio de helpers reutilizáveis (não por filtros lembrados um a um).
- Fluxos com mais de uma escrita relacionada (envio, diagnóstico, aprovação, conversão) rodam em **transação** e são **idempotentes**.
- Repositório só quando houver ganho real (transação, isolamento, teste). Nada de wrapper genérico do Prisma.
- Next.js 16 tem breaking changes: **ler o guia em `node_modules/next/dist/docs/` antes** de usar API de roteamento, cache, proxy, server actions etc.
