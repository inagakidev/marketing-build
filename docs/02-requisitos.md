# Briefing Inteligente — Documento de Requisitos

> **Versão:** 1.0  
> **Status:** Requisitos do MVP + requisitos necessários para produção  
> **Data:** 12/11/2026  
> **Produto:** Briefing Inteligente — coleta adaptativa de briefing de marketing com diagnóstico determinístico

Este documento define **o que o produto precisa fazer**, **quais regras precisa respeitar** e **quais critérios de qualidade precisa cumprir**. Ele serve como contrato entre produto, desenvolvimento, operação e segurança.

Prioridades usadas: **Must** (obrigatório no MVP), **Should** (importante, pode entrar no próximo ciclo), **Could** (desejável), **Won’t** (fora de escopo agora).

---

## 1. Objetivo e escopo

### 1.1 Objetivo
Permitir que uma administradora de marketing cadastre clientes, envie um briefing adaptativo por link público, receba respostas completas e obtenha um diagnóstico determinístico por categoria, com exportação em PDF.

### 1.2 Escopo funcional
- Autenticação e autorização da administradora.
- Gestão de clientes.
- Criação e ciclo de vida de briefings e links.
- Formulário público adaptativo com autosave.
- Motor de sinais e diagnóstico.
- Painel de leitura e PDF.
- Operação, segurança, privacidade e qualidade.

### 1.3 Fora de escopo
IA generativa, envio automático de e-mail, multiusuário com papéis, billing, integrações com CRM, aplicativo nativo, white-label e gestão visual do catálogo de perguntas.

---

## 2. Atores e permissões

| Ator | Autenticação | Pode fazer | Não pode fazer |
|---|---|---|---|
| **Administradora** | Supabase Auth + registro local `User` | Gerenciar clientes, criar briefings, ler diagnósticos, reprocessar, exportar PDF | Acessar dados de outra conta; criar contas públicas |
| **Respondente** | Token opaco na URL | Abrir o formulário, salvar respostas, enviar o briefing | Ver diagnóstico, dados internos, outros briefings; editar após o envio |
| **Sistema** | Interno | Avaliar visibilidade, executar regras, calcular diagnóstico, gerar PDF | Expor segredos ou dados internos ao browser |
| **Visitante** | Nenhuma | Ver tela de link inválido/expirado | Acessar qualquer dado |

**Premissa de segurança:** apenas uma conta administrativa deve operar o produto no MVP. O modelo de dados é multiusuário, mas o cadastro de administradoras é feito por seed/operação, nunca por tela pública.

---

## 3. Requisitos funcionais

### 3.1 Autenticação e acesso

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| **RF-01** | A administradora entra com e-mail e senha via Supabase Auth. | Must | Credenciais válidas criam sessão e redirecionam para `/admin`; inválidas exibem mensagem genérica. |
| **RF-02** | O acesso ao painel exige sessão válida no servidor, não apenas no proxy. | Must | Acessar `/admin` sem sessão redireciona para `/login`; chamadas de API administrativas retornam 401. |
| **RF-03** | Não existe cadastro público de administradora. | Must | Nenhuma rota pública cria `User`. O seed é a única forma de provisionar acesso. |
| **RF-04** | Apenas e-mails autorizados podem virar administradores. | Must | Uma conta Supabase não autorizada recebe 401/403 e não cria registro local nem acessa dados. |
| **RF-05** | O destino pós-login é interno e seguro. | Must | `redirect` só aceita caminhos iniciados por `/`; URLs externas ou `//` caem em `/admin`. |
| **RF-06** | A administradora consegue encerrar a sessão. | Should | Ação de logout limpa a sessão e volta para `/login`. |

### 3.2 Gestão de clientes

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| **RF-07** | Cadastrar cliente com nome, e-mail, telefone, tipo de projeto e notas internas. | Must | Nome e e-mail válidos são obrigatórios; cliente aparece na lista. |
| **RF-08** | Editar cliente. | Must | Alterações persistem e refletem na listagem e no detalhe. |
| **RF-09** | Excluir cliente com confirmação. | Must | Exclusão remove o cliente e, em cascata, briefings, respostas, sinais e diagnósticos. |
| **RF-10** | Listar clientes com o briefing mais recente e status. | Must | A lista mostra nome, e-mail, tipo de negócio, status e data. |
| **RF-11** | Filtrar clientes por status. | Should | Filtro considera o briefing mais recente e não esconde clientes com briefings relevantes. |
| **RF-12** | Buscar e paginar clientes. | Should | Busca por nome/e-mail; paginação estável com volume crescente. |

### 3.3 Briefing e link público

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| **RF-13** | Criar um briefing para um cliente. | Must | O briefing nasce como `awaiting_response`, com token único e prazo. |
| **RF-14** | Gerar link público a partir do token. | Must | Link completo é exibido/copiado; token não é derivado de id, nome ou e-mail. |
| **RF-15** | Aplicar prazo de validade configurável. | Must | Link expirado retorna tela específica e não aceita respostas. |
| **RF-16** | Distinguir link inválido, expirado e já enviado. | Must | Cada caso tem status e mensagem próprios (404, 410, tela de já enviado). |
| **RF-17** | Revogar um link antes do envio. | Should | Link revogado passa a retornar estado de inválido/expirado e não aceita autosave. |
| **RF-18** | Regenerar o token de um briefing aberto. | Should | Token antigo deixa de funcionar; novo link é exibido. |
| **RF-19** | Reenviar o link ao cliente. | Should | Ação registra data/hora do reenvio e permite copiar o link novamente. |
| **RF-20** | Impedir edição após o envio. | Must | Qualquer autosave/submit após `ready_for_review` é rejeitado sem alterar dados. |
| **RF-21** | Permitir múltiplos briefings por cliente. | Must | Cada briefing tem seu próprio token, status e diagnóstico. |

### 3.4 Formulário público

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| **RF-22** | Exibir boas-vindas com número de etapas e tempo estimado. | Must | Tela inicial mostra cliente, remetente, quantidade de etapas e avisos de autosave. |
| **RF-23** | Organizar perguntas em etapas por categoria. | Must | Cada etapa tem no máximo 6 perguntas; categorias maiores são divididas. |
| **RF-24** | Ramificar perguntas pelo tipo de negócio. | Must | Escolher `local_business`, `ecommerce`, `info_product`, `freelancer` ou `b2b_service` libera apenas o bloco correspondente. |
| **RF-25** | Respeitar visibilidade condicional por respostas anteriores. | Must | Uma pergunta só aparece se sua regra for verdadeira no momento da renderização. |
| **RF-26** | Ignorar respostas de perguntas invisíveis no motor. | Must | Trocar o tipo de negócio não faz sinais dispararem por respostas órfãs. |
| **RF-27** | Renderizar tipos de resposta suportados. | Must | Texto curto, texto longo, escolha única e múltipla escolha funcionam em mobile e desktop. |
| **RF-28** | Salvar automaticamente cada alteração. | Must | Após 600 ms de inatividade, um lote é enviado; falha de rede tenta novamente com espera crescente. |
| **RF-29** | Retomar respostas salvas. | Must | Fechar e reabrir o link restaura as respostas já gravadas. |
| **RF-30** | Impedir avanço com obrigatórias em branco na etapa. | Must | Campos pendentes são destacados e a etapa não avança. |
| **RF-31** | Revisar antes de enviar. | Must | Tela de revisão mostra quantas perguntas foram respondidas e permite voltar. |
| **RF-32** | Enviar o briefing. | Must | Envio válido fecha o briefing, gera diagnóstico e mostra confirmação. |
| **RF-33** | Tratar envio duplicado como sucesso idempotente. | Must | Duplo clique ou retorno pelo histórico não gera erro nem duplica diagnóstico. |
| **RF-34** | Informar crescimento do formulário após a ramificação. | Must | Um aviso explica que o número de etapas aumentou por causa do tipo de negócio. |
| **RF-35** | Funcionar sem login para o respondente. | Must | O token é a única credencial; nenhuma conta é criada. |

### 3.5 Motor de diagnóstico

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| **RF-36** | Executar regras de sinal determinísticas. | Must | As 9 regras registradas produzem sinais previsíveis e testáveis. |
| **RF-37** | Classificar sinais por severidade. | Must | Cada sinal é `light`, `moderate` ou `strong`, com penalidade de 15, 25 ou 40 pontos. |
| **RF-38** | Calcular diagnóstico nas 5 categorias. | Must | Posicionamento, Público, Oferta, Presença digital e Marketing atual recebem score e status. |
| **RF-39** | Marcar categoria como cinza quando faltar obrigatória visível. | Must | Categoria sem dado obrigatório tem score nulo e status `gray`. |
| **RF-40** | Rastrear sinal até as respostas de origem. | Must | `sourceAnswerIds` contém IDs de respostas existentes. |
| **RF-41** | Montar lista de problemas e oportunidades. | Must | Problemas vêm de categorias vermelhas; oportunidades, de verdes e do que já funcionou. |
| **RF-42** | Gravar diagnóstico no envio. | Must | Sinais e diagnósticos persistem e são lidos no painel e no PDF. |
| **RF-43** | Reprocessar diagnóstico por ação explícita. | Must | Recalcular apaga e recria sinais/diagnósticos de forma idempotente. |
| **RF-44** | Informar por que uma categoria ficou cinza. | Must | Painel e PDF mostram as perguntas obrigatórias faltantes. |
| **RF-45** | Versionar regras e catálogo por diagnóstico. | Should | É possível saber com qual versão de regras/catálogo um diagnóstico foi gerado. |

### 3.6 Painel administrativo

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| **RF-46** | Abrir detalhe de um briefing. | Must | Exibe cliente, status, tipo de negócio, contagem de respostas e datas. |
| **RF-47** | Exibir respostas por categoria. | Must | Perguntas e respostas aparecem na ordem do catálogo, com valores legíveis. |
| **RF-48** | Exibir respostas brutas. | Must | Aba mostra chave técnica, valor cru e data de resposta. |
| **RF-49** | Exibir semáforo, problemas e oportunidades. | Must | Painel mostra as 5 categorias, problemas ordenados por gravidade e oportunidades. |
| **RF-50** | Reprocessar pelo painel. | Must | Botão dispara recálculo, atualiza a tela e informa a quantidade de sinais. |
| **RF-51** | Aprovar um briefing revisado. | Should | Ação muda status para `approved` e registra quem/quando. |
| **RF-52** | Rejeitar/devolver um briefing para ajuste. | Could | Administradora pode solicitar correção e liberar novo preenchimento. |
| **RF-53** | Ver histórico de ações. | Should | Criação, envio, reprocessamento, aprovação e exclusão ficam registrados. |

### 3.7 PDF e saída

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| **RF-54** | Exportar briefing em PDF. | Must | PDF contém cabeçalho, diagnóstico, problemas, oportunidades e respostas. |
| **RF-55** | Usar a mesma fonte de dados do painel. | Must | PDF não mantém template duplicado; renderiza a página de impressão. |
| **RF-56** | Nomear o arquivo de forma segura. | Must | Nome sem acento, espaço ou caractere de caminho. |
| **RF-57** | Proteger o PDF por sessão. | Must | A rota exige administradora autenticada e valida a propriedade do briefing. |
| **RF-58** | Limitar tempo/custo de geração. | Should | Geração tem timeout e limite de execução; falhas são registradas. |

### 3.8 Privacidade e ciclo de vida dos dados

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| **RF-59** | Não expor PII em rota pública. | Must | Payload público contém apenas nome do cliente, nome do remetente, perguntas e respostas. |
| **RF-60** | Exportar dados de um titular/cliente. | Must | É possível gerar arquivo com dados do cliente e respostas. |
| **RF-61** | Excluir dados de um titular/cliente. | Must | Exclusão remove dados pessoais e respectivas respostas/diagnósticos. |
| **RF-62** | Aplicar retenção configurável. | Should | Briefings e respostas expiram ou são anonimizados após prazo definido. |
| **RF-63** | Registrar consentimento do respondente. | Should | Antes de responder, o titular aceita o aviso de privacidade. |
| **RF-64** | Evitar indexação de links privados. | Must | Páginas `/briefing/*`, `/admin/*` e `/print/*` têm `noindex` e `Referrer-Policy` adequada. |

---

## 4. Regras de negócio

| ID | Regra | Detalhe |
|---|---|---|
| **RN-01** | Visibilidade é dado | A condição de exibição vive em `Question.visibilityRule`; não há `if` por tipo de negócio no código. |
| **RN-02** | Regra só olha o passado | Uma pergunta só pode depender de respostas de perguntas anteriores na ordem do catálogo. |
| **RN-03** | Invisível não conta | O motor filtra respostas de perguntas invisíveis antes de avaliar sinais e diagnóstico. |
| **RN-04** | Obrigatória só vale se visível | Perguntas de outras ramificações não bloqueiam o envio. |
| **RN-05** | Branco apaga | Resposta vazia remove o registro em vez de gravar string vazia. |
| **RN-06** | Upsert por par | Existe no máximo uma resposta por `(briefingId, questionId)`. |
| **RN-07** | Tipo de negócio é espelhado | `Briefing.businessType` acompanha a resposta de `business_type`. |
| **RN-08** | Ramificadas são opcionais | Aprofundamentos não derrubam categoria para cinza por falta de resposta. |
| **RN-09** | Token é credencial | Token único, opaco, com entropia alta e sem relação com dados do cliente. |
| **RN-10** | Expiração bloqueia escrita | Link expirado não aceita autosave nem envio. |
| **RN-11** | Envio é definitivo | Após `ready_for_review`, o briefing não aceita novas respostas. |
| **RN-12** | Transição de status é explícita | `awaiting_response → in_progress → ready_for_review`; `approved` só por ação da administradora. |
| **RN-13** | Diagnóstico nasce no envio | Não é recalculado automaticamente a cada leitura. |
| **RN-14** | Reprocessamento é idempotente | Apaga e recria sinais/diagnósticos de um briefing em transação. |
| **RN-15** | Score por penalidade | 100 − (15 por leve + 25 por moderado + 40 por forte), limitado a 0–100. |
| **RN-16** | Faixas de status | Verde ≥ 80; amarelo 50–79; vermelho < 50; cinza quando falta obrigatória visível. |
| **RN-17** | Cinza vence sinal | Se falta obrigatória, a categoria é cinza mesmo que existam sinais. |
| **RN-18** | Rastreabilidade | Todo sinal referencia respostas existentes do próprio briefing. |
| **RN-19** | Isolamento por dono | Toda consulta administrativa filtra por `userId`; id de outra conta não confirma existência. |
| **RN-20** | Dados internos são privados | Notas internas, e-mail, telefone e diagnóstico nunca vão para o formulário público. |
| **RN-21** | Catálogo é global | Perguntas não são duplicadas por briefing; mudanças no catálogo afetam todos. |
| **RN-22** | Seed é idempotente | Perguntas são upsert por `key`; perguntas obsoletas só são removidas se não tiverem respostas. |
| **RN-23** | Status inicial | Briefing criado nasce como `awaiting_response`; `draft` existe no enum, mas não é usado no fluxo atual. |
| **RN-24** | Uma conta por administradora | O produto não permite cadastro público nem múltiplos administradores no MVP. |

### 4.1 Máquina de estados do briefing

```
                 criar
                   │
                   ▼
          awaiting_response ──────────────┐
                   │                      │
        primeira resposta                 │
                   ▼                      │
             in_progress ────────┐        │
                   │             │        │
                enviar       expirar/revogar
                   │             │        │
                   ▼             ▼        ▼
          ready_for_review    (link bloqueado)
                   │
                aprovar
                   ▼
               approved
```

Regras adicionais recomendadas:
- O envio só é válido a partir de `awaiting_response` ou `in_progress`.
- `expiresAt` não pode ser alterado retroativamente sem ação explícita.
- `submittedAt` é gravado uma única vez.
- `approvedAt` e `approvedBy` devem existir quando o status for `approved`.

---

## 5. Requisitos não funcionais

### 5.1 Segurança

| ID | Requisito | Meta / critério |
|---|---|---|
| **RNF-01** | Toda rota administrativa valida sessão no servidor. | Nenhuma rota depende só do proxy. |
| **RNF-02** | Apenas e-mails autorizados podem ser administradores. | Allowlist ou desativação de signup no Supabase; teste cobrindo conta não autorizada. |
| **RNF-03** | Tokens públicos têm entropia suficiente. | ≥ 120 bits; 24 caracteres em alfabeto sem ambíguos. |
| **RNF-04** | Rotas públicas têm rate limiting. | Limite por IP + token para leitura, autosave e envio; retorno 429 com `Retry-After`. |
| **RNF-05** | Mutações administrativas têm proteção CSRF/origem. | Validar `Origin`/`Referer` ou usar token CSRF; cookies `HttpOnly`, `Secure`, `SameSite` adequados. |
| **RNF-06** | Cabeçalhos de segurança estão presentes. | CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`. |
| **RNF-07** | Entradas são validadas na borda. | Zod para forma; validação semântica contra catálogo para respostas. |
| **RNF-08** | Segredos nunca chegam ao cliente. | `SUPABASE_SERVICE_ROLE_KEY` só no servidor; nenhuma chave em bundle. |
| **RNF-09** | Erros internos não vazam detalhes. | 500 com mensagem genérica; detalhe apenas em log. |
| **RNF-10** | Páginas privadas não são indexáveis. | `noindex, nofollow` e `Referrer-Policy: no-referrer`. |
| **RNF-11** | Dependências são verificadas. | `npm audit` no CI; atualização periódica. |
| **RNF-12** | Acesso administrativo é auditável. | Log de login, criação, envio, reprocessamento, aprovação e exclusão. |

### 5.2 Privacidade e LGPD

| ID | Requisito | Meta / critério |
|---|---|---|
| **RNF-13** | Base legal e transparência. | Aviso de privacidade no formulário; finalidade e retenção informadas. |
| **RNF-14** | Minimização. | Coletar só o necessário; telefone e notas internas são opcionais. |
| **RNF-15** | Direito de acesso/exportação. | Exportar dados do cliente e respostas em formato legível. |
| **RNF-16** | Direito de exclusão. | Excluir/anonimizar dados pessoais mediante solicitação. |
| **RNF-17** | Retenção definida. | Prazo configurável; expiração/anonimização automática. |
| **RNF-18** | Segregação por tenant. | Toda consulta filtra pelo `userId`; testes de isolamento. |
| **RNF-19** | Criptografia em trânsito e repouso. | TLS obrigatório; Postgres gerenciado com criptografia. |
| **RNF-20** | Suboperadores documentados. | Supabase, Vercel e provedor de e-mail registrados. |
| **RNF-21** | Dados sensíveis fora de logs. | Não logar respostas livres, e-mail, telefone ou notas. |

### 5.3 Desempenho

| ID | Requisito | Meta |
|---|---|---|
| **RNF-22** | Primeira tela pública útil no mobile. | LCP < 2,5 s em 4G; HTML renderizado no servidor. |
| **RNF-23** | Autosave responsivo. | p95 < 500 ms no servidor; debounce de 600 ms no cliente. |
| **RNF-24** | Envio do briefing. | < 2 s para briefings típicos. |
| **RNF-25** | Painel de briefing. | < 1 s para até 51 respostas. |
| **RNF-26** | Geração de PDF. | < 30 s; timeout explícito; sem bloquear o servidor. |
| **RNF-27** | Consultas indexadas. | Índices por dono, briefing, status e par resposta/pergunta. |

### 5.4 Disponibilidade e operação

| ID | Requisito | Meta |
|---|---|---|
| **RNF-28** | Disponibilidade do MVP. | 99,5% mensal. |
| **RNF-29** | Backup do banco. | RPO ≤ 24 h; RTO ≤ 4 h. |
| **RNF-30** | Health check. | Endpoint interno verifica aplicação e banco. |
| **RNF-31** | Migrações controladas. | `prisma migrate deploy` no pipeline; nunca automático em runtime. |
| **RNF-32** | Deploy reproduzível. | Build gera Prisma Client; variáveis validadas no start. |
| **RNF-33** | Recuperação de falha de PDF. | Falha retorna erro claro e registra log; não derruba o briefing. |

### 5.5 Escalabilidade

| ID | Requisito | Meta |
|---|---|---|
| **RNF-34** | Volume inicial. | Suportar 1.000 clientes, 10.000 briefings e 100 formulários simultâneos. |
| **RNF-35** | Crescimento sem mudança de schema. | Índices e paginação permitem crescer 10×. |
| **RNF-36** | Isolamento de carga. | PDF não compartilha recurso crítico com o formulário público. |

### 5.6 Acessibilidade e compatibilidade

| ID | Requisito | Meta |
|---|---|---|
| **RNF-37** | Acessibilidade. | WCAG 2.1 AA: teclado, foco, contraste, rótulos, mensagens de erro e leitores de tela. |
| **RNF-38** | Mobile-first. | Funciona em telas de 320 px; alvos de toque ≥ 44 px. |
| **RNF-39** | Navegadores. | Últimas 2 versões de Chrome, Safari, Firefox e Edge; iOS e Android atuais. |
| **RNF-40** | Movimento reduzido. | Respeitar `prefers-reduced-motion`. |
| **RNF-41** | Idioma. | pt-BR no MVP; textos centralizados para futura internacionalização. |

### 5.7 Qualidade e manutenção

| ID | Requisito | Meta |
|---|---|---|
| **RNF-42** | Núcleo puro. | `src/core` não importa Next, Prisma ou Supabase. |
| **RNF-43** | Cobertura do núcleo. | ≥ 80% de linhas/branches em `src/core`. |
| **RNF-44** | Pipeline obrigatório. | lint + typecheck + testes unitários + integração em banco efêmero. |
| **RNF-45** | Testes de API. | Rotas administrativas e públicas cobertas, incluindo 401, 404, 410, 422 e 429. |
| **RNF-46** | Testes E2E. | Fluxo completo: criar cliente → criar briefing → responder → enviar → ver diagnóstico → PDF. |
| **RNF-47** | Observabilidade. | Logs estruturados com request id; métricas de erro, latência e funil. |
| **RNF-48** | Erros rastreáveis. | Ferramenta de error tracking com contexto, sem PII. |
| **RNF-49** | Documentação viva. | README, docs de produto, requisitos e inspeção atualizados a cada ciclo. |
| **RNF-50** | Configuração validada. | Schema de env no start; falha rápida e mensagem clara. |

---

## 6. Requisitos de dados

### 6.1 Entidades e propriedade

| Entidade | Dono | Dados pessoais | Retenção sugerida |
|---|---|---|---|
| `User` | Sistema | Nome, e-mail | Enquanto a conta existir |
| `Client` | `User` | Nome, e-mail, telefone, notas | Enquanto o contrato/relação existir |
| `Briefing` | `Client` | Token, datas, status | 12–24 meses após o envio |
| `Answer` | `Briefing` | Respostas livres (podem conter PII) | Junto do briefing ou anonimização |
| `Signal` | `Briefing` | Descrição derivada | Junto do briefing |
| `Diagnosis` | `Briefing` | Score e status | Junto do briefing |
| `Question` | Sistema | Nenhum | Enquanto o catálogo existir |

### 6.2 Restrições e índices mínimos

- `users.email` único; `users.supabaseAuthId` único.
- `briefings.token` único.
- `answers (briefingId, questionId)` único.
- `signals (briefingId, code)` único.
- `diagnoses (briefingId, category)` único.
- Índices por `clients.userId`, `briefings.clientId`, `briefings.status`, `answers.briefingId`, `signals.briefingId`, `diagnoses.briefingId`.
- Recomendados: `briefings (clientId, createdAt)`, `briefings (status, createdAt)`, `clients (userId, createdAt)`, `questions (category, order)` com unicidade ou ordenação determinística.

### 6.3 Integridade

- Envio, fechamento e gravação do diagnóstico devem ser atômicos.
- Autosave não pode sobrescrever briefing fechado.
- `businessType` deve ser sempre consistente com a resposta de `business_type`.
- Diagnósticos devem guardar as perguntas faltantes que causaram cinza.
- Sinais e diagnósticos devem guardar a versão de regras/catálogo usada.
- Exclusão de cliente deve ser transacional e auditável.

### 6.4 Migrações e seeds

- Migrações versionadas e aplicadas por `prisma migrate deploy`.
- Seed do catálogo idempotente por `key`.
- Seed da administradora idempotente por e-mail.
- Nenhum seed destrutivo em produção sem confirmação explícita.

---

## 7. Integrações e contratos externos

### 7.1 Dependências de infraestrutura

| Integração | Uso | Requisito |
|---|---|---|
| **PostgreSQL** | Dados da aplicação | Conexão por `DATABASE_URL`; migrações controladas; backup. |
| **Supabase Auth** | Login da administradora | URL, anon key e service role key; signup público desativado ou restrito. |
| **Playwright/Chromium** | Geração de PDF | Chromium disponível no ambiente; fallback para runtime compatível. |
| **Vercel** (alvo) | Hospedagem | Funções compatíveis; limite de duração; segredos configurados. |

### 7.2 Contratos de API

#### Rotas administrativas (cookie de sessão)

| Método | Rota | Função | Erros esperados |
|---|---|---|---|
| GET | `/api/clients` | Listar clientes | 401 |
| POST | `/api/clients` | Criar cliente | 400, 401 |
| GET | `/api/clients/[id]` | Detalhe do cliente | 401, 404 |
| PATCH | `/api/clients/[id]` | Editar cliente | 400, 401, 404 |
| DELETE | `/api/clients/[id]` | Excluir cliente | 401, 404 |
| POST | `/api/briefings` | Criar briefing e link | 400, 401, 404 |
| GET | `/api/briefings/[id]` | Detalhe processado | 401, 404 |
| POST | `/api/briefings/[id]/reprocess` | Recalcular diagnóstico | 401, 404 |
| GET | `/api/briefings/[id]/pdf` | Baixar PDF | 401, 404, 500 |

#### Rotas públicas (token)

| Método | Rota | Função | Erros esperados |
|---|---|---|---|
| GET | `/api/public/briefing/[token]` | Carregar formulário | 404, 410 |
| PUT | `/api/public/briefing/[token]/answers` | Autosave em lote | 400, 404, 410, 413, 429 |
| POST | `/api/public/briefing/[token]/submit` | Enviar briefing | 404, 410, 422, 429 |

#### Formato de erro recomendado

```json
{
  "error": "Mensagem legível.",
  "code": "ANSWER_VALIDATION_FAILED",
  "issues": {
    "q:ideal_client": "Resposta não corresponde a uma opção válida."
  },
  "requestId": "req_123"
}
```

---

## 8. Critérios de aceite do MVP

### 8.1 Fluxo principal
- [ ] Administradora autenticada cria cliente.
- [ ] Administradora cria briefing e copia o link.
- [ ] Respondente abre o link, escolhe o tipo de negócio e vê as perguntas específicas.
- [ ] Respostas são salvas automaticamente e restauradas ao reabrir.
- [ ] Obrigatórias impedem avanço e envio.
- [ ] Envio fecha o briefing, gera sinais e diagnóstico.
- [ ] Painel mostra respostas, semáforo, problemas e oportunidades.
- [ ] PDF é gerado com o mesmo conteúdo.
- [ ] Link enviado não aceita nova edição.
- [ ] Link expirado, inválido e já enviado têm telas próprias.

### 8.2 Segurança
- [ ] Nenhuma rota administrativa responde sem sessão.
- [ ] Conta Supabase não autorizada não vira administradora.
- [ ] Link de outra conta não é acessível.
- [ ] Payload público não contém PII interna.
- [ ] Autosave e envio têm rate limit.
- [ ] Cabeçalhos de segurança e `noindex` estão ativos.
- [ ] Nenhum segredo no bundle do cliente.

### 8.3 Qualidade
- [ ] `npm run lint` passa.
- [ ] `npm run typecheck` passa.
- [ ] `npm test` passa.
- [ ] `npm run test:db` passa em banco limpo.
- [ ] Testes cobrem 401, 404, 410, 422 e 429.
- [ ] Há teste E2E do fluxo principal.
- [ ] Núcleo mantém cobertura ≥ 80%.

### 8.4 Operação
- [ ] Variáveis de ambiente validadas no start.
- [ ] Migrações aplicadas no deploy.
- [ ] Health check disponível.
- [ ] Logs estruturados e error tracking ativos.
- [ ] Backup e restauração testados.
- [ ] PDF funciona no ambiente de produção.

### 8.5 Privacidade
- [ ] Aviso de privacidade no formulário.
- [ ] Retenção definida e implementada.
- [ ] Exportação e exclusão de dados disponíveis.
- [ ] Suboperadores documentados.
- [ ] Nenhum PII em logs.

---

## 9. Premissas e restrições

1. O produto é operado por uma única administradora no MVP.
2. O respondente não cria conta; o token é a credencial.
3. O catálogo de perguntas é global e alterado por seed, não por interface.
4. O diagnóstico é determinístico e não usa IA generativa.
5. O banco é PostgreSQL, local em Docker e Supabase em produção.
6. O alvo de hospedagem é Vercel; PDF depende de Chromium.
7. Não há envio automático de e-mail no MVP.
8. O idioma é pt-BR.
9. O produto lida com dados pessoais e precisa de conformidade LGPD antes de operação comercial.

---

## 10. Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Abandono por formulário longo | Média | Alto | Medir funil, reduzir etapas, revisar perguntas opcionais |
| Falso positivo do motor de sinais | Média | Médio | Calibrar regras, manter revisão humana, versionar |
| Conta não autorizada acessando painel | Baixa/Média | Crítico | Allowlist, desativar signup, testes |
| Envio concorrente com autosave | Média | Alto | Transação e transição condicional de status |
| Link vazado | Média | Alto | Expiração, revogação, `noindex`, `no-referrer`, rate limit |
| PDF falhar em serverless | Alta | Médio | Chromium compatível ou worker dedicado |
| Mudança de catálogo quebrar briefing em andamento | Média | Alto | Versionamento/snapshot do catálogo |
| Perda de dados por falha operacional | Baixa | Crítico | Backup, restore testado, migrações controladas |
| Não conformidade LGPD | Média | Crítico | Política, consentimento, retenção, exportação/exclusão |
| Dependência de uma pessoa | Alta | Médio | Documentação, multiusuário futuro, runbooks |

---

## 11. Roadmap de requisitos por fase

### Fase 0 — Correções críticas (agora)
- RF-04, RF-05, RF-20, RF-33, RF-44.
- RNF-02, RNF-04, RNF-05, RNF-06, RNF-10.
- Atomicidade do envio e validação semântica de respostas.

### Fase 1 — Operação confiável
- RF-17, RF-18, RF-19, RF-51, RF-53.
- RNF-13 a RNF-21 (privacidade).
- RNF-30 a RNF-33 (operação).
- Versionamento de catálogo/regras.

### Fase 2 — Experiência e escala
- RF-12, RF-52, RF-59 a RF-63.
- RNF-34 a RNF-36.
- Busca, paginação, aprovação e histórico.

### Fase 3 — Produto expandido
- Multiusuário com papéis.
- Notificações por e-mail.
- Catálogo gerenciável por interface.
- Analytics e benchmarking.
- Assistente opcional de IA com revisão humana.

---

## 12. Definition of Done

Uma entrega só é considerada pronta quando:

- [ ] O requisito tem critério de aceite verificável.
- [ ] Há teste automatizado cobrindo o caminho feliz e os erros relevantes.
- [ ] `lint`, `typecheck` e testes passam no CI.
- [ ] Não introduz regressão de segurança, privacidade ou acessibilidade.
- [ ] Logs e mensagens de erro não expõem PII.
- [ ] Documentação de produto/requisitos/inspeção foi atualizada quando necessário.
- [ ] A mudança funciona em mobile e desktop.
- [ ] A mudança foi validada em ambiente de preview antes de produção.
- [ ] Migrações e variáveis de ambiente foram previstas e documentadas.
- [ ] O impacto operacional (backup, retenção, custo) foi considerado.
