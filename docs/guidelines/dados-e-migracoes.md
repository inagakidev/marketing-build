# Dados e migrações

Leia antes de: alterar `prisma/schema.prisma`, criar migração ou mudar como algo é apagado/arquivado.

- Toda mudança de schema via `prisma migrate`, com migração versionada no repositório. Nunca editar migração já aplicada.
- Avaliar em cada migração: dados existentes (backfill), compatibilidade e rollback. Documentar no PR quando não for trivial.
- Migrações são aplicadas por etapa controlada de release, nunca na inicialização da aplicação.
- Histórico é preservado: entidades estratégicas (diagnóstico, recomendação, objetivo, meta, medição) são versionadas ou arquivadas com motivo/autor, não sobrescritas nem apagadas fisicamente.
