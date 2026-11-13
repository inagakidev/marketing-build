# Briefing Inteligente

Ferramenta interna para coleta adaptativa de briefings de clientes, com diagnóstico automático gerado por um motor de regras determinístico (sem IA generativa nesta fase). Uma administradora cadastra clientes e gera links únicos de briefing; cada cliente responde um formulário que se ajusta ao tipo de negócio dele, e a administradora recebe um diagnóstico pronto (sinais de alerta + pontuação por categoria) assim que ele é enviado.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend + Backend | Next.js 16 (App Router) + TypeScript, projeto único full-stack |
| UI | Tailwind CSS + shadcn/ui |
| Banco de dados | PostgreSQL (local via Docker; Supabase em produção) |
| ORM | Prisma 7 |
| Autenticação | Supabase Auth (usuário administrador único) |
| PDF | Playwright (renderiza a própria página do briefing e exporta) |
| Testes | Vitest (unitários) + Vitest contra Postgres real (integração) |

Não há um servidor de API separado: o "backend" é a camada de rotas do Next (`src/app/api/**/route.ts`), rodando no mesmo processo do frontend. Não existe integração com LLM/IA generativa nesta versão — todo o diagnóstico é código determinístico em `src/core`.

## Pré-requisitos

- Node.js 20+ (testado com Node 24)
- Docker (para o Postgres local) — ou uma connection string de um Postgres já existente
- Uma conta Supabase (opcional para desenvolver; obrigatória para login real)

## Setup do zero

```bash
# 1. Instalar dependências
npm install

# 2. Copiar o template de variáveis de ambiente
cp .env.example .env

# 3. Subir o Postgres local
npm run db:up

# 4. Rodar as migrations e o client do Prisma
npm run db:migrate

# 5. Popular o catálogo de perguntas (núcleo fixo + ramificações por tipo de negócio)
npm run db:seed

# 6. Criar a conta da administradora
npm run db:seed:admin

# 7. Subir a aplicação
npm run dev
```

Abra [http://localhost:3000/admin](http://localhost:3000/admin).

Se `NEXT_PUBLIC_SUPABASE_URL` ainda não estiver preenchida no `.env`, o painel libera acesso sem login enquanto `DEV_ADMIN_EMAIL` estiver definido — só para desenvolver antes de configurar o Supabase de verdade (veja abaixo). Sem Supabase configurado e sem `DEV_ADMIN_EMAIL`, o login por senha não funciona.

Para ter um cliente e um link de briefing de exemplo sem passar pelo painel:

```bash
npm run dev:data
```

O script imprime o link público (`/briefing/<token>`) no terminal.

## Variáveis de ambiente

Todas estão documentadas com comentários em `.env.example`. Resumo:

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Connection string do Postgres. Local por padrão (`docker-compose.yml`); trocar por uma URI do Supabase migra o banco sem mudar código. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Credenciais públicas do Supabase Auth (Settings → API do seu projeto). |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada, usada só no servidor pelo seed para criar a administradora no Supabase Auth. **Nunca** expor ao cliente. |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Dados usados por `npm run db:seed:admin` para criar o único usuário do MVP. |
| `NEXT_PUBLIC_APP_URL` | Base pública da aplicação — monta o link do briefing e é para onde o Playwright navega ao gerar o PDF. |
| `BRIEFING_LINK_TTL_DAYS` | Validade padrão, em dias, de um link de briefing recém-criado. |
| `DEV_ADMIN_EMAIL` | Bypass de login em desenvolvimento. Só funciona com Supabase **não** configurado; some assim que `NEXT_PUBLIC_SUPABASE_URL` é preenchida. Deixe vazio para exigir login sempre. |
| `CHROMIUM_EXECUTABLE_PATH` | Caminho do Chromium já instalado, para distros onde `playwright install` não funciona. |

### Configurando o Supabase (login real)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Copie `Project URL`, `anon public key` e `service_role key` (Settings → API) para o `.env`.
3. Troque `DATABASE_URL` pela connection string do Postgres do projeto (Settings → Database → Connection string → URI) — só essa linha muda, o schema é o mesmo.
4. Rode `npm run db:migrate` e `npm run db:seed:admin` novamente apontando para o Supabase — isso cria a administradora tanto no Supabase Auth quanto na tabela local `users`, com o vínculo entre os dois.
5. Apague/deixe vazio o `DEV_ADMIN_EMAIL`.

> **Quem pode entrar.** Estar autenticado no Supabase não basta: só acessa o painel quem já existe na tabela `users` (criado por `db:seed:admin`). Uma conta criada apenas no Supabase — inclusive pelo signup público dele — vê a tela "Esta conta não tem acesso ao painel". Nenhum usuário é criado a partir de um login. Recomenda-se também desligar o signup público em *Authentication → Providers → Email* no Supabase. Política provisória até os convites da Fase 1 (decisão D3 em `docs/decisoes.md`).

## Como a API funciona

Cada rota vive em `src/app/api/**/route.ts` e segue o mesmo formato: recebe a requisição, chama uma função de `src/server/*.ts` (acesso a banco via Prisma) e/ou `src/core/*.ts` (motor de regras, puro e sem I/O), e devolve JSON.

### Rotas autenticadas (painel da administradora)

Protegidas por `src/proxy.ts` (middleware do Next 16) + `requireUser`/`getSessionUser` em cada rota — a checagem existe nos dois lugares de propósito, porque o proxy não cobre toda navegação interna.

As rotas que alteram dados (e o PDF) também recusam requisições de outra origem com `403` (`src/server/security/origin.ts`), como proteção contra CSRF.

| Rota | Método | Função |
|---|---|---|
| `/api/clients` | `GET`, `POST` | Listar clientes / cadastrar cliente |
| `/api/clients/[id]` | `GET`, `PATCH`, `DELETE` | Detalhe, edição e remoção de um cliente |
| `/api/briefings` | `POST` | Criar um briefing (gera o token único do link) para um cliente |
| `/api/briefings/[id]` | `GET` | Detalhe processado do briefing: respostas por categoria, sinais e diagnóstico |
| `/api/briefings/[id]/reprocess` | `POST` | Recalcula sinais/diagnóstico com as regras atuais (ação explícita — o resultado gravado no envio não muda sozinho) |
| `/api/briefings/[id]/pdf` | `GET` | Gera e baixa o PDF do briefing (Playwright renderiza `/print/briefing/[id]`) |

### Rotas públicas (o cliente respondendo, sem login)

Autenticadas apenas pelo token opaco na URL — a única credencial do respondente.

Têm rate limiting por IP (e o PDF, por usuário), com contador no próprio Postgres (`src/server/security/rateLimit.ts`, tabela `rate_limit_buckets`). Ao estourar o limite, a resposta é `429` com `Retry-After`. Os limites ficam em `RATE_LIMITS` (`rateLimitRules.ts`).

| Rota | Método | Função |
|---|---|---|
| `/api/public/briefing/[token]` | `GET` | Carrega o formulário: perguntas visíveis para o `businessType` já respondido + respostas salvas até agora |
| `/api/public/briefing/[token]/answers` | `PUT` | Autosave: grava um lote de respostas (debounce no cliente agrupa a rajada de digitação num único PUT) |
| `/api/public/briefing/[token]/submit` | `POST` | Envio final: roda o motor de sinais e o diagnóstico, muda o status do briefing e trava novas edições |

### O motor de regras (`src/core`)

Não depende de Next, Prisma ou Supabase — recebe objetos simples (`EvalContext`) e devolve objetos simples, o que permite testá-lo sem banco (é onde ficam os 130+ testes unitários). Três peças:

- **Visibilidade** (`core/visibility.ts`): decide quais perguntas aparecem, avaliando a `visibilityRule` (JSON) de cada `Question` contra as respostas já dadas. A ramificação por tipo de negócio é dado, não `if/else` no código.
- **Sinais** (`core/signals/rules/*.ts`): funções puras `(ctx) => Signal | null`, uma por regra (`vague_goal`, `broad_audience`, etc.), registradas em `core/signals/registry.ts`.
- **Diagnóstico** (`core/diagnosis/score.ts`): pontua cada categoria a partir dos sinais encontrados e classifica em `green`/`yellow`/`red`/`gray`.

### Geração de PDF

`src/server/pdf.ts` abre um Chromium via Playwright, navega até `NEXT_PUBLIC_APP_URL/print/briefing/[id]` autenticado (reaproveita o cookie de sessão da requisição) e exporta a página renderizada para PDF — o mesmo layout que aparece na tela, sem template duplicado.

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a aplicação em desenvolvimento (Turbopack) |
| `npm run build` | Gera o client do Prisma e faz o build de produção |
| `npm run start` | Serve o build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Testes unitários (Vitest, sem banco) |
| `npm run test:db` | Testes de integração contra Postgres real (exige `npm run db:up`) |
| `npm run db:up` / `db:down` | Sobe/derruba o Postgres local (Docker) |
| `npm run db:migrate` | Aplica migrations do Prisma |
| `npm run db:reset` | Reseta o banco local e reaplica migrations + seed (destrutivo) |
| `npm run db:seed` | Popula o catálogo de perguntas |
| `npm run db:seed:admin` | Cria/atualiza a conta da administradora |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run dev:data` | Cria um cliente + briefing de exemplo e imprime o link público |

## Testes

```bash
npm test          # unitários — motor de regras, visibilidade, diagnóstico, textos
npm run db:up
npm run test:db   # integração — exercita as rotas de servidor contra Postgres real
```

Antes de considerar uma mudança pronta, o gate completo (ver `AGENTS.md`) é:

```bash
npm run lint && npm run typecheck && npm test && npm run test:db && npm run build
```

## Deploy

Alvo é a Vercel. O Postgres de produção é o do Supabase (mesma `DATABASE_URL`, sem mudança de schema). Antes do primeiro deploy, rode as migrations e os dois seeds (`db:seed` e `db:seed:admin`) apontando para o banco de produção.
