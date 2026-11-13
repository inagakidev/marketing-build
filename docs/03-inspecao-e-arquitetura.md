# Briefing Inteligente — Inspeção Técnica e Arquitetura Evolutiva

> **Versão:** 2.0  
> **Data:** 13/11/2026  
> **Documentos de referência:** `PRODUCT.md` e `02-requisitos.md` — versão 2.0  
> **Base técnica de origem:** inspeção registrada em 12/11/2026, commit `4804a91` + alterações não commitadas do MVP  
> **Objetivo desta revisão:** alinhar a arquitetura técnica à evolução do produto de um sistema de briefing e diagnóstico para uma plataforma de gestão estratégica de marketing em equipes.

---

## 1. Objetivo e leitura deste documento

Este documento reúne duas perspectivas que não devem ser confundidas:

1. **Estado observado:** aquilo que a inspeção técnica anterior registrou sobre o MVP em 12/11/2026.
2. **Arquitetura-alvo:** a estrutura recomendada para sustentar a V1 ampliada descrita em `PRODUCT.md` e `02-requisitos.md`.

A inspeção original foi feita sobre o MVP e não comprova o estado atual do repositório. Portanto, achados, caminhos de arquivos, comandos e métricas abaixo são evidências históricas que precisam ser revalidadas antes de abrir tarefas de implementação.

A arquitetura-alvo é uma proposta de evolução, não uma afirmação de que esses módulos já existem.

### 1.1 Direção arquitetural

O produto passa a organizar o trabalho de marketing em uma jornada:

**Organização → Cliente → Projeto/Campanha → Briefing → Diagnóstico → Recomendações → Objetivos → Ações e tarefas → Indicadores → Resultados → Relatório e aprendizado.**

O briefing permanece como entrada estruturada. Ele não deve se tornar o centro rígido do modelo de dados: diagnóstico, objetivos, tarefas, indicadores, evidências e histórico precisam continuar existindo e evoluindo independentemente de uma versão específica do formulário.

### 1.2 Princípios de decisão

- Preservar o núcleo de domínio puro já identificado no MVP.
- Evitar uma reescrita total: evoluir por módulos e casos de uso.
- Tratar organização como limite de isolamento de dados desde o início.
- Aplicar autorização no servidor e no acesso aos dados, não apenas na interface.
- Registrar histórico das decisões que alteram prioridades, objetivos, resultados e permissões.
- Manter diagnóstico e recomendações determinísticos e explicáveis na V1.
- Não introduzir IA generativa como autoridade de decisão na V1.
- Não antecipar integrações externas antes de estabilizar os fluxos internos.
- Preferir consistência transacional e rastreabilidade a abstrações prematuras.

---

## 2. Resumo executivo

### 2.1 Diagnóstico da base existente

A inspeção de 12/11/2026 registrou uma base de MVP com bons fundamentos:

- domínio separado da infraestrutura em `src/core`;
- regras de visibilidade orientadas a dados;
- motor de sinais organizado por registro;
- diagnóstico determinístico;
- token público com boa entropia;
- autosave e fluxo público funcional;
- testes unitários relevantes para o núcleo;
- separação inicial entre `core`, `server`, `components` e `app`.

Também registrou riscos relevantes de segurança, integridade, privacidade, operação e qualidade. Esses riscos continuam sendo uma lista de verificação importante, mas devem ser confirmados no código antes de serem considerados pendências atuais.

### 2.2 Mudança de escala do produto

A ampliação do escopo muda principalmente quatro aspectos arquiteturais:

| Antes: MVP de briefing | Agora: plataforma estratégica |
|---|---|
| Usuária administradora | Organização com administradores, líderes e membros |
| Cliente ligado ao usuário | Cliente pertencente à organização |
| Briefing como unidade principal | Projeto/campanha como unidade de trabalho |
| Diagnóstico como resultado final | Diagnóstico como entrada para recomendações, objetivos, execução e avaliação |
| Respostas e sinais | Respostas, versões, decisões, ações, tarefas, métricas e evidências |
| Painel de briefings | Visões por organização, cliente, projeto, objetivo e desempenho |

A arquitetura deve acompanhar essa mudança sem transformar o sistema em um CRM completo ou em uma ferramenta genérica de gestão de tarefas.

### 2.3 Principais riscos arquiteturais para a V1

1. **Isolamento multi-organização:** toda consulta e mutação precisa respeitar `organizationId`.
2. **Autorização por papel e escopo:** acesso administrativo, liderança, participação em projeto e permissões específicas precisam ser definidos de forma consistente.
3. **Versionamento:** briefings, perguntas, regras de diagnóstico, recomendações e modelos precisam preservar o contexto histórico.
4. **Integridade de fluxo:** envio, diagnóstico, aprovação e conversão de recomendações em planos precisam ser operações consistentes.
5. **Rastreabilidade:** mudanças estratégicas devem registrar autor, data, justificativa e valores anteriores/novos.
6. **Medição:** conclusão de tarefas não pode ser confundida com alcance de objetivos.
7. **Privacidade:** respostas livres, anexos e dados de contato exigem política de acesso, retenção e exclusão.
8. **Operação:** relatórios, PDF, arquivos e processamento assíncrono precisam ser compatíveis com o ambiente real de deploy.

---

## 3. Estado técnico observado no MVP

> Esta seção preserva a fotografia da inspeção anterior. Não representa uma nova auditoria do repositório.

### 3.1 Pontos fortes registrados

| Área | Evidência registrada | Valor arquitetural |
|---|---|---|
| Domínio | `src/core` sem dependência de Next, Prisma ou Supabase | Regras testáveis e reutilizáveis |
| Formulário | `Question.visibilityRule` e `resolveVisibility` | Ramificação configurável por dados |
| Respostas | Respostas invisíveis ignoradas no processamento | Evita dados condicionais contaminarem o diagnóstico |
| Sinais | `src/core/signals/registry.ts` | Adição de regras com baixo acoplamento |
| Diagnóstico | Pontuação por categoria e estado cinza | Distingue ausência de informação de resultado ruim |
| Rastreabilidade | `Signal.sourceAnswerIds` | Explica a origem de um sinal |
| Reprocessamento | `processAndPersist` transacional | Reprocessamento idempotente no fluxo registrado |
| Link público | Token aleatório de 24 caracteres | Não deriva de dados do cliente |
| UX | Autosave, etapas e estados de erro | Reduz perda de respostas |
| Testes | 133 testes em 7 arquivos na inspeção | Cobertura relevante do núcleo |

### 3.2 Problemas registrados que precisam de revalidação

| ID | Área | Achado histórico | Prioridade histórica |
|---|---|---|---|
| SEC-01 | Autenticação | Auto-provisionamento de usuário sem allowlist | P0 |
| SEC-02 | Autenticação | Redirecionamento de login sem validação de destino | P1 |
| SEC-03 | HTTP | Ausência de verificação de origem/CSRF em mutações administrativas | P1 |
| SEC-04 | HTTP | Ausência de rate limiting nas rotas públicas e PDF | P1 |
| SEC-05 | Privacidade | Ausência de `noindex` e política de `referrer` em páginas privadas | P1 |
| SEC-06 | HTTP | Cabeçalhos de segurança/CSP não configurados | P1 |
| DATA-01 | Integridade | Envio sem atomicidade e com possível corrida com autosave | P0 |
| DATA-02 | Versionamento | Catálogo global sem versão histórica | P0 |
| DATA-03 | Validação | Respostas sem validação semântica suficiente | P1 |
| DATA-04 | Diagnóstico | Perguntas faltantes de categorias cinzas não persistidas | P1 |
| DATA-05 | Fluxo | Ciclo de vida do briefing incompleto | P1 |
| DATA-06 | Consistência | Ordem do diagnóstico dependente da consulta | P1 |
| PERF-01 | Performance | Proxy executando autenticação em rotas públicas | P1 |
| QUAL-04 | Testes | Ausência de testes de API, componentes e E2E | P2 |
| QUAL-05 | CI | Ausência de pipeline de CI | P2 |
| QUAL-06 | Operação | Falta de logs estruturados, métricas e health check | P1 |
| LGPD-01 | Privacidade | Ausência de ciclo de vida completo dos dados pessoais | P1 |
| DEPLOY-01 | Deploy | Estratégia de PDF incompatível com Vercel serverless | P1 |

### 3.3 Regra para transformar achados em tarefas

Antes de implementar uma correção:

1. confirmar se o problema ainda existe no código;
2. identificar se a expansão de produto alterou o contexto;
3. verificar dependências e impacto em dados existentes;
4. definir critério de aceite testável;
5. criar migração reversível quando houver mudança de schema;
6. atualizar este documento e `02-requisitos.md` quando a decisão mudar a arquitetura.

Não usar a tabela histórica como backlog automático sem essa validação.

---

## 4. Arquitetura de domínio proposta

### 4.1 Contextos principais

A proposta organiza o domínio em módulos coesos. Isso não exige microserviços: a recomendação inicial é um **monólito modular**, com uma aplicação e um banco transacional, mantendo limites claros entre módulos.

| Contexto | Responsabilidade | Entidades centrais |
|---|---|---|
| Identity & Access | Identidade, organização, membros, papéis e permissões | User, Organization, Membership, Role, Permission |
| Client Management | Cadastro e histórico contextual de clientes | Client, ClientContact, ClientActivity |
| Project Management | Projetos/campanhas, responsáveis, colaboradores e ciclo de vida | Project, ProjectMember, ProjectStatusHistory |
| Briefing | Convites, formulário público, perguntas, respostas e versões | Briefing, BriefingVersion, QuestionVersion, Answer |
| Diagnosis | Sinais, avaliação por categoria, regras e versões | Signal, Diagnosis, DiagnosisSignal, RuleVersion |
| Recommendations | Recomendações contextualizadas, origem, revisão e priorização | Recommendation, RecommendationSource, RecommendationRevision |
| Planning | Objetivos, planos estratégicos e ações | StrategicPlan, Objective, Action |
| Execution | Tarefas, responsáveis, prazos, dependências e comentários | Task, TaskAssignee, TaskDependency, Comment |
| Measurement | Indicadores, metas, medições, evidências e avaliação | Metric, Target, Measurement, Evidence, ImpactReview |
| Documents | Arquivos associados a clientes e projetos | Document, DocumentVersion |
| Reporting | Consultas, snapshots e exportações de relatórios | ReportDefinition, ReportSnapshot, ExportJob |
| Templates | Modelos reutilizáveis de briefing, diagnóstico, projeto e relatório | Template, TemplateVersion |
| Notifications | Eventos e preferências de notificação | Notification, NotificationPreference |
| Audit | Histórico de ações relevantes e trilha de segurança | AuditEvent |

Os nomes são conceituais. O schema final deve ser definido após revisar o schema Prisma real e os requisitos de cada fluxo.

### 4.2 Limites de responsabilidade

- `Briefing` coleta contexto; não deve armazenar tarefas ou resultados de campanha.
- `Diagnosis` registra uma interpretação versionada das respostas; não deve ser sobrescrito sem histórico.
- `Recommendation` representa uma sugestão estratégica revisável; não é automaticamente uma tarefa.
- `Objective` representa o resultado que se deseja alcançar.
- `Action` representa uma iniciativa ou linha de trabalho para contribuir com o objetivo.
- `Task` representa uma unidade executável de trabalho.
- `Metric` define o que será medido; `Measurement` registra um valor observado em um momento.
- `Evidence` sustenta uma avaliação, sem substituir o dado medido.
- `AuditEvent` registra mudanças relevantes; não deve ser usado como substituto de histórico de domínio.

### 4.3 Fluxo de domínio

```text
Organization
  └── Client
       └── Project / Campaign
            ├── Briefing
            │    ├── BriefingVersion
            │    ├── Answers
            │    └── Diagnosis
            │         └── Signals
            ├── Recommendations
            │    └── Review / Priority history
            ├── StrategicPlan
            │    └── Objectives
            │         ├── Actions
            │         │    └── Tasks
            │         ├── Metrics / Targets
            │         ├── Measurements
            │         └── Evidence
            ├── Documents
            ├── Comments / Activities
            └── Reports
```

Um projeto pode ter mais de um briefing ao longo do tempo, por exemplo, briefing inicial e revisão de escopo. O relacionamento não deve pressupor que exista exatamente um briefing por projeto.

---

## 5. Arquitetura de aplicação

### 5.1 Estilo recomendado: monólito modular

Para a fase atual, microserviços aumentariam custo operacional, complexidade de deploy, observabilidade e consistência distribuída sem benefício proporcional.

Recomendação:

- uma aplicação Next.js;
- um banco PostgreSQL;
- Prisma como acesso a dados;
- Supabase Auth ou provedor de identidade equivalente;
- armazenamento de arquivos privado;
- processamento assíncrono apenas para tarefas que justifiquem fila;
- módulos internos com contratos explícitos.

A separação modular deve ser lógica e testável, não necessariamente implantada em processos separados.

### 5.2 Estrutura de pastas sugerida

```text
src/
├── app/                         # Rotas, páginas e composição da interface
│   ├── (auth)/
│   ├── (workspace)/
│   ├── public/
│   │   └── briefing/[token]/
│   ├── api/
│   └── print/
├── components/                  # Componentes visuais compartilhados
│   ├── ui/
│   ├── layout/
│   └── domain/
├── modules/
│   ├── identity/
│   ├── clients/
│   ├── projects/
│   ├── briefings/
│   ├── diagnosis/
│   ├── recommendations/
│   ├── planning/
│   ├── execution/
│   ├── measurement/
│   ├── documents/
│   ├── reporting/
│   ├── templates/
│   ├── notifications/
│   └── audit/
├── core/                        # Tipos e regras realmente compartilhados/puras
├── infrastructure/              # Adaptadores externos
│   ├── database/
│   ├── auth/
│   ├── storage/
│   ├── email/
│   ├── queue/
│   ├── pdf/
│   └── observability/
└── shared/
    ├── config/
    ├── errors/
    ├── logging/
    └── validation/
```

Cada módulo pode adotar uma estrutura interna simples:

```text
modules/projects/
├── domain/
│   ├── project.ts
│   ├── project-policy.ts
│   └── project-status.ts
├── application/
│   ├── create-project.ts
│   ├── update-project.ts
│   └── archive-project.ts
├── infrastructure/
│   └── project-repository.ts
└── presentation/
    └── project-dto.ts
```

Não criar todas essas pastas vazias de uma vez. Introduzir a estrutura quando um fluxo for implementado ou refatorado.

### 5.3 Regras de dependência

| Camada | Pode depender de | Não deve depender de |
|---|---|---|
| Domain | Tipos e funções puras do domínio | Next.js, React, Prisma, Supabase, rede |
| Application | Domain e contratos de portas | Componentes, Route Handlers e detalhes de fornecedor |
| Infrastructure | Contratos de Application/Domain e SDKs externos | Interface visual |
| Presentation | Application, DTOs e componentes | Prisma diretamente |
| App / Route Handlers | Presentation e Application | Regras de negócio implementadas localmente |

As rotas devem ser finas: autenticar, validar formato, chamar caso de uso e converter resultado em HTTP.

### 5.4 Repositórios e consultas

Usar repositórios quando houver benefício claro de isolamento de persistência, consistência transacional ou teste. Não criar uma camada genérica que apenas repasse todos os métodos do Prisma.

Consultas de leitura complexas para dashboards e relatórios podem usar query services próprios, sem forçar toda leitura a passar pelo mesmo padrão de repositório de escrita.

---

## 6. Multi-organização, autorização e isolamento

### 6.1 Organização como tenant

Mesmo com implantação inicial para uma organização, o modelo deve conter `organizationId` nos dados organizacionais desde o início. Isso evita uma migração estrutural arriscada quando houver segunda organização.

Entidades como cliente, projeto, briefing, plano, objetivo, tarefa, documento, modelo e relatório devem ser associadas à organização de forma direta ou por uma relação verificável.

### 6.2 Regras obrigatórias

- Toda consulta administrativa deve restringir o escopo à organização ativa.
- Toda mutação deve validar organização e permissão no servidor.
- Não confiar em `organizationId`, `userId`, `role` ou `projectId` enviados pelo cliente sem revalidar a relação no banco.
- IDs difíceis de adivinhar não substituem autorização.
- A interface pode ocultar ações, mas a API precisa rejeitá-las quando não autorizadas.
- Acesso a arquivos deve verificar a mesma política do registro que os referencia.
- Relatórios compartilhados externamente devem expor apenas o conteúdo explicitamente autorizado.

### 6.3 Modelo conceitual de acesso

```text
User
  └── Membership
       ├── Organization
       ├── Role
       └── Permission overrides (quando necessário)

Project
  └── ProjectMember
       ├── User
       └── Project-level access
```

A associação à organização define o acesso-base. A participação no projeto pode restringir ou ampliar ações conforme a matriz de permissões aprovada.

### 6.4 Papéis e permissões

O produto prevê administradores, líderes e membros, mas a matriz detalhada ainda é uma decisão pendente. A implementação deve evitar condicionais espalhadas como `if (role === "admin")`.

Recomendação:

- centralizar políticas em funções como `canManageMembers`, `canApproveDiagnosis`, `canChangePriority`, `canManageProject` e `canValidateMeasurement`;
- distinguir permissão de organização e permissão de projeto;
- permitir que uma pessoa seja responsável por um projeto sem conceder acesso administrativo à organização;
- registrar alterações de papel e concessões excepcionais no audit log;
- aplicar princípio do menor privilégio.

Não assumir que todo líder pode executar qualquer ação nem que todo membro só pode visualizar. Confirmar a matriz no documento de requisitos antes de codificar.

### 6.5 Row Level Security

Se PostgreSQL/Supabase RLS for usado como segunda barreira, as políticas devem refletir o modelo real de membership e escopo de projeto. Não habilitar RLS com políticas permissivas apenas para “marcar como protegido”.

A autorização na aplicação continua obrigatória. Testes devem tentar acessar registros de outra organização usando IDs conhecidos e sessões de usuários distintos.

---

## 7. Integridade transacional e casos de uso

### 7.1 Casos de uso que exigem transação

| Caso de uso | Operação consistente |
|---|---|
| Enviar briefing | Validar status, validar respostas visíveis, congelar versão, gerar diagnóstico e mudar status |
| Reprocessar diagnóstico | Recalcular sinais e diagnóstico com versão explícita, preservando histórico |
| Aprovar diagnóstico | Registrar aprovador, data, versão e estado |
| Converter recomendação | Criar/associar objetivo, ação e tarefas após revisão humana |
| Alterar prioridade | Registrar prioridade calculada, prioridade aprovada, justificativa e autor |
| Atualizar objetivo | Registrar mudança de estado, meta e histórico de alteração |
| Registrar medição | Validar métrica, unidade, período e permissão; gravar medição e evidência associada |
| Fechar projeto | Validar objetivos, resultados, revisão final e aprovação de encerramento |
| Excluir/anonimizar dados | Aplicar política de retenção e preservar integridade de registros que precisem ser mantidos |

### 7.2 Exemplo de fluxo de envio de briefing

```text
submitBriefing(briefingId, actor/context)
  1. carregar briefing dentro da organização autorizada
  2. validar estado e prazo do link
  3. carregar versão exata do catálogo associada ao briefing
  4. calcular visibilidade e validar respostas obrigatórias visíveis
  5. validar tipos, opções e limites de todas as respostas
  6. congelar snapshot das respostas submetidas
  7. executar motor determinístico com versão de regras definida
  8. persistir sinais e diagnóstico
  9. alterar status para ready_for_review
 10. gravar evento de auditoria
 11. confirmar transação
```

Se a transação falhar, o briefing não pode ficar marcado como enviado sem o diagnóstico correspondente.

### 7.3 Concorrência e idempotência

- Autosave e envio precisam ter coordenação explícita.
- Um envio deve impedir gravações posteriores de respostas, salvo fluxo autorizado de reabertura ou nova versão.
- Operações repetidas precisam ter resultado previsível.
- Reprocessamento deve ser idempotente para a mesma versão de entrada e regras, sem apagar a trilha histórica.
- Usar controle otimista de versão (`version`/`updatedAt`) onde edições concorrentes forem possíveis.
- Não confiar apenas no debounce do navegador para consistência.

---

## 8. Versionamento e reprodutibilidade

### 8.1 O que precisa ser versionado

| Artefato | Motivo |
|---|---|
| Catálogo de perguntas | Alterações não podem modificar briefings antigos |
| Briefing submetido | Preservar exatamente o que foi respondido |
| Regras de diagnóstico | Explicar por que um resultado foi produzido |
| Recomendações e seus critérios | Rastrear origem e mudanças |
| Modelos de briefing/projeto/relatório | Duplicações futuras não devem alterar instâncias existentes |
| Metas e definições de indicadores | Comparar resultados com a meta vigente no período |
| Relatórios finais | Preservar o material que foi compartilhado/aprovado |

### 8.2 Estratégia recomendada

- Usar versões imutáveis para catálogos e regras publicadas.
- Associar cada briefing a uma versão do catálogo.
- Associar cada diagnóstico a uma versão de regras e ao snapshot de entrada.
- Criar nova versão ao publicar mudanças relevantes; não editar a versão usada por registros existentes.
- Manter autor, data, motivo e estado de publicação.
- Definir política de compatibilidade e migração para versões antigas.

### 8.3 Reprocessamento histórico

Reprocessar um briefing antigo não deve substituir silenciosamente seu diagnóstico aprovado. O sistema deve criar uma nova execução, registrar a versão de regras utilizada e permitir comparar o resultado anterior com o novo.

---

## 9. Diagnóstico, recomendações e priorização

### 9.1 Diagnóstico determinístico na V1

O motor deve continuar sendo puro, testável e explicável. Regras precisam ter:

- identificador estável;
- versão;
- categoria;
- condições de disparo;
- severidade;
- explicação compreensível;
- referências às respostas e sinais de origem;
- testes para cenários positivos, negativos e limites.

A interpretação humana permanece parte do processo. O sistema oferece evidências e uma proposta; a equipe revisa e valida.

### 9.2 Recomendações como entidades revisáveis

Uma recomendação deve preservar:

- texto e objetivo sugerido;
- categoria estratégica;
- sinais/respostas que motivaram a sugestão;
- versão da regra que a originou;
- prioridade calculada;
- prioridade aprovada;
- justificativa de alteração;
- estado de revisão;
- responsável e histórico.

Evitar gerar recomendações apenas como texto transitório na tela. Elas precisam existir como registros rastreáveis se forem discutidas, aprovadas ou convertidas em trabalho.

### 9.3 Priorização

A prioridade considera severidade, impacto estratégico, urgência e esforço. A fórmula e os pesos permanecem pendentes de decisão de produto.

Requisitos arquiteturais:

- guardar os fatores usados no cálculo;
- guardar o resultado calculado original;
- permitir revisão humana conforme permissão;
- preservar justificativa, autor, data e valor anterior/novo;
- evitar que esforço baixo ou alto, isoladamente, rebaixe uma iniciativa de grande valor;
- permitir recalcular apenas quando a política de priorização mudar, sem apagar decisões anteriores.

Não codificar pesos definitivos antes da aprovação da regra de negócio.

### 9.4 Conversão assistida em plano

A conversão de recomendação em objetivo, ação e tarefas deve ser uma etapa explícita de revisão:

1. sistema propõe objetivo e estrutura inicial;
2. equipe revisa e edita;
3. responsáveis, prioridades e prazos são confirmados;
4. só então os compromissos de execução são criados.

Isso evita que uma sugestão diagnóstica vire automaticamente obrigação operacional.

---

## 10. Planejamento, execução e medição

### 10.1 Separação entre objetivo, ação e tarefa

| Elemento | Pergunta que responde | Exemplo conceitual |
|---|---|---|
| Objetivo | Qual resultado queremos alcançar? | Melhorar a geração de oportunidades qualificadas |
| Ação | Que iniciativa contribui para o resultado? | Reestruturar a estratégia de conteúdo |
| Tarefa | Qual trabalho concreto precisa ser feito? | Levantar temas e aprovar calendário editorial |

A tarefa pode ser concluída sem que o objetivo seja alcançado. O modelo e os dashboards devem representar essa diferença.

### 10.2 Plano estratégico

- Um plano estratégico principal por projeto, com possibilidade de planos complementares.
- Objetivos com estado, responsável, período, métricas, metas e histórico.
- Ações vinculadas a objetivos.
- Tarefas vinculadas a ações e, quando necessário, diretamente a objetivos.
- Mudanças de escopo, cancelamento e substituição com justificativa.
- Encerramento de projeto com avaliação de resultados e relatório final.

### 10.3 Indicadores e medições

Separar definição de indicador de observação de resultado:

- `Metric`: nome, descrição, tipo, unidade, método de atualização e regra de validação.
- `Target`: valor-alvo, período, data de vigência e histórico.
- `Measurement`: valor observado, período de referência, autor do registro e data.
- `Evidence`: documento, link ou observação que sustenta a medição.
- `ImpactReview`: avaliação qualitativa e quantitativa do impacto.

A equipe escolhe quando atualizar os indicadores; não impor periodicidade fixa na arquitetura. O registro de uma medição pode ser feito por membro autorizado, enquanto a validação cabe a pessoas com permissão definida.

### 10.4 Metas não atingidas

O sistema pode sugerir revisão com base em regras, mas não deve alterar automaticamente objetivos ou metas. Mudanças exigem decisão humana e histórico.

Objetivos cancelados ou substituídos devem ser arquivados com motivo, responsável e impacto, não apagados como se nunca tivessem existido.

---

## 11. Dados, arquivos e relatórios

### 11.1 Histórico de cliente

O histórico do cliente deve reunir atividades relevantes para o trabalho: reuniões, decisões, observações, documentos e projetos. Não é necessário transformar o produto em CRM completo.

As atividades devem ter autor, data, tipo, conteúdo e vínculo com cliente/projeto quando aplicável.

### 11.2 Armazenamento de arquivos

- Usar bucket privado por padrão.
- Persistir metadados no banco; armazenar bytes no serviço de storage.
- Validar tamanho, extensão e MIME type no servidor.
- Gerar URLs assinadas com validade curta.
- Verificar autorização no registro relacionado antes de emitir URL.
- Registrar upload, substituição e exclusão.
- Definir retenção e política de remoção.
- Não armazenar credenciais ou URLs públicas permanentes para documentos privados.

### 11.3 Relatórios

Relatórios operacionais, estratégicos e de desempenho devem consultar dados respeitando a organização e as permissões do usuário.

Para relatórios compartilhados com clientes:

- criar um artefato/snapshot com escopo explícito;
- usar token aleatório e revogável;
- permitir expiração;
- não expor o painel interno;
- registrar criação, acesso e revogação;
- não incluir comentários internos ou dados de outros projetos;
- definir se o destinatário pode baixar, imprimir ou apenas visualizar.

O mecanismo de compartilhamento, autenticação e expiração ainda precisa de decisão de produto. A arquitetura deve suportar revogação e escopo mínimo.

### 11.4 Exportações e PDFs

Exportações longas ou caras podem usar job assíncrono. A geração de PDF deve ficar atrás de uma interface de serviço para permitir trocar Playwright/Chromium por worker ou serviço compatível sem alterar os módulos de negócio.

Não assumir que Chromium completo funciona em funções serverless. Validar a estratégia no ambiente de deploy escolhido.

---

## 12. Segurança, privacidade e auditoria

### 12.1 Autenticação e autorização

- Desativar cadastro aberto se o modelo de entrada exigir convite.
- Não provisionar usuário local sem autorização explícita para ingressar na organização.
- Validar redirect de login para destinos internos permitidos.
- Proteger mutações contra CSRF/origem cruzada conforme o modelo de sessão.
- Aplicar rate limiting em formulário público, autosave, envio, login, compartilhamento e exportação.
- Não registrar tokens, respostas livres ou dados pessoais em logs comuns.
- Usar segredos apenas no servidor e rotacionar credenciais em incidentes.

### 12.2 Auditoria

Registrar, no mínimo, eventos relevantes:

- convite, entrada e remoção de membro;
- mudança de papel/permissão;
- criação, alteração, arquivamento e exclusão de cliente/projeto;
- envio, aprovação, revogação e reprocessamento de briefing;
- alteração de recomendação/prioridade;
- aprovação e mudança de objetivo/meta;
- validação de medição;
- compartilhamento, acesso e revogação de relatório;
- exportação e exclusão de dados.

Cada evento deve conter ator, organização, entidade, ação, data/hora e metadados mínimos necessários. Evitar copiar conteúdo pessoal sensível para o log.

### 12.3 LGPD e ciclo de vida de dados

A arquitetura deve permitir:

- aviso de privacidade no formulário público;
- registro de versão do aviso e base legal aplicável;
- atendimento a solicitações de acesso, correção, portabilidade e exclusão quando cabíveis;
- retenção definida por categoria de dado;
- anonimização ou exclusão conforme política;
- inventário de suboperadores e serviços;
- registro de operações relevantes;
- controle de acesso a respostas e documentos.

Consentimento não deve ser tratado como base legal universal. A base legal e os prazos devem ser definidos com orientação jurídica adequada ao contexto.

### 12.4 Backups e recuperação

- backups automáticos periódicos;
- retenção definida;
- recuperação pontual quando suportada pelo provedor;
- alertas para falha de backup;
- runbook de recuperação;
- testes periódicos de restauração;
- RPO e RTO definidos de acordo com impacto de negócio e capacidade de infraestrutura.

Não fixar valores de RPO/RTO sem decisão operacional.

---

## 13. API, eventos e processamento assíncrono

### 13.1 API

Os contratos de API devem:

- validar entrada com schemas;
- retornar erros padronizados;
- nunca confiar em escopo ou papel fornecido pelo cliente;
- usar paginação em listas potencialmente grandes;
- aplicar filtros permitidos e ordenação estável;
- manter compatibilidade quando houver clientes externos no futuro;
- registrar request ID para correlação.

### 13.2 Eventos de domínio

Eventos internos podem desacoplar notificações, auditoria e tarefas derivadas. Exemplos:

- `BriefingSubmitted`
- `DiagnosisGenerated`
- `RecommendationApproved`
- `ObjectiveUpdated`
- `MeasurementRecorded`
- `ProjectClosed`
- `ReportShared`

Na primeira fase, esses eventos podem ser processados dentro da aplicação e persistidos via outbox quando precisarem sobreviver a falhas. Não adotar broker distribuído antes de existir necessidade real.

### 13.3 Processamento assíncrono

Candidatos a job:

- geração de PDF pesado;
- envio de e-mail;
- processamento de anexos;
- exportação de relatórios extensos;
- notificações em lote;
- tarefas agendadas de retenção e limpeza.

Jobs precisam de idempotência, retry com limite, estado observável e tratamento de falhas. Não executar trabalho pesado dentro de requisições HTTP sem avaliar timeout e custo.

### 13.4 Integrações futuras

A V1 é standalone. A arquitetura pode prever adaptadores para Drive, calendário, comunicação, CRM e plataformas de marketing, mas não deve implementar integrações antes de estabilizar o fluxo interno.

Quando integrações forem introduzidas:

- credenciais criptografadas e fora do cliente;
- escopos mínimos;
- logs sem segredos;
- tratamento de expiração e revogação;
- retries e idempotência;
- visibilidade de falhas;
- desconexão e exclusão segura de credenciais.

---

## 14. Qualidade, testes e observabilidade

### 14.1 Pirâmide de testes

| Camada | Cobertura esperada |
|---|---|
| Domínio | Regras de visibilidade, diagnóstico, prioridade e transições |
| Aplicação | Casos de uso, autorização e transações |
| Persistência | Repositórios, constraints, isolamento de tenant e migrações |
| API | Autenticação, autorização, validação e códigos de erro |
| Componentes | Formulários, estados, acessibilidade e feedback |
| E2E | Jornada completa de organização, cliente, projeto e briefing |
| Segurança | Acesso cruzado, rate limit, CSRF, links públicos e arquivos |

Priorizar testes de comportamento e invariantes. Cobertura percentual pode ser acompanhada, mas não substitui qualidade dos cenários.

### 14.2 Cenários críticos de teste

- membro da organização A não acessa cliente/projeto da organização B;
- usuário sem permissão não aprova diagnóstico nem altera prioridade;
- usuário participante de projeto não ganha automaticamente administração da organização;
- resposta invisível não participa do diagnóstico;
- envio concorrente com autosave não perde dados nem deixa estado parcial;
- alteração de catálogo não modifica briefing histórico;
- reprocessamento cria nova execução rastreável;
- conversão de recomendação exige confirmação;
- tarefa concluída não marca objetivo como atingido;
- medição inválida não é persistida;
- relatório compartilhado não revela notas internas;
- token revogado ou expirado não permite leitura;
- URL assinada de arquivo não permite acesso após expiração.

### 14.3 CI

Pipeline mínimo recomendado:

```text
format/lint
   ↓
typecheck
   ↓
unit tests
   ↓
integration tests (PostgreSQL)
   ↓
build
   ↓
E2E em ambiente de preview
   ↓
release/migrations
```

Migrações devem ser aplicadas por etapa controlada de release, nunca de forma implícita em cada inicialização da aplicação.

### 14.4 Observabilidade

- logs estruturados com request ID;
- redaction de tokens, e-mails, telefones e respostas;
- rastreamento de erros no servidor e cliente;
- métricas de latência e falhas;
- health check que não revele segredos;
- alertas para falhas de autenticação, erros 5xx, jobs presos e falhas de exportação;
- dashboards operacionais para acompanhar saúde do sistema.

---

## 15. Performance e escalabilidade

A V1 deve otimizar primeiro a previsibilidade e a experiência de uso, sem antecipar escala que ainda não foi observada.

Prioridades:

- paginação e filtros no servidor;
- índices para `organizationId`, relações e campos de busca;
- evitar carregar todos os clientes/projetos em dashboards;
- consultas agregadas para relatórios;
- cache apenas para dados que possam ser invalidados corretamente;
- geração assíncrona de relatórios grandes;
- limites de payload e tamanho de arquivo;
- monitoramento de consultas lentas;
- evitar N+1 em listas e dashboards.

O isolamento por organização deve ser eficiente, mas não deve depender de um único filtro esquecido em cada página. Criar funções de consulta e políticas reutilizáveis.

---

## 16. Plano de evolução técnica

A sequência abaixo organiza dependências. Ela não substitui o roadmap de produto e deve ser sincronizada com `04-roadmap-melhorias.md`.

### Fase A — Confirmar e proteger a base

**Objetivo:** reduzir riscos do MVP antes de expandir funcionalidades.

- revalidar os achados históricos SEC, DATA, LGPD e DEPLOY;
- corrigir autorização de entrada e provisionamento;
- validar redirects e origem das mutações;
- adicionar rate limiting nas rotas públicas;
- configurar headers e política de indexação/referrer;
- validar variáveis de ambiente;
- corrigir atomicidade do envio;
- validar respostas por tipo e opções;
- introduzir CI e testes de integração essenciais;
- validar a geração de PDF no ambiente de deploy.

**Saída:** base confiável para começar a suportar equipes e dados reais.

### Fase B — Fundamentos multi-organização e colaboração

**Objetivo:** sair do modelo de uma administradora para organização e equipe.

- criar/normalizar Organization e Membership;
- adicionar `organizationId` às entidades organizacionais;
- definir matriz de papéis e permissões;
- criar políticas centrais de autorização;
- incluir Project e ProjectMember;
- migrar clientes e briefings existentes para uma organização inicial;
- testar isolamento entre organizações;
- introduzir trilha de auditoria para alterações de acesso.

**Saída:** organização, membros, clientes e projetos com escopo seguro.

### Fase C — Briefing e diagnóstico versionados

**Objetivo:** garantir reprodutibilidade e preservar histórico.

- versionar catálogo e perguntas;
- associar briefing à versão de catálogo;
- congelar snapshot ao enviar;
- versionar regras de diagnóstico;
- persistir origem e explicação dos resultados;
- criar fluxo de revisão/aprovação;
- permitir reprocessamento sem sobrescrita silenciosa.

**Saída:** diagnóstico rastreável e confiável.

### Fase D — Recomendações e planejamento estratégico

**Objetivo:** transformar diagnóstico em decisões de trabalho.

- persistir recomendações e suas origens;
- implementar revisão humana;
- definir e implementar política de prioridade aprovada;
- registrar mudanças de prioridade;
- criar plano estratégico, objetivos e ações;
- implementar conversão assistida;
- criar histórico de objetivos e decisões.

**Saída:** equipe consegue sair do diagnóstico com um plano revisado.

### Fase E — Execução e acompanhamento

**Objetivo:** acompanhar o trabalho e os resultados.

- criar tarefas e atribuições;
- comentários e menções;
- notificações internas;
- indicadores, metas e medições;
- evidências;
- validação de resultados;
- revisão de impacto e ajustes;
- arquivamento justificado de objetivos cancelados/substituídos.

**Saída:** execução e resultado ficam conectados, sem confundir atividade com impacto.

### Fase F — Relatórios, documentos e operação madura

**Objetivo:** comunicar resultados e sustentar uso contínuo.

- histórico e documentos contextuais;
- dashboards por papel;
- relatórios operacionais e estratégicos;
- compartilhamento externo com escopo, expiração e revogação;
- PDF/exportações compatíveis com deploy;
- backups e restauração testados;
- observabilidade e runbooks;
- melhoria contínua baseada em uso e feedback.

**Saída:** ciclo estratégico pode ser encerrado, comunicado e reutilizado.

---

## 17. Decisões arquiteturais pendentes

Estas decisões precisam ser fechadas antes de determinadas implementações. Não devem ser resolvidas por conveniência técnica sem validação de produto.

| Decisão | Por que importa | Dependência |
|---|---|---|
| Matriz detalhada de permissões | Define políticas de aplicação e banco | Identity & Access |
| Escopo de acesso a projetos: individual, equipe ou ambos | Define consultas e compartilhamento | Project Management |
| Fórmula, pesos e escalas de prioridade | Define cálculo reproduzível | Recommendations |
| Versionamento e deduplicação de recomendações | Evita duplicatas e conflitos entre diagnósticos | Recommendations |
| Tipos, unidades e validação de indicadores | Define schema e medições | Measurement |
| Validação de medições e responsáveis | Define autorização de resultados | Measurement |
| Compartilhamento externo de relatórios | Define token, expiração, escopo e autenticação | Reporting |
| Herança e duplicação de modelos | Define como mudanças afetam projetos novos | Templates |
| Recorrência de projetos | Define geração automática ou confirmação | Projects |
| Eventos e preferências de notificação | Define canais e ruído operacional | Notifications |
| Política de arquivamento e exclusão | Afeta integridade, LGPD e relatórios | Cross-cutting |
| RPO/RTO e retenção de backup | Define custo e operação | Infrastructure |

---

## 18. Critérios de aceite arquitetural

Uma funcionalidade não deve ser considerada pronta apenas porque a tela funciona. Para fluxos que alteram dados, verificar:

- [ ] regra de negócio documentada;
- [ ] autenticação e autorização no servidor;
- [ ] escopo da organização validado;
- [ ] validação de entrada no limite da aplicação;
- [ ] transação e concorrência avaliadas;
- [ ] histórico/auditoria quando a mudança for estratégica;
- [ ] tratamento de erro previsível;
- [ ] testes de domínio e aplicação;
- [ ] testes de isolamento quando houver dados multi-tenant;
- [ ] acessibilidade e estados de carregamento/erro;
- [ ] logs sem dados pessoais desnecessários;
- [ ] migração e rollback avaliados;
- [ ] documentação atualizada.

---

## 19. Checklist técnico de prontidão

### Segurança e isolamento
- [ ] Entrada de usuários autorizada por convite ou política explícita.
- [ ] Papéis e permissões centralizados.
- [ ] Toda consulta/mutação limitada à organização correta.
- [ ] Acesso a projeto validado conforme participação e papel.
- [ ] CSRF/origin check e rate limiting implementados.
- [ ] Links públicos e compartilhados expiráveis e revogáveis.
- [ ] Arquivos privados protegidos por autorização e URLs temporárias.
- [ ] Headers, `noindex` e política de referrer revisados.

### Integridade e histórico
- [ ] Envio de briefing atômico.
- [ ] Catálogo e regras versionados.
- [ ] Respostas validadas semanticamente.
- [ ] Diagnósticos reprocessáveis sem apagar histórico.
- [ ] Recomendações com origem e histórico de prioridade.
- [ ] Objetivos, metas e medições com histórico.
- [ ] Fechamento de projeto com revisão de resultados.

### Operação e qualidade
- [ ] CI executa lint, typecheck, testes e build.
- [ ] Testes de integração com PostgreSQL.
- [ ] E2E cobre a jornada principal.
- [ ] Logs estruturados e redaction.
- [ ] Error tracking e health check.
- [ ] Backups e restauração testados.
- [ ] PDF e exportações validados no ambiente real.
- [ ] Runbooks para incidentes e recuperação.

### Privacidade
- [ ] Aviso de privacidade e base legal revisados.
- [ ] Retenção definida por categoria de dado.
- [ ] Exportação, correção e exclusão/anonimização suportadas.
- [ ] Suboperadores documentados.
- [ ] Acesso a respostas e documentos restrito por necessidade.

---

## 20. Relação com os demais documentos

| Documento | Responsabilidade |
|---|---|
| `PRODUCT.md` | Visão, usuários, problema, princípios, limites e direção do produto |
| `02-requisitos.md` | Requisitos funcionais, não funcionais, atores, regras e critérios de aceite |
| `03-inspecao-e-arquitetura.md` | Estado técnico observado, arquitetura-alvo, riscos e estratégia de evolução |
| `04-roadmap-melhorias.md` | Sequenciamento de entregas, prioridades e acompanhamento |

Quando houver conflito:
1. requisitos e decisões de produto aprovadas definem o comportamento esperado;
2. este documento define como organizar tecnicamente esse comportamento;
3. o roadmap define quando cada parte será entregue;
4. o código deve refletir as decisões aprovadas e os documentos devem ser atualizados junto com mudanças relevantes.

---

## 21. Próxima atividade recomendada

Antes de começar uma grande refatoração, realizar uma **auditoria de confirmação do repositório atual** com foco em:

1. schema Prisma atual e migrações;
2. autenticação, sessão, provisionamento e autorização;
3. rotas de clientes e briefings;
4. persistência de respostas, envio e reprocessamento;
5. testes e pipeline;
6. deploy, PDF, storage e variáveis de ambiente.

O resultado deve classificar cada achado como `confirmado`, `corrigido`, `não reproduzido` ou `substituído por decisão nova`. Só então converter as pendências em tarefas técnicas.

**Recomendação:** não iniciar a implementação simultânea de todos os módulos. Primeiro consolidar isolamento de organização, permissões e integridade do briefing; depois evoluir para recomendações, planejamento, execução e medição.
