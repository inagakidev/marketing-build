# Briefing Inteligente — Roadmap de Produto e Evolução Técnica

> **Versão:** 2.0  
> **Data:** 13/11/2026  
> **Status:** proposta de evolução alinhada à visão e aos requisitos da plataforma  
> **Documentos de referência:** `PRODUCT.md`, `02-requisitos.md` v2.0 e `03-inspecao-e-arquitetura.md` v2.0  
> **Princípio de planejamento:** priorizar dependências, riscos e valor entregue; estimativas de calendário só devem ser definidas após confirmar capacidade e estado real do repositório.

---

## 1. Resumo executivo

O Briefing Inteligente está evoluindo de um MVP centrado em formulário, respostas e diagnóstico para uma **plataforma de gestão estratégica de marketing para equipes**.

O briefing continua sendo a porta de entrada. O valor do produto passa a estar na jornada completa:

**Organização → Cliente → Projeto/Campanha → Briefing → Diagnóstico → Recomendações → Objetivos → Ações e tarefas → Indicadores → Resultados → Relatórios e aprendizado.**

O roadmap precisa, portanto, deixar de tratar multiusuário, planejamento e execução como uma expansão distante e passar a organizá-los como partes do produto-alvo. Ao mesmo tempo, não é viável construir tudo de uma vez. A evolução será incremental, com entregas verticais e critérios de saída claros.

### 1.1 Estratégia de evolução

1. Confirmar o estado real do código e proteger o MVP.
2. Construir os fundamentos de organização, membros, permissões e projetos.
3. Tornar briefing e diagnóstico versionados e rastreáveis.
4. Transformar diagnóstico em recomendações revisáveis.
5. Permitir planejamento, execução e acompanhamento de resultados.
6. Consolidar relatórios, documentos, privacidade e operação.
7. Melhorar continuamente com dados de uso e feedback das equipes.

### 1.2 O que este roadmap não presume

- Não presume que os achados da inspeção de 12/11/2026 ainda estejam presentes.
- Não presume que os módulos descritos na arquitetura-alvo já existam.
- Não define pesos de priorização, matriz final de permissões ou políticas ainda pendentes de decisão.
- Não transforma estimativas antigas de semanas em compromissos de prazo.
- Não inclui IA generativa, integrações externas ou microserviços como dependências da V1.

---

## 2. Direção do produto e resultado esperado

### 2.1 Resultado que queremos entregar

Uma equipe de marketing deve conseguir:

- organizar clientes e projetos em um espaço de trabalho compartilhado;
- coletar informações estratégicas por meio de briefings adaptativos;
- analisar respostas com diagnóstico determinístico e explicável;
- revisar recomendações, prioridades e decisões;
- transformar recomendações em objetivos, ações e tarefas;
- acompanhar responsáveis, prazos, indicadores e evidências;
- avaliar resultados e comunicar o trabalho ao cliente;
- consultar o histórico para aprender com projetos anteriores.

O produto deve apoiar o raciocínio e a colaboração da equipe, sem substituir a decisão profissional por automações opacas.

### 2.2 Métrica norteadora

**Projetos com ciclo estratégico acompanhado e revisado.**

Um projeto conta como acompanhado quando possui:
1. briefing ou contexto estratégico registrado;
2. diagnóstico revisado quando aplicável;
3. objetivos e ações definidos;
4. ao menos uma atualização de execução ou indicador;
5. revisão de resultados em um marco relevante ou no encerramento.

Essa métrica representa melhor a proposta da plataforma do que contar apenas briefings concluídos. Métricas auxiliares devem medir adoção, qualidade e saúde do fluxo.

### 2.3 Métricas auxiliares

| Dimensão | Indicadores |
|---|---|
| Ativação | Organizações configuradas, membros ativos, clientes e projetos criados |
| Briefing | Taxa de início/conclusão, abandono por etapa, tempo de preenchimento, falhas de autosave |
| Diagnóstico | Diagnósticos revisados, tempo até revisão, recomendações aceitas/ajustadas/descartadas |
| Planejamento | Projetos com objetivos, objetivos com métricas e responsáveis definidos |
| Execução | Ações e tarefas atualizadas, tarefas atrasadas, participação dos membros |
| Resultados | Indicadores atualizados, metas avaliadas, objetivos atingidos/parcialmente atingidos/não atingidos |
| Comunicação | Relatórios gerados/compartilhados, revisões finais realizadas |
| Confiança | Erros de autorização, falhas de persistência, incidentes, satisfação da equipe |

Metas numéricas devem ser estabelecidas depois de instrumentar o produto e obter uma linha de base. Não adotar metas arbitrárias antes de ter dados.

---

## 3. Princípios de priorização

### 3.1 Ordem de decisão

Ao decidir o que entra primeiro, considerar nesta ordem:

1. **Segurança e integridade:** risco de acesso indevido, perda ou corrupção de dados.
2. **Dependências estruturais:** capacidades necessárias para mais de um módulo.
3. **Jornada principal:** funcionalidades que permitem concluir uma etapa de valor.
4. **Usabilidade e adoção:** reduzir fricção para equipe e cliente.
5. **Escala e otimização:** somente quando uso e evidências justificarem.

### 3.2 Classes de prioridade

| Classe | Significado |
|---|---|
| **P0 — Bloqueador** | Risco crítico de segurança, perda de dados ou impossibilidade de operar |
| **P1 — Essencial** | Necessário para a jornada V1 ou para cumprir requisito obrigatório |
| **P2 — Importante** | Melhora adoção, eficiência, governança ou qualidade |
| **P3 — Evolutivo** | Refinamento ou capacidade que pode esperar por evidência de uso |

A classificação deve ser aplicada aos itens depois da auditoria do repositório. O roadmap indica sequência e dependências, não substitui a avaliação de cada tarefa.

### 3.3 Critérios para ordenar itens da mesma classe

- Quantos fluxos e módulos desbloqueia?
- Reduz risco ou retrabalho?
- É pré-requisito de migração de dados?
- Entrega valor utilizável de ponta a ponta?
- Pode ser validado com uma equipe real?
- O custo de adiar é maior que o custo de implementar agora?

---

## 4. Estado atual: baseline a confirmar

A inspeção técnica de 12/11/2026 registrou um MVP com núcleo de domínio puro, formulário público, autosave, diagnóstico determinístico, token opaco, painel administrativo e testes unitários. Também apontou riscos em autenticação, envio transacional, versionamento, validação, observabilidade, privacidade e deploy.

Esses dados são uma fotografia histórica. A primeira atividade do roadmap é revalidá-los no repositório.

### 4.1 Auditoria de confirmação

| Área | O que verificar | Resultado esperado |
|---|---|---|
| Repositório | Branch, commit, alterações locais, estrutura atual | Baseline reproduzível |
| Banco | Schema Prisma, migrações, constraints e índices | Modelo atual documentado |
| Autenticação | Signup, sessão, provisionamento e redirects | Fluxo de entrada conhecido |
| Autorização | Proteção de páginas, rotas, consultas e mutações | Matriz de lacunas |
| Briefing | Autosave, envio, status, token e concorrência | Invariantes confirmadas |
| Diagnóstico | Regras, persistência, ordenação e reprocessamento | Reprodutibilidade verificada |
| Testes | Unitários, integração, API, E2E e CI | Cobertura real conhecida |
| Operação | Deploy, PDF, storage, logs, backups e env | Limitações do ambiente conhecidas |
| Privacidade | Dados coletados, logs, retenção e exclusão | Mapa inicial de dados |

Classificar cada achado como `confirmado`, `corrigido`, `não reproduzido`, `parcial` ou `substituído por decisão nova`.

### 4.2 Regra de conversão em backlog

Nenhum achado histórico deve virar tarefa automaticamente. Antes:
1. reproduzir ou localizar a condição no código;
2. identificar os dados e fluxos afetados;
3. definir correção e critério de aceite;
4. avaliar migração e compatibilidade;
5. criar testes;
6. atualizar documentação se a decisão arquitetural mudar.

---

## 5. Workstreams

Os workstreams são linhas contínuas de trabalho. Cada fase pode envolver mais de um deles.

| Workstream | Escopo |
|---|---|
| **A. Fundamentos e arquitetura** | Modularização pragmática, casos de uso, contratos, configuração e migrações |
| **B. Segurança e governança** | Autenticação, autorização, tenant isolation, auditoria e privacidade |
| **C. Clientes e projetos** | Estrutura organizacional, histórico, responsáveis e colaboração |
| **D. Briefing e diagnóstico** | Formulários, versões, respostas, regras e revisão |
| **E. Estratégia e recomendações** | Sugestões, priorização, aprovação e conversão em plano |
| **F. Planejamento e execução** | Objetivos, ações, tarefas, responsáveis, comentários e notificações |
| **G. Medição e resultados** | Indicadores, metas, medições, evidências e avaliação de impacto |
| **H. Experiência e design** | Arquitetura de informação, acessibilidade, conteúdo e design system |
| **I. Qualidade e operação** | Testes, CI, observabilidade, backups, deploy e suporte |
| **J. Relatórios e documentos** | Histórico, arquivos, relatórios internos e compartilhamento externo |

---

## 6. Roadmap por fases

As fases são marcos de capacidade. Podem ser divididas em sprints menores. Não há duração fixa até que a capacidade da equipe e o estado do código sejam conhecidos.

### Fase 0 — Auditoria, estabilização e proteção do MVP

<badge color="danger">P0</badge> **Objetivo:** confirmar o que existe e remover riscos que impedem evoluir com segurança.

**Entregas**

- Auditoria de confirmação do repositório, schema, migrações e deploy.
- Correção de falhas críticas de autenticação e provisionamento, se confirmadas.
- Autorização no servidor para todas as rotas e mutações existentes.
- Proteção de origem/CSRF adequada ao modelo de sessão.
- Rate limiting nas rotas públicas sensíveis.
- Headers de segurança, política de referrer e `noindex` nas superfícies privadas.
- Validação de variáveis de ambiente e configuração com falha explícita.
- Validação semântica das respostas do briefing.
- Envio atômico com transição de estado consistente.
- Coordenação entre autosave e envio.
- Logs sem tokens, respostas livres ou PII desnecessária.
- CI mínimo com lint, typecheck, testes e build.
- Verificação do PDF no ambiente real de deploy.

**Critérios de saída**

- Achados históricos classificados e backlog atualizado.
- Nenhuma conta não autorizada obtém acesso administrativo.
- Consultas e mutações existentes exigem autenticação/autorização adequada.
- Envio não deixa briefing em estado parcial.
- Respostas inválidas são rejeitadas antes de afetar o diagnóstico.
- CI bloqueia regressões básicas.
- Limitações de deploy, PDF e storage estão documentadas.

**Não fazer nesta fase:** construir novos módulos estratégicos antes de estabilizar os fluxos e dados existentes.

---

### Fase 1 — Fundamentos da organização e colaboração

<badge color="warning">P1</badge> **Objetivo:** transformar o modelo de uma administradora em um espaço de trabalho de equipe.

**Entregas**

- Entidade Organization e associação de usuários por Membership.
- Modelo de papéis e permissões centralizado.
- Convites e entrada controlada de membros.
- Isolamento de dados por organização desde as consultas e mutações.
- Estratégia RLS, se adotada, alinhada ao modelo de membership.
- Cliente associado à organização.
- Projeto/Campanha como unidade de trabalho.
- Responsável principal e colaboradores por projeto.
- Estados e histórico básico do projeto.
- Migração dos dados existentes para uma organização inicial.
- Testes negativos de acesso cruzado entre organizações e projetos.
- Auditoria de mudanças de membros, papéis e permissões.

**Critérios de saída**

- Uma organização pode convidar e administrar membros conforme a matriz aprovada.
- Clientes e projetos pertencem a uma organização.
- Projetos possuem responsável e colaboradores.
- Usuários não acessam dados de outra organização.
- Acesso a projeto respeita papel e participação.
- Dados do MVP são migrados sem perda e com integridade.

**Dependências:** matriz de permissões, escopo de acesso a projetos e política de migração.

---

### Fase 2 — Briefing e diagnóstico versionados

<badge color="warning">P1</badge> **Objetivo:** preservar a origem e a reprodutibilidade da informação estratégica.

**Entregas**

- Briefings vinculados a projetos.
- Suporte a mais de um briefing ao longo da vida de um projeto.
- Catálogo de perguntas versionado.
- Perguntas e regras publicadas como versões imutáveis.
- Snapshot das respostas no envio.
- Versão de catálogo e regras associadas a cada diagnóstico.
- Histórico de envio, revogação, reabertura e reprocessamento.
- Diagnóstico determinístico com explicação e origem dos sinais.
- Revisão humana e aprovação do diagnóstico.
- Reprocessamento criando nova execução, sem sobrescrever diagnóstico aprovado.
- Formulário público com link seguro, autosave, retomada e revisão.
- Testes de compatibilidade com briefings antigos.

**Critérios de saída**

- Mudança no catálogo não altera respostas históricas.
- Cada diagnóstico informa quais respostas e versões contribuíram para o resultado.
- Reprocessamento é rastreável e reproduzível.
- Briefing enviado não aceita autosave indevido.
- Revisão e aprovação ficam registradas.
- Cliente consegue preencher sem criar conta interna.

**Dependências:** Fase 0; organização e projeto da Fase 1.

---

### Fase 3 — Recomendações e priorização estratégica

<badge color="warning">P1</badge> **Objetivo:** transformar o diagnóstico em decisões estratégicas que a equipe pode revisar.

**Entregas**

- Entidade Recommendation persistida.
- Recomendações contextualizadas por sinais, categorias e combinações de respostas.
- Registro da regra e versão que originaram cada recomendação.
- Agrupamento por categoria e objetivo estratégico.
- Estados de revisão: sugerida, em análise, aprovada, ajustada, descartada ou substituída, conforme decisão de produto.
- Prioridade calculada com fatores explícitos.
- Prioridade aprovada separada da prioridade calculada.
- Justificativa, autor, data e histórico de alterações.
- Sugestão de responsáveis e próximos passos sem criar compromissos automaticamente.
- Tratamento de duplicidade, conflito e recomendações de diagnósticos sucessivos.

**Critérios de saída**

- Toda recomendação é explicável e rastreável.
- Equipe pode aceitar, editar ou descartar recomendações conforme permissão.
- Alterações de prioridade preservam cálculo original e justificativa.
- Recomendações não viram tarefas sem confirmação humana.
- Regras de deduplicação e atualização estão documentadas.

**Dependências:** diagnóstico versionado; fórmula e política de priorização aprovadas.

---

### Fase 4 — Planejamento estratégico e execução

<badge color="warning">P1</badge> **Objetivo:** transformar decisões aprovadas em trabalho organizado e acompanhável.

**Entregas**

- Um plano estratégico principal por projeto e suporte a planos complementares.
- Objetivos com descrição, responsável, período e estado.
- Ações vinculadas a objetivos.
- Conversão assistida de recomendações em objetivos, ações e tarefas.
- Revisão humana antes de confirmar a conversão.
- Tarefas com responsáveis, colaboradores, prioridade, prazo e estado.
- Comentários internos, menções e histórico de mudanças.
- Visões por projeto, objetivo, responsável e estado.
- Arquivamento de objetivos cancelados/substituídos com motivo.
- Distinção visual e conceitual entre tarefa concluída e objetivo alcançado.

**Critérios de saída**

- Equipe consegue criar plano a partir de recomendações revisadas.
- Cada objetivo possui responsável e estado.
- Ações e tarefas mantêm relação rastreável com objetivos.
- Alterações relevantes ficam no histórico.
- Conclusão de tarefa não altera automaticamente o resultado do objetivo.
- Permissões são aplicadas a criação, edição, aprovação e arquivamento.

**Dependências:** Fases 1 e 3; decisões de papéis e aprovação.

---

### Fase 5 — Indicadores, evidências e avaliação de impacto

<badge color="warning">P1</badge> **Objetivo:** acompanhar se o trabalho está produzindo os resultados esperados.

**Entregas**

- Definição de indicadores com tipo, unidade e método de atualização.
- Metas com período e histórico de alteração.
- Registro de medições com período de referência, autor e data.
- Validação de medições por pessoa autorizada.
- Evidências anexadas às medições e avaliações.
- Comparação entre linha de base, meta e resultado.
- Avaliação quantitativa e qualitativa do impacto.
- Revisão de objetivos e ações quando metas não forem atingidas.
- Sugestões de ajuste baseadas em regras, sujeitas à aprovação humana.
- Histórico de resultados por projeto e objetivo.

**Critérios de saída**

- Uma medição mantém unidade, período, autor e evidência.
- Metas antigas continuam disponíveis para comparação.
- A equipe consegue avaliar resultados sem depender apenas do status das tarefas.
- Mudanças de meta ou objetivo são rastreáveis.
- Sugestões de ajuste não alteram o plano sem aprovação.

**Dependências:** Fase 4; decisões sobre tipos de indicadores, validação e histórico de metas.

---

### Fase 6 — Histórico, documentos, relatórios e comunicação

<badge color="warning">P1</badge> **Objetivo:** dar contexto ao trabalho, comunicar resultados e fechar o ciclo do projeto.

**Entregas**

- Histórico do cliente com reuniões, decisões, observações e atividades.
- Documentos associados a cliente e projeto, com metadados e controle de acesso.
- Dashboards por organização, cliente, projeto, objetivo e membro.
- Relatórios operacionais, estratégicos e de desempenho.
- Filtros por período, cliente, projeto e responsável.
- Comparações entre meta e resultado.
- Exportações e PDF compatíveis com o ambiente de deploy.
- Compartilhamento de relatórios com escopo explícito, expiração e revogação.
- Relatório final e revisão de encerramento de projeto.
- Arquivamento de projetos com resultados e histórico preservados.

**Critérios de saída**

- Relatórios respeitam organização e permissões.
- Link externo não expõe comentários internos ou outros projetos.
- Compartilhamentos podem ser revogados e expiram conforme política.
- Documentos privados só são acessíveis por usuários autorizados.
- Projeto pode ser encerrado com revisão e relatório final.

**Dependências:** Fases 1 a 5; decisões de compartilhamento externo e retenção.

---

### Fase 7 — Templates, notificações e melhoria contínua

<badge color="info">P2</badge> **Objetivo:** reduzir trabalho repetitivo e facilitar adoção consistente pela equipe.

**Entregas**

- Modelos de projeto/campanha.
- Modelos de briefing, diagnóstico e relatório.
- Duplicação de projetos com regras explícitas sobre o que copiar.
- Recorrência configurável, com confirmação ou criação automática conforme decisão.
- Campos, categorias e estados configuráveis dentro de limites definidos.
- Notificações internas de eventos relevantes.
- Preferências de notificação por usuário.
- Painéis de atividade e pendências.
- Coleta de feedback e análise de uso.
- Experimentos de UX e melhorias com base em evidências.

**Critérios de saída**

- Duplicar um projeto não mistura dados históricos nem responsáveis indevidamente.
- Modelos têm versão e política de atualização.
- Notificações são configuráveis e não geram ruído excessivo.
- Recorrência tem comportamento previsível e auditável.
- Melhorias de produto são priorizadas com dados de uso e feedback.

**Dependências:** fluxos principais estáveis; decisões de templates, recorrência e notificações.

---

### Fase 8 — Integrações e capacidades avançadas (pós-V1)

<badge color="secondary">P3</badge> **Objetivo:** ampliar o ecossistema apenas quando houver demanda comprovada.

Possíveis evoluções:

- Integração com Drive e armazenamento externo.
- Calendários e ferramentas de comunicação.
- CRM e plataformas de automação.
- Plataformas de anúncios e analytics.
- Webhooks e API pública.
- IA assistiva para interpretação e elaboração de recomendações, sempre com revisão humana.
- Benchmarking agregado, somente com base legal, privacidade e volume suficientes.
- Separação de serviços ou infraestrutura adicional quando métricas operacionais justificarem.

**Critério de entrada:** caso de uso validado, demanda recorrente, risco avaliado, custo de manutenção conhecido e benefício superior à complexidade adicionada.

---

## 7. Backlog estruturado por épicos

Os épicos abaixo são unidades de planejamento. As tarefas técnicas devem ser criadas depois da auditoria e refinadas em histórias menores.

| ID | Épico | Resultado | Fase |
|---|---|---|---:|
| EP-00 | Baseline e auditoria | Estado real do repositório e riscos confirmados | 0 |
| EP-01 | Segurança do MVP | Fluxos existentes protegidos | 0 |
| EP-02 | Integridade do briefing | Envio e respostas consistentes | 0 |
| EP-03 | Qualidade e operação mínima | CI, testes e deploy verificável | 0 |
| EP-04 | Organização e membros | Espaço de trabalho com membros e papéis | 1 |
| EP-05 | Clientes e projetos | Estrutura de trabalho por cliente/campanha | 1 |
| EP-06 | Isolamento e autorização | Acesso por organização e projeto | 1 |
| EP-07 | Catálogo versionado | Formulários históricos reproduzíveis | 2 |
| EP-08 | Diagnóstico versionado | Resultado explicável e reprocessável | 2 |
| EP-09 | Revisão do briefing | Aprovação e histórico | 2 |
| EP-10 | Recomendações | Sugestões persistidas e rastreáveis | 3 |
| EP-11 | Priorização | Decisões de prioridade justificadas | 3 |
| EP-12 | Plano e objetivos | Estratégia estruturada por projeto | 4 |
| EP-13 | Ações e tarefas | Execução colaborativa | 4 |
| EP-14 | Indicadores e metas | Medição estruturada | 5 |
| EP-15 | Evidências e impacto | Avaliação de resultados | 5 |
| EP-16 | Histórico e documentos | Contexto contínuo de cliente/projeto | 6 |
| EP-17 | Relatórios e encerramento | Comunicação e fechamento do ciclo | 6 |
| EP-18 | Templates e recorrência | Reutilização de processos | 7 |
| EP-19 | Notificações | Colaboração com alertas relevantes | 7 |
| EP-20 | Integrações e IA assistiva | Expansão pós-V1 | 8 |

---

## 8. Dependências entre fases

```text
Fase 0 — Auditoria e proteção
   ↓
Fase 1 — Organização, permissões, clientes e projetos
   ↓
Fase 2 — Briefing e diagnóstico versionados
   ↓
Fase 3 — Recomendações e priorização
   ↓
Fase 4 — Planejamento e execução
   ↓
Fase 5 — Indicadores e avaliação de impacto
   ↓
Fase 6 — Relatórios, documentos e encerramento
   ↓
Fase 7 — Templates, notificações e melhoria contínua
   ↓
Fase 8 — Integrações e capacidades avançadas
```

Algumas atividades podem ocorrer em paralelo:
- design system e acessibilidade acompanham todas as fases;
- CI, observabilidade e segurança evoluem continuamente;
- privacidade e LGPD são requisitos transversais, não uma entrega isolada;
- testes e documentação acompanham cada módulo;
- relatórios operacionais simples podem surgir antes dos relatórios estratégicos completos, desde que respeitem permissões e qualidade dos dados.

---

## 9. Trilha transversal de experiência e design

A experiência deve acompanhar o crescimento funcional. Não deixar para “embelezar” o produto ao final.

### 9.1 Fundamentos

- Definir identidade visual consistente com `PRODUCT.md`.
- Formalizar tokens semânticos de cor, tipografia, espaçamento, raio e elevação.
- Documentar componentes e estados.
- Manter experiência responsiva e acessível.
- Projetar estados vazios, carregamento, erro, sucesso e permissões insuficientes.
- Garantir linguagem direta, humana e não julgadora.
- Diferenciar visualmente sugestão, decisão aprovada e resultado observado.

### 9.2 Experiência por superfície

| Superfície | Prioridade de UX |
|---|---|
| Formulário público | Clareza, confiança, progresso, autosave e retomada |
| Painel da equipe | Visibilidade de prioridades, pendências e próximos passos |
| Cliente | Histórico e contexto sem virar CRM excessivo |
| Projeto | Visão integrada de briefing, diagnóstico, plano, tarefas e resultados |
| Diagnóstico | Explicabilidade, evidências e revisão humana |
| Objetivos | Progresso estratégico distinto de tarefas concluídas |
| Indicadores | Atualização simples, unidade clara e comparação com meta |
| Relatórios | Síntese, contexto, transparência e compartilhamento seguro |

### 9.3 Acessibilidade

Adotar WCAG 2.2 AA como referência do produto, conforme `PRODUCT.md`.

Checklist contínuo:
- teclado e foco visível;
- estrutura semântica e headings;
- labels e instruções;
- contraste;
- leitor de tela;
- mensagens de estado anunciadas;
- zoom e layouts responsivos;
- alvos de interação adequados;
- respeito a movimento reduzido.

---

## 10. Segurança, privacidade e operação como trabalho contínuo

Não concentrar segurança e LGPD em uma única fase. Cada épico deve incluir seus requisitos transversais.

### Segurança

- autenticação e autorização no servidor;
- isolamento por organização e projeto;
- princípio do menor privilégio;
- validação de entrada;
- rate limiting e proteção de origem;
- gestão de segredos;
- links externos seguros, expirados e revogáveis;
- arquivos privados;
- auditoria de ações críticas.

### Privacidade

- minimização de dados;
- aviso de privacidade e base legal adequada;
- retenção por categoria;
- acesso, correção, exportação e exclusão/anonimização quando aplicáveis;
- logs sem dados pessoais desnecessários;
- gestão de suboperadores;
- documentação do ciclo de vida dos dados.

Consentimento não deve ser tratado como base legal universal. A aplicação de cada base legal e os prazos de retenção precisam de validação adequada ao contexto.

### Operação

- CI com lint, typecheck, testes e build;
- testes de integração com PostgreSQL;
- E2E da jornada principal;
- logs estruturados e request ID;
- error tracking e health checks;
- alertas para falhas importantes;
- backups automáticos e testes de restauração;
- runbooks;
- RPO/RTO definidos com base no impacto de negócio e capacidade da infraestrutura.

---

## 11. Decisões de produto que bloqueiam refinamento técnico

As decisões abaixo já estão identificadas nos requisitos e na arquitetura. Devem ser fechadas antes de implementar os respectivos módulos.

| Decisão pendente | Impacto | Fase limite |
|---|---|---:|
| Matriz detalhada de permissões | Políticas de acesso e interface | 1 |
| Escopo de acesso a projetos: individual, equipe ou ambos | Consultas e autorização | 1 |
| Fórmula, pesos e escalas de prioridade | Cálculo e histórico | 3 |
| Deduplicação e versionamento de recomendações | Persistência e atualização | 3 |
| Tipos, unidades e validação de indicadores | Schema e medições | 5 |
| Quem valida medições e em quais condições | Autorização e fluxo | 5 |
| Compartilhamento externo de relatórios | Token, expiração, escopo e autenticação | 6 |
| Herança e duplicação de modelos | Comportamento de templates | 7 |
| Recorrência: criação automática ou confirmação | Jobs e ciclo de vida | 7 |
| Eventos e preferências de notificação | Canais e regras | 7 |
| Política de arquivamento e exclusão | Integridade e privacidade | Transversal |
| RPO/RTO e retenção de backup | Operação e custo | 0–6 |

---

## 12. Definition of Ready

Uma história está pronta para desenvolvimento quando:

- [ ] Está ligada a um requisito ou problema observado.
- [ ] Tem usuário/ator e contexto definidos.
- [ ] Tem resultado esperado e critério de aceite verificável.
- [ ] Dependências de produto e arquitetura estão identificadas.
- [ ] Regras de permissão e organização foram consideradas.
- [ ] Estados de erro, vazio e carregamento foram pensados.
- [ ] Impacto em dados, migrações e histórico foi avaliado.
- [ ] Decisões pendentes foram resolvidas ou explicitamente isoladas.
- [ ] Escopo cabe em uma entrega revisável.

---

## 13. Definition of Done

Uma entrega só está pronta quando:

- [ ] Critérios de aceite foram atendidos.
- [ ] Regras de negócio estão no domínio/caso de uso adequado.
- [ ] Autenticação, autorização e isolamento foram testados.
- [ ] Entradas são validadas no servidor.
- [ ] Transações e concorrência foram avaliadas.
- [ ] Histórico/auditoria foi implementado quando necessário.
- [ ] Testes automatizados cobrem caminho feliz e falhas relevantes.
- [ ] Lint, typecheck, testes e build passam no CI.
- [ ] Interface é responsiva e acessível.
- [ ] Logs não expõem tokens ou PII desnecessária.
- [ ] Migração, rollback e compatibilidade foram avaliados.
- [ ] Documentação de produto, requisitos, arquitetura e roadmap foi atualizada.
- [ ] Impacto operacional e de privacidade foi considerado.

---

## 14. Métricas de sucesso e revisão do roadmap

Revisar o roadmap ao final de cada fase e sempre que houver mudança significativa de escopo.

### Perguntas para a revisão

1. A fase entregou uma capacidade utilizável de ponta a ponta?
2. A equipe consegue executar o fluxo sem depender de contornos manuais?
3. O produto ficou mais seguro e rastreável?
4. Há evidência de uso e valor?
5. O que deve ser simplificado, adiado ou removido?
6. Alguma decisão pendente bloqueia a fase seguinte?
7. O roadmap ainda reflete `PRODUCT.md` e `02-requisitos.md`?

### Regras de mudança

- Não adicionar uma funcionalidade apenas porque é tecnicamente interessante.
- Não antecipar IA ou integração sem caso de uso validado.
- Não ampliar personalização antes de estabilizar o fluxo padrão.
- Não sacrificar isolamento e integridade para acelerar interface.
- Atualizar este roadmap quando uma decisão de produto alterar sequência, dependência ou escopo.

---

## 15. Mapa de rastreabilidade dos documentos

| Documento | Responsabilidade | Como influencia o roadmap |
|---|---|---|
| `PRODUCT.md` | Visão, usuários, problema, princípios, limites e direção | Define o resultado que as fases devem construir |
| `02-requisitos.md` | Atores, requisitos, regras, dados, segurança e critérios de aceite | Define o comportamento e o que precisa ser validado |
| `03-inspecao-e-arquitetura.md` | Estado técnico histórico, arquitetura-alvo, riscos e evolução | Define dependências e abordagem técnica |
| `04-roadmap-melhorias.md` | Sequenciamento e acompanhamento das entregas | Organiza fases, épicos, critérios e decisões |

### Regras de consistência

- Se o roadmap propuser algo que não está na visão do produto, revisar antes de implementar.
- Se um requisito mudar, avaliar impacto nas fases e dependências.
- Se a arquitetura mudar, atualizar os épicos e critérios técnicos.
- Se o código divergir dos documentos, registrar o estado real e decidir se o documento ou o código deve mudar.
- Não manter estimativas, métricas ou decisões antigas como verdade sem validação.

---

## 16. Próxima atividade recomendada

A próxima atividade não é começar todos os módulos. É executar a **Fase 0 — Auditoria, estabilização e proteção do MVP**.

Ordem sugerida:

1. confirmar commit, branch e alterações locais;
2. revisar schema Prisma e migrações;
3. auditar autenticação, autorização e escopo das rotas;
4. validar autosave, envio e reprocessamento;
5. executar a suíte de testes e identificar lacunas;
6. verificar CI, deploy, PDF, storage e variáveis de ambiente;
7. classificar achados e converter apenas problemas confirmados em tarefas;
8. revisar a matriz de permissões necessária à Fase 1.

**Recomendação final:** construir a plataforma por capacidades completas e conectadas. Primeiro garantir que a equipe possa trabalhar com segurança em organizações, clientes e projetos; depois conectar briefing e diagnóstico a recomendações, planejamento, execução e resultados. Isso preserva a identidade do produto e evita que ele se transforme em um conjunto de telas sem uma jornada estratégica coerente.
