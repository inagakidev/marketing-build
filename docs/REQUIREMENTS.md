# Briefing Inteligente — Documento de Requisitos

> **Versão:** 2.0  
> **Data:** 13/11/2026  
> **Status:** Requisitos-alvo da V1; decisões pendentes identificadas  
> **Produto de referência:** `PRODUCT.md`  
> **Documento complementar:** `03-inspecao-e-arquitetura.md` e `04-roadmap-melhorias.md`

Este documento traduz a visão de `PRODUCT.md` em requisitos funcionais, regras de negócio, requisitos não funcionais e critérios de aceite.

## Como interpretar este documento

A plataforma está evoluindo de um MVP de briefing e diagnóstico para uma plataforma de gestão estratégica de marketing. Por isso, este documento diferencia:

- **Estado atual conhecido:** capacidades descritas na documentação anterior do MVP. Não significa que tenham sido revalidadas no código nesta revisão.
- **Alvo da V1:** capacidades necessárias para cumprir a jornada estratégica completa.
- **Prioridade:** importância para a entrega da V1, não uma afirmação de que o requisito já foi implementado.

Prioridades:
- **Must:** necessário para a jornada principal da V1.
- **Should:** importante para operação consistente; pode ser entregue em incremento posterior da V1.
- **Could:** melhoria desejável, condicionada a validação e capacidade.
- **Won't:** fora do escopo atual.

Critérios de aceite devem ser verificáveis. Quando uma decisão ainda não foi tomada, o requisito indica **Pendente de decisão**, sem inventar comportamento.

---

## 1. Objetivo e escopo

### 1.1 Objetivo

Permitir que equipes de marketing gerenciem a jornada estratégica de clientes e projetos em um único ambiente: coleta de briefing, diagnóstico, análise humana, recomendações, priorização, planejamento, execução, acompanhamento de indicadores e avaliação de resultados.

### 1.2 Escopo funcional da V1

1. Organização, autenticação, membros, funções e permissões.
2. Cadastro e histórico contextual de clientes.
3. Projetos/campanhas, responsáveis e colaboradores.
4. Criação e ciclo de vida de briefings e links públicos.
5. Formulário adaptativo, autosave e retomada.
6. Diagnóstico determinístico, versionado e explicável.
7. Análise humana, recomendações e priorização.
8. Aprovação e conversão assistida de recomendações em objetivos, ações e tarefas.
9. Planos estratégicos, execução e revisão.
10. Indicadores, medições, evidências e resultados.
11. Documentos e comunicação interna contextual.
12. Dashboards, relatórios e compartilhamento externo controlado.
13. Modelos, duplicação e recorrência configurável.
14. Segurança, privacidade, auditoria, backup e observabilidade.

### 1.3 Fora do escopo da V1

- CRM completo e automação comercial.
- Automação de campanhas, anúncios ou publicação em redes sociais.
- Portal completo de autoatendimento para clientes.
- IA generativa como autoridade autônoma de diagnóstico, priorização ou decisão.
- Integrações externas em larga escala.
- Aplicativo mobile nativo.
- White-label por cliente, billing e marketplace.
- Microserviços, GraphQL ou event sourcing sem justificativa arquitetural.
- Construtor irrestrito de regras de negócio.
- Benchmarking externo sem dados confiáveis e comparáveis.

### 1.4 Diretriz de entrega

A V1 deve cobrir a jornada estratégica de ponta a ponta, mas pode entregar cada módulo com profundidade inicial controlada. A simplificação não pode quebrar a conexão entre briefing, diagnóstico, recomendações, plano, execução e resultados.

---

## 2. Atores, funções e autorização

### 2.1 Atores

| Ator | Autenticação | Escopo |
|---|---|---|
| Administrador da organização | Conta autenticada | Configura organização, membros, funções, permissões e parâmetros |
| Líder | Conta autenticada | Acompanha equipe e projetos, distribui responsabilidades e executa aprovações permitidas |
| Integrante | Conta autenticada | Trabalha em projetos e atividades aos quais recebeu acesso |
| Cliente/respondente | Token de link | Responde briefing sem criar conta |
| Cliente destinatário de relatório | Link compartilhado | Visualiza somente o relatório autorizado |
| Sistema | Contexto interno | Executa regras, cálculos, notificações e rotinas autorizadas |

### 2.2 Requisitos de autorização

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| AUTH-01 | Autenticar membros por provedor de autenticação confiável. | Must | Rotas privadas exigem sessão válida no servidor. |
| AUTH-02 | Não oferecer cadastro público irrestrito de membros ou organizações na V1. | Must | Provisionamento ocorre por convite ou ação administrativa autorizada. |
| AUTH-03 | Cada membro pertence a uma organização por associação explícita. | Must | O contexto organizacional é validado em toda operação. |
| AUTH-04 | Suportar funções conceituais de administrador, líder e integrante. | Must | Cada função possui permissões definidas e testadas. |
| AUTH-05 | Permitir que o administrador configure quais funções podem executar ações sensíveis. | Must | Aprovações e alterações protegidas respeitam a configuração. |
| AUTH-06 | Aplicar autorização no servidor e na camada de dados, não apenas na interface. | Must | Requisições diretas sem permissão retornam 403 ou resposta de não existência conforme política. |
| AUTH-07 | Permitir responsável principal e colaboradores por projeto. | Must | Atribuições são persistidas e exibidas no projeto. |
| AUTH-08 | Restringir ações por escopo de projeto quando aplicável. | Must | Integrante sem acesso não lê nem altera o projeto. |
| AUTH-09 | Registrar autor, data e contexto das ações relevantes. | Must | Eventos auditáveis possuem identidade do ator e entidade afetada. |
| AUTH-10 | Suportar múltiplas funções por membro, se permitido pela configuração. | Should | Combinação de permissões segue regra documentada e testada. |
| AUTH-11 | Permitir convite, revogação de acesso e desativação de membro. | Must | Membro desativado perde acesso sem apagar histórico de autoria. |
| AUTH-12 | Evitar que a remoção de um membro apague autoria ou histórico. | Must | Registros preservam referência histórica, mesmo após desativação. |

**Pendente de decisão:** matriz detalhada de permissões por função e ação; regra de combinação quando um membro possui mais de uma função; se líderes podem convidar membros; se haverá acesso por projeto, equipe ou ambos.

---

## 3. Organização, clientes e projetos

### 3.1 Organização e isolamento

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| ORG-01 | Toda entidade de negócio pertence a uma organização. | Must | Registros centrais possuem vínculo organizacional obrigatório. |
| ORG-02 | A V1 pode iniciar com uma organização, mas o modelo deve suportar múltiplas organizações independentes. | Must | O isolamento não depende de filtros exclusivamente na interface. |
| ORG-03 | Consultas e mutações validam a organização ativa e a autorização do membro. | Must | Testes comprovam que uma organização não acessa dados de outra. |
| ORG-04 | Configurações e modelos pertencem à organização, salvo catálogo explicitamente global. | Must | Configurações não vazam entre organizações. |

### 3.2 Clientes

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| CLI-01 | Criar cliente com dados essenciais e campos opcionais. | Must | Campos obrigatórios são validados; cliente é associado à organização. |
| CLI-02 | Editar dados do cliente conforme permissão. | Must | Alterações persistem e entram no histórico quando relevantes. |
| CLI-03 | Arquivar cliente sem destruir seu histórico estratégico. | Must | Cliente arquivado deixa de aparecer nas listas ativas, mas seus projetos permanecem consultáveis por usuários autorizados. |
| CLI-04 | Listar, buscar, filtrar e paginar clientes. | Should | Busca e filtros são estáveis e respeitam organização/permissões. |
| CLI-05 | Associar múltiplos projetos ao mesmo cliente. | Must | Detalhe do cliente lista seus projetos e respectivos estados. |
| CLI-06 | Exibir visão consolidada do relacionamento. | Must | Histórico apresenta reuniões, observações, decisões, documentos, projetos e resultados autorizados. |
| CLI-07 | Registrar reunião, observação, interação ou decisão. | Must | Registro contém tipo, conteúdo, autor e data; pode ser associado a cliente e projeto. |
| CLI-08 | Não exigir equipe fixa no cadastro do cliente. | Must | Responsáveis e colaboradores são definidos no projeto. |

### 3.3 Projetos e campanhas

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| PROJ-01 | Criar projeto/campanha vinculado a um cliente. | Must | Projeto possui organização, cliente, nome e status. |
| PROJ-02 | Definir responsável principal e colaboradores. | Must | Responsável e colaboradores são membros ativos da organização. |
| PROJ-03 | Registrar descrição, contexto, período e status do projeto. | Must | Campos são consultáveis e aparecem no detalhe. |
| PROJ-04 | Associar briefings, diagnósticos, recomendações, planos, documentos e relatórios ao projeto. | Must | Elementos relacionados são acessíveis a partir do projeto, respeitando permissão. |
| PROJ-05 | Permitir mais de um briefing por projeto. | Must | Cada briefing mantém ciclo de vida e versão próprios. |
| PROJ-06 | Distinguir status operacional do projeto e situação dos objetivos. | Must | O projeto não é considerado concluído apenas porque tarefas foram fechadas. |
| PROJ-07 | Encerrar projeto por fluxo de revisão e aprovação. | Must | Encerramento exige revisão dos objetivos, resultados e relatório final. |
| PROJ-08 | Reabrir projeto encerrado mediante permissão e justificativa. | Should | Reabertura registra autor, data e motivo. |
| PROJ-09 | Permitir projetos complementares vinculados ao cliente. | Must | Projetos coexistem sem sobrescrever histórico de outros projetos. |

---

## 4. Briefings e experiência pública

### 4.1 Criação e ciclo de vida

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| BRF-01 | Criar briefing associado a cliente e projeto. | Must | Briefing não pode existir sem organização, cliente e projeto válidos. |
| BRF-02 | Gerar link público com token opaco e único. | Must | Token não deriva de ID, nome, e-mail ou dado previsível. |
| BRF-03 | Configurar validade do link. | Must | Link expirado bloqueia leitura de formulário e escrita. |
| BRF-04 | Revogar e regenerar link. | Must | Token antigo deixa de funcionar imediatamente após revogação/regeneração. |
| BRF-05 | Permitir copiar e compartilhar link manualmente. | Must | Link completo é exibido apenas a membros autorizados. |
| BRF-06 | Distinguir link inválido, expirado, revogado e briefing enviado. | Must | Cada estado apresenta resposta e mensagem apropriadas. |
| BRF-07 | Permitir vários briefings por cliente e por projeto. | Must | Cada instância tem respostas, status, diagnóstico e versão independentes. |
| BRF-08 | Impedir edição pública após envio. | Must | Autosave e novo envio não alteram dados após fechamento. |
| BRF-09 | Manter histórico de criação, envio, expiração, revogação e regeneração. | Must | Eventos são consultáveis por usuário autorizado. |
| BRF-10 | Versionar o catálogo aplicado a cada briefing. | Must | Alterações futuras no catálogo não mudam perguntas de briefings já iniciados. |

### 4.2 Formulário adaptativo

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| FORM-01 | Exibir boas-vindas, etapas, tempo estimado e aviso de salvamento. | Must | Respondente entende finalidade, progresso e funcionamento. |
| FORM-02 | Organizar perguntas em seções e etapas. | Must | Navegação é clara em mobile e desktop. |
| FORM-03 | Exibir perguntas condicionais por regras orientadas a dados. | Must | Perguntas aparecem apenas quando as condições são verdadeiras. |
| FORM-04 | Permitir tipos de resposta definidos pelo catálogo. | Must | Texto curto, texto longo, escolha única e múltipla escolha funcionam. |
| FORM-05 | Validar respostas conforme tipo, opções e limites definidos. | Must | Respostas incompatíveis são rejeitadas no servidor. |
| FORM-06 | Salvar automaticamente as respostas. | Must | Alterações persistem e falhas de rede são comunicadas ao respondente. |
| FORM-07 | Retomar preenchimento usando o mesmo link válido. | Must | Respostas previamente salvas são restauradas. |
| FORM-08 | Exigir obrigatórias apenas quando visíveis. | Must | Perguntas de ramificações não exibidas não bloqueiam o envio. |
| FORM-09 | Ignorar respostas de perguntas que se tornaram invisíveis. | Must | Respostas ocultas não alimentam diagnóstico ou validação final. |
| FORM-10 | Permitir revisão antes do envio. | Must | Respondente pode voltar e corrigir respostas antes da confirmação. |
| FORM-11 | Exibir confirmação após envio concluído. | Must | A confirmação só aparece após persistência bem-sucedida. |
| FORM-12 | Impedir envio incompleto. | Must | Servidor valida todas as obrigatórias visíveis antes de fechar o briefing. |
| FORM-13 | Tornar o formulário acessível por teclado e leitor de tela. | Must | Fluxo principal pode ser completado sem mouse. |
| FORM-14 | Evitar exposição de notas, dados internos e diagnóstico no payload público. | Must | Inspeção de respostas da API não revela dados internos. |

### 4.3 Regras de formulário preservadas do MVP

- A visibilidade é definida por dados, não por condicionais dispersas na interface.
- Uma pergunta só depende de respostas anteriores na ordem do catálogo.
- Respostas invisíveis não participam do diagnóstico.
- Perguntas obrigatórias só são exigidas quando visíveis.
- Limpar resposta remove o valor vigente.
- Deve existir uma resposta vigente por pergunta e briefing.
- O envio é uma transição atômica.
- Reenvio idempotente não duplica diagnóstico.
- Token é credencial: forte, opaco, expirável e revogável.
- O payload público contém somente os dados necessários à resposta.

---

## 5. Diagnóstico determinístico

### 5.1 Requisitos

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| DIA-01 | Executar diagnóstico a partir das respostas válidas e visíveis. | Must | Mesmas respostas e mesma versão de regras produzem o mesmo resultado. |
| DIA-02 | Manter motor determinístico na V1, sem dependência de IA generativa. | Must | Diagnóstico pode ser reproduzido em teste automatizado. |
| DIA-03 | Avaliar as categorias Posicionamento, Público, Oferta, Presença digital e Marketing atual. | Must | Cada categoria retorna estado e dados de avaliação. |
| DIA-04 | Executar as regras de sinais cadastradas e versionadas. | Must | Cada regra possui teste e documentação de condição. |
| DIA-05 | Classificar sinais por severidade. | Must | Severidade e penalidade aplicadas são persistidas. |
| DIA-06 | Rastrear sinais às respostas que os originaram. | Must | Cada sinal contém referências válidas às respostas do briefing. |
| DIA-07 | Diferenciar ausência de dados de resultado negativo. | Must | Categoria sem dados obrigatórios fica como insuficiente, não vermelha. |
| DIA-08 | Exibir explicação para categoria sem dados suficientes. | Must | Painel informa quais respostas obrigatórias estão faltando. |
| DIA-09 | Preservar diagnóstico gerado no envio. | Must | Resultado histórico não muda por leitura ou atualização de tela. |
| DIA-10 | Permitir reprocessamento explícito e autorizado. | Must | Reprocessamento registra versão de regras, ator, data e resultado. |
| DIA-11 | Preservar versões anteriores ou histórico de reprocessamento. | Must | É possível identificar qual resultado foi gerado por cada execução. |
| DIA-12 | Permitir análise humana e observações sobre o diagnóstico. | Must | Observações são associadas ao projeto/diagnóstico e possuem autoria. |
| DIA-13 | Permitir revisão e aprovação do diagnóstico/briefing conforme permissão. | Must | Apenas funções autorizadas podem aprovar; ação é auditada. |

### 5.2 Parâmetros atuais do motor

A documentação do MVP registra os seguintes parâmetros. Eles devem ser tratados como configuração versionada, não como valores imutáveis:

- Pontuação inicial por categoria: 100.
- Penalidade leve: 15.
- Penalidade moderada: 25.
- Penalidade forte: 40.
- Verde: 80–100.
- Amarelo: 50–79.
- Vermelho: 0–49.
- Cinza: dados obrigatórios insuficientes.

O cálculo e a regra de combinação de sinais devem ser preservados ou alterados somente por decisão documentada e testes de regressão.

---

## 6. Recomendações e priorização

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| REC-01 | Gerar recomendações por regras determinísticas e contexto. | Must | Recomendações consideram sinais, respostas e categorias relevantes. |
| REC-02 | Registrar a origem de cada recomendação. | Must | Recomendação aponta para regras, sinais e evidências que a motivaram. |
| REC-03 | Agrupar recomendações por categoria diagnóstica. | Must | Usuário consegue consultar recomendações por categoria. |
| REC-04 | Agrupar recomendações em objetivos estratégicos. | Must | Cada recomendação pode ser relacionada a um objetivo. |
| REC-05 | Permitir edição e personalização humana. | Must | Alterações preservam sugestão original e histórico. |
| REC-06 | Calcular prioridade combinando severidade, impacto, urgência e esforço. | Must | Sistema apresenta critérios considerados e resultado calculado. |
| REC-07 | Permitir sugestão de mudança de prioridade por integrante autorizado. | Must | Solicitação registra valor sugerido e justificativa. |
| REC-08 | Exigir confirmação por pessoa com permissão. | Must | Prioridade efetiva só muda após aprovação. |
| REC-09 | Preservar prioridade calculada originalmente. | Must | Histórico permite comparar prioridade original e atual. |
| REC-10 | Evitar recomendações duplicadas ou conflitantes no mesmo contexto. | Should | Regras de deduplicação são aplicadas e testadas. |
| REC-11 | Versionar regras de recomendação. | Must | É possível saber qual versão gerou cada recomendação. |

**Pendente de decisão:** fórmula e pesos da prioridade; escala de impacto/urgência/esforço; critérios de desempate; política de deduplicação; comportamento quando regras novas substituem recomendações antigas.

---

## 7. Planejamento, objetivos e execução

### 7.1 Planos

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| PLAN-01 | Criar um plano estratégico principal por projeto. | Must | Projeto possui no máximo um plano principal ativo, conforme regra definida. |
| PLAN-02 | Permitir planos complementares vinculados ao projeto. | Must | Plano complementar mantém vínculo com projeto e objetivos relacionados. |
| PLAN-03 | Organizar plano em objetivos estratégicos. | Must | Objetivos possuem posição, status e contexto no plano. |
| PLAN-04 | Converter recomendações aprovadas em propostas de objetivos e ações. | Must | Sistema apresenta sugestões antes de criar registros de execução. |
| PLAN-05 | Sugerir tarefas, responsáveis, prioridades e prazos quando houver dados suficientes. | Should | Sugestões são editáveis e não são confirmadas automaticamente. |
| PLAN-06 | Exigir revisão humana antes de criar compromissos. | Must | Nenhuma tarefa sugerida entra em execução sem confirmação. |
| PLAN-07 | Permitir duplicar planos/modelos. | Should | Duplicação informa quais dados serão copiados e quais serão reiniciados. |

### 7.2 Objetivos

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| OBJ-01 | Criar objetivo com nome, descrição, responsável e status. | Must | Objetivo pertence a um plano e projeto. |
| OBJ-02 | Relacionar objetivo a recomendações e diagnóstico. | Must | Usuário consegue rastrear a origem estratégica do objetivo. |
| OBJ-03 | Definir meta e indicadores associados. | Must | Meta possui valor, unidade e contexto definidos. |
| OBJ-04 | Acompanhar status e progresso das ações relacionadas. | Must | Progresso operacional é exibido separadamente do resultado. |
| OBJ-05 | Manter histórico de alterações. | Must | Alterações relevantes registram autor, data e valores anteriores/novos. |
| OBJ-06 | Revisar objetivo que não atingiu a meta. | Must | Equipe pode revisar objetivo e ações, registrando justificativa. |
| OBJ-07 | Apresentar sugestões automáticas de ajuste por regras. | Should | Sugestão é explicável e exige aprovação humana. |
| OBJ-08 | Arquivar objetivo cancelado ou substituído. | Must | Registro preserva motivo, responsável, data e impacto. |
| OBJ-09 | Distinguir objetivo concluído de objetivo atingido. | Must | Status operacional não implica automaticamente meta alcançada. |

### 7.3 Ações e tarefas

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| TASK-01 | Criar ações vinculadas a objetivos. | Must | Ação possui objetivo e projeto relacionados. |
| TASK-02 | Dividir ações em tarefas. | Must | Tarefa pertence a uma ação e mantém contexto estratégico. |
| TASK-03 | Atribuir responsável e colaboradores. | Must | Atribuições só aceitam membros autorizados. |
| TASK-04 | Definir prioridade, prazo, descrição e status. | Must | Campos são exibidos no detalhe e nas listas. |
| TASK-05 | Registrar atualizações e histórico de status. | Must | Mudanças relevantes possuem autor e data. |
| TASK-06 | Permitir comentários e menções em tarefas. | Should | Comentários respeitam acesso ao projeto e notificam mencionados. |
| TASK-07 | Filtrar tarefas por responsável, projeto, status, prioridade e prazo. | Should | Filtros não expõem tarefas fora do escopo do usuário. |
| TASK-08 | Não calcular sucesso estratégico apenas por tarefas concluídas. | Must | Dashboard e relatórios apresentam métricas operacionais e estratégicas separadas. |

### 7.4 Encerramento de projeto

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| CLOSE-01 | Iniciar fluxo de encerramento com revisão dos objetivos. | Must | Sistema apresenta situação dos objetivos e indicadores. |
| CLOSE-02 | Registrar resultados, evidências e aprendizados. | Must | Encerramento contém resumo de resultados e observações. |
| CLOSE-03 | Exigir aprovação por função autorizada. | Must | Projeto só muda para encerrado após aprovação válida. |
| CLOSE-04 | Gerar relatório final do projeto. | Must | Relatório reúne objetivos, ações, indicadores, resultados e decisões. |
| CLOSE-05 | Preservar histórico após encerramento. | Must | Dados permanecem consultáveis conforme política de retenção. |

---

## 8. Indicadores, medições e evidências

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| MET-01 | Associar indicadores a objetivos. | Must | Indicador não fica sem contexto estratégico. |
| MET-02 | Definir nome, descrição, unidade, valor inicial e meta. | Must | Campos essenciais são validados. |
| MET-03 | Configurar método de atualização por indicador. | Must | Método selecionado é exibido e respeitado pelo fluxo. |
| MET-04 | Permitir atualização manual na V1. | Must | Integrante autorizado registra nova medição. |
| MET-05 | Não impor frequência obrigatória global de atualização. | Must | Indicador pode ser atualizado quando a equipe decidir. |
| MET-06 | Permitir que integrante autorizado registre resultado. | Must | Registro identifica autor e data. |
| MET-07 | Exigir validação por responsável autorizado. | Must | Medição pode ficar pendente até validação. |
| MET-08 | Manter histórico de medições. | Must | Valores anteriores não são sobrescritos sem histórico. |
| MET-09 | Anexar evidências e observações. | Must | Evidência fica associada à medição e respeita permissões. |
| MET-10 | Comparar situação inicial, meta e resultado observado. | Must | Visualização mostra os três valores quando disponíveis. |
| MET-11 | Registrar avaliação qualitativa da equipe. | Must | Avaliação possui autor e data. |
| MET-12 | Evitar inferência automática de causalidade. | Must | Relatórios distinguem correlação temporal de impacto comprovado. |
| MET-13 | Permitir integração futura para atualização automática. | Could | Arquitetura não acopla o domínio a um provedor específico. |

**Pendente de decisão:** catálogo de tipos de indicadores, formatos numéricos/textuais, tratamento de metas alteradas, unidades, validação e permissões de aprovação.

---

## 9. Histórico, documentos e comunicação

### 9.1 Histórico do cliente

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| HIST-01 | Registrar reuniões, observações, interações e decisões. | Must | Cada registro possui tipo, conteúdo, autor, data e associação. |
| HIST-02 | Exibir projetos e resultados no histórico do cliente. | Must | Usuário autorizado consulta a linha do tempo contextual. |
| HIST-03 | Permitir relacionar um registro a cliente e projeto. | Must | Registro aparece nos contextos relacionados. |
| HIST-04 | Preservar histórico quando responsável ou equipe mudar. | Must | Autoria original permanece identificável. |

### 9.2 Documentos

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| DOC-01 | Anexar documento a cliente ou projeto. | Must | Arquivo possui associação e metadados. |
| DOC-02 | Registrar categoria, descrição, autor e data. | Must | Metadados são consultáveis. |
| DOC-03 | Restringir visualização e download por permissão. | Must | Usuário sem acesso não obtém arquivo por URL direta. |
| DOC-04 | Validar tipo e tamanho de arquivo. | Must | Upload rejeita formato ou tamanho não permitido. |
| DOC-05 | Registrar remoção/substituição de documento. | Should | Histórico mantém evento e responsável. |

### 9.3 Comunicação interna

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| COM-01 | Permitir comentários em projetos, objetivos e tarefas. | Must | Comentário mantém contexto e autoria. |
| COM-02 | Permitir menções a membros. | Should | Menção gera notificação para destinatário autorizado. |
| COM-03 | Notificar eventos relevantes. | Should | Notificação respeita preferências e permissões. |
| COM-04 | Exibir central de atividades. | Should | Usuário consulta eventos relevantes do seu escopo. |
| COM-05 | Não enviar conteúdo privado a destinatário sem acesso ao contexto. | Must | Verificação de autorização ocorre antes de notificar ou abrir link. |

---

## 10. Dashboards e relatórios

### 10.1 Dashboards por função

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| DASH-01 | Exibir visão geral para administrador. | Must | Mostra clientes, projetos, equipe, aprovações e indicadores da organização. |
| DASH-02 | Exibir visão de equipe/projetos para líder. | Must | Líder vê somente equipes e projetos autorizados. |
| DASH-03 | Exibir visão de trabalho para integrante. | Must | Integrante vê projetos, tarefas, objetivos e pendências acessíveis. |
| DASH-04 | Diferenciar atividades, entregas, resultados e impacto. | Must | Métricas não são agregadas como se fossem equivalentes. |
| DASH-05 | Permitir filtros por período, cliente, projeto e integrante. | Should | Filtros atualizam todos os componentes relacionados. |

### 10.2 Relatórios

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| REP-01 | Gerar relatório operacional. | Must | Apresenta situação de projetos, tarefas, responsáveis e prazos. |
| REP-02 | Gerar relatório estratégico. | Must | Apresenta diagnóstico, recomendações, objetivos e resultados. |
| REP-03 | Gerar relatório de desempenho. | Must | Apresenta indicadores, metas, medições e evidências. |
| REP-04 | Filtrar relatórios por período, cliente, projeto e integrante. | Should | Filtros respeitam autorização. |
| REP-05 | Oferecer tabelas, gráficos, comparações e exportação. | Should | Dados exibidos correspondem ao filtro e período selecionados. |
| REP-06 | Compartilhar relatório específico com cliente. | Must | Compartilhamento expõe somente o conteúdo selecionado e autorizado. |
| REP-07 | Permitir expirar e revogar compartilhamento. | Must | Link revogado/expirado deixa de exibir relatório. |
| REP-08 | Auditar criação e acesso ao compartilhamento, quando tecnicamente possível. | Should | Eventos de compartilhamento ficam registrados. |

**Pendente de decisão:** mecanismo de compartilhamento (PDF, link protegido ou ambos), autenticação do destinatário, validade padrão, revogação, escopo de conteúdo e registro de visualizações.

---

## 11. Modelos, personalização e recorrência

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| TMP-01 | Criar e reutilizar modelos de projeto/campanha. | Should | Modelo pode iniciar um novo projeto sem copiar dados pessoais indevidos. |
| TMP-02 | Duplicar projeto com seleção de conteúdo a copiar. | Should | Usuário revisa dados herdados antes de confirmar. |
| TMP-03 | Configurar recorrência de projetos. | Should | Regra de recorrência é visível e pode ser pausada/cancelada. |
| TMP-04 | Personalizar campos, status e categorias. | Must | Alterações respeitam permissões e validações do domínio. |
| TMP-05 | Personalizar modelos de briefing, diagnóstico e relatório. | Should | Modelo possui versão e não altera instâncias já iniciadas. |
| TMP-06 | Preservar integridade de projetos existentes após mudança de modelo. | Must | Mudança não modifica silenciosamente projetos em andamento. |
| TMP-07 | Definir comportamento de herança e reinicialização na duplicação. | Must | Sistema informa o que será copiado, reiniciado ou solicitado novamente. |

**Pendente de decisão:** recorrência cria projetos automaticamente ou sugere a criação; como mudanças em modelos afetam instâncias existentes; quais campos são obrigatórios e quais são personalizáveis.

---

## 12. Segurança, privacidade e auditoria

### 12.1 Segurança

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| SEC-01 | Validar sessão em todas as rotas privadas no servidor. | Must | Testes de acesso sem sessão retornam 401. |
| SEC-02 | Aplicar autorização por organização, função e escopo. | Must | Testes cobrem acesso permitido e negado. |
| SEC-03 | Isolar dados entre organizações na camada de dados. | Must | Testes negativos comprovam isolamento. |
| SEC-04 | Proteger links públicos com tokens de alta entropia. | Must | Token não é enumerável nem derivado de dados pessoais. |
| SEC-05 | Implementar expiração e revogação de links. | Must | Token bloqueado não lê nem altera dados. |
| SEC-06 | Aplicar rate limiting em rotas públicas e sensíveis. | Must | Excesso retorna 429 com política de retry. |
| SEC-07 | Validar entradas no servidor. | Must | Payloads inválidos são rejeitados antes de persistir. |
| SEC-08 | Proteger mutações contra CSRF e abuso de origem. | Must | Origem não autorizada é bloqueada. |
| SEC-09 | Manter segredos exclusivamente no servidor. | Must | Nenhum segredo aparece em bundle, logs ou payload público. |
| SEC-10 | Aplicar cabeçalhos de segurança e políticas de conteúdo. | Must | CSP, HSTS, Referrer-Policy e demais cabeçalhos são testados. |
| SEC-11 | Proteger arquivos e relatórios compartilhados. | Must | URLs não autorizadas não permitem acesso ao conteúdo. |
| SEC-12 | Registrar eventos de segurança relevantes. | Must | Falhas de autenticação, alterações de permissão e compartilhamentos são rastreáveis. |

### 12.2 Privacidade e LGPD

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| PRIV-01 | Exibir aviso de privacidade no formulário. | Must | Respondente recebe informação clara sobre finalidade e canal de contato. |
| PRIV-02 | Definir base legal por finalidade de tratamento. | Must | Não tratar consentimento como base universal. |
| PRIV-03 | Coletar apenas dados necessários. | Must | Campos opcionais e finalidade são documentados. |
| PRIV-04 | Definir retenção por categoria de dado. | Must | Política e rotina de descarte/anonimização são verificáveis. |
| PRIV-05 | Permitir atendimento de solicitações de acesso e exportação. | Must | Dados relacionados podem ser exportados em formato legível. |
| PRIV-06 | Permitir correção, exclusão ou anonimização conforme obrigação aplicável. | Must | Operação é autorizada, auditada e respeita retenções legais. |
| PRIV-07 | Proteger dados pessoais em logs e monitoramento. | Must | Logs não armazenam respostas livres, telefone, e-mail ou notas privadas sem necessidade. |
| PRIV-08 | Documentar fornecedores e suboperadores. | Must | Serviços que tratam dados estão identificados. |
| PRIV-09 | Registrar consentimento quando essa for a base legal aplicável. | Should | Registro guarda versão do aviso, finalidade, data e evidência. |

### 12.3 Auditoria

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| AUD-01 | Auditar alterações em permissões, clientes, projetos e briefings. | Must | Evento registra ator, data, entidade e ação. |
| AUD-02 | Auditar aprovações, mudanças de prioridade e alterações de objetivos. | Must | Evento registra valores anteriores/novos e justificativa. |
| AUD-03 | Auditar medições e validações de resultados. | Must | Autor do registro e validador são identificáveis. |
| AUD-04 | Preservar histórico após arquivamento. | Must | Arquivar não apaga trilha de auditoria. |
| AUD-05 | Restringir leitura e alteração de logs de auditoria. | Must | Somente funções autorizadas acessam logs. |

---

## 13. Requisitos não funcionais

### 13.1 Segurança e isolamento

| ID | Requisito | Meta |
|---|---|---|
| RNF-01 | Autorização no servidor e na camada de dados. | 100% das operações privadas cobertas. |
| RNF-02 | Isolamento organizacional. | Zero acesso cruzado em testes automatizados. |
| RNF-03 | Token público. | Entropia mínima de 120 bits. |
| RNF-04 | Segredos. | Nenhum segredo em código cliente ou logs. |
| RNF-05 | Proteção de rotas públicas. | Rate limit, validação e política de origem. |
| RNF-06 | Dependências. | Auditoria periódica e correção de vulnerabilidades críticas/altas antes de produção. |

### 13.2 Privacidade

| ID | Requisito | Meta |
|---|---|---|
| RNF-07 | Minimização de dados. | Coletar apenas dados justificados por finalidade. |
| RNF-08 | Criptografia em trânsito. | TLS obrigatório. |
| RNF-09 | Criptografia em repouso. | Utilizar recursos do provedor de banco/armazenamento. |
| RNF-10 | Dados pessoais em logs. | Zero PII desnecessária. |
| RNF-11 | Retenção e descarte. | Política documentada e rotina testada. |

### 13.3 Desempenho

| ID | Requisito | Meta inicial |
|---|---|---|
| RNF-12 | Formulário público. | LCP inferior a 2,5 s em cenário de referência 4G. |
| RNF-13 | Autosave. | p95 de resposta do servidor inferior a 500 ms em carga esperada. |
| RNF-14 | Carregamento de projeto. | p95 inferior a 1,5 s para volume inicial acordado. |
| RNF-15 | Diagnóstico e recomendações. | Execução inferior a 2 s para briefing típico, sem bloquear a interface além do necessário. |
| RNF-16 | Listagens. | Paginação e filtros sem carregar coleções completas. |
| RNF-17 | Relatórios/PDF. | Processamento isolado e com timeout; falha não corrompe dados. |

As metas devem ser confirmadas com testes de carga e ambiente de implantação antes de se tornarem SLA.

### 13.4 Disponibilidade e continuidade

| ID | Requisito | Meta |
|---|---|---|
| RNF-18 | Health check. | Aplicação e banco verificáveis. |
| RNF-19 | Backup automático. | Frequência e retenção documentadas. |
| RNF-20 | Recuperação. | RPO/RTO definidos com base na infraestrutura e criticidade. |
| RNF-21 | Teste de restauração. | Executado periodicamente e registrado. |
| RNF-22 | Observabilidade. | Logs estruturados, métricas e rastreamento de erros sem PII. |
| RNF-23 | Migrações. | Versionadas, revisadas e aplicadas no deploy. |

Não assumir RPO/RTO definitivos sem validar o plano do provedor e o custo operacional.

### 13.5 Acessibilidade e compatibilidade

| ID | Requisito | Meta |
|---|---|---|
| RNF-24 | Acessibilidade. | WCAG 2.2 AA como referência-alvo. |
| RNF-25 | Navegação por teclado. | Todos os fluxos essenciais operáveis sem mouse. |
| RNF-26 | Contraste e status. | Cor nunca é o único meio de transmitir informação. |
| RNF-27 | Responsividade. | Suporte a telas a partir de 320 px. |
| RNF-28 | Movimento reduzido. | Respeitar `prefers-reduced-motion`. |
| RNF-29 | Navegadores. | Versões atuais dos principais navegadores desktop e mobile. |
| RNF-30 | Idioma. | pt-BR na V1; textos preparados para futura internacionalização. |

### 13.6 Qualidade e manutenção

| ID | Requisito | Meta |
|---|---|---|
| RNF-31 | Núcleo de domínio isolado. | Regras de negócio não dependem diretamente de Next.js, Prisma ou Supabase. |
| RNF-32 | Testes unitários. | Cobertura forte das regras determinísticas e invariantes. |
| RNF-33 | Testes de integração. | Cobrir transações, autorização, persistência e isolamento. |
| RNF-34 | Testes E2E. | Cobrir jornada principal por perfil e fluxo público. |
| RNF-35 | CI. | Lint, typecheck, testes e build obrigatórios. |
| RNF-36 | Documentação. | Produto, requisitos, arquitetura e roadmap atualizados junto das mudanças. |
| RNF-37 | Definition of Done. | Critérios de aceite, segurança, acessibilidade e operação verificados antes do deploy. |

---

## 14. Requisitos de dados e integridade

### 14.1 Entidades conceituais da V1

| Entidade | Responsabilidade |
|---|---|
| `Organization` | Fronteira de isolamento e configuração |
| `User` / `Membership` | Identidade, associação à organização e estado de acesso |
| `Role` / `Permission` | Funções e autorização |
| `Client` | Cadastro e contexto do cliente |
| `ClientActivity` | Reuniões, observações, interações e decisões |
| `Project` | Projeto/campanha e atribuições |
| `Briefing` | Instância de coleta vinculada a projeto |
| `Question` / `QuestionVersion` | Catálogo e versão de perguntas |
| `Answer` | Respostas do briefing |
| `Diagnosis` / `DiagnosisRun` | Resultado e execução versionada |
| `Signal` | Evidência determinística do diagnóstico |
| `Recommendation` | Sugestão estratégica e origem |
| `PriorityChange` | Solicitação e aprovação de mudança de prioridade |
| `Plan` | Plano principal ou complementar |
| `Objective` | Objetivo estratégico |
| `Action` | Ação vinculada ao objetivo |
| `Task` | Unidade operacional de execução |
| `Indicator` | Definição de indicador e meta |
| `Measurement` | Medição histórica de indicador |
| `Evidence` | Evidência de resultado |
| `Document` | Arquivo contextual de cliente/projeto |
| `Comment` / `Mention` / `Notification` | Comunicação contextual |
| `Report` / `ShareLink` | Relatório e acesso externo controlado |
| `Template` | Modelo reutilizável versionado |
| `AuditEvent` | Trilha de auditoria |

Este é um mapa conceitual, não um schema físico obrigatório. Relações, cardinalidades, constraints e estratégia de migração devem ser definidos em `03-inspecao-e-arquitetura.md` e nas migrações.

### 14.2 Regras de integridade

- Todas as entidades de negócio pertencem a uma organização.
- Uma resposta pertence a um briefing e a uma pergunta válida na versão do catálogo.
- Um diagnóstico guarda versão do catálogo e das regras utilizadas.
- Sinais apontam para respostas do próprio briefing.
- Recomendações preservam suas fontes e versão das regras.
- Objetivos, ações e tarefas preservam vínculos hierárquicos.
- Medições são históricas; atualização não apaga valores anteriores.
- Aprovações e alterações de prioridade registram ator, data e justificativa.
- Exclusão/arquivamento deve respeitar integridade referencial, retenção e auditoria.
- Operações compostas que alteram status e dados relacionados devem ser transacionais.

---

## 15. Integrações e contratos

### 15.1 Estratégia

A V1 começa standalone. A arquitetura deve permitir conectores futuros, mas não deve antecipar uma plataforma genérica de integrações sem casos de uso validados.

Possíveis integrações futuras:
- armazenamento de arquivos;
- calendário;
- comunicação;
- CRM;
- ferramentas de gestão de projetos;
- plataformas de marketing e analytics.

Credenciais devem ser protegidas, eventos e falhas registrados e a lógica de domínio não deve depender diretamente de APIs de terceiros.

### 15.2 Contratos de API

Os contratos detalhados devem ser definidos conforme os módulos forem implementados. Toda rota deve declarar:
- método e finalidade;
- autenticação exigida;
- organização e escopo de autorização;
- formato de entrada e validação;
- formato de saída;
- erros esperados;
- efeitos colaterais e eventos de auditoria;
- limites de paginação e rate limit.

Não manter neste documento uma lista de rotas que represente apenas o MVP antigo como se fosse o contrato definitivo da plataforma expandida.

---

## 16. Critérios de aceite da jornada V1

### 16.1 Organização e equipe

- [ ] Administrador autorizado consegue configurar a organização.
- [ ] Administrador consegue provisionar, convidar e desativar membros.
- [ ] Funções e permissões são aplicadas no servidor.
- [ ] Um usuário não acessa dados de outra organização.
- [ ] Líder e integrante veem somente projetos de seu escopo.

### 16.2 Cliente e projeto

- [ ] Usuário autorizado cria cliente.
- [ ] Usuário autorizado cria projeto associado ao cliente.
- [ ] Projeto tem responsável principal e colaboradores.
- [ ] Histórico do cliente apresenta atividades, documentos, projetos e resultados permitidos.

### 16.3 Briefing e diagnóstico

- [ ] Usuário cria briefing associado ao projeto.
- [ ] Cliente responde sem criar conta.
- [ ] Formulário adapta perguntas, salva e retoma respostas.
- [ ] Envio valida respostas, fecha o link e gera diagnóstico.
- [ ] Diagnóstico explica sinais, categorias e dados insuficientes.
- [ ] Diagnóstico preserva versão de regras e catálogo.
- [ ] Equipe revisa e aprova conforme permissão.

### 16.4 Recomendações e planejamento

- [ ] Sistema gera recomendações contextuais rastreáveis.
- [ ] Equipe pode editar recomendações.
- [ ] Prioridade considera severidade, impacto, urgência e esforço.
- [ ] Alteração de prioridade exige justificativa e aprovação.
- [ ] Recomendação aprovada pode ser convertida assistidamente em objetivo, ações e tarefas.
- [ ] Equipe revisa e confirma antes de criar compromissos.

### 16.5 Execução e resultados

- [ ] Projeto possui plano estratégico principal.
- [ ] Objetivos têm responsável, status, metas e indicadores.
- [ ] Ações e tarefas estão vinculadas aos objetivos.
- [ ] Integrantes autorizados atualizam tarefas e registram medições.
- [ ] Responsáveis validam resultados.
- [ ] Histórico de medições e evidências é preservado.
- [ ] Equipe consegue revisar objetivos que não atingiram metas.
- [ ] Objetivos cancelados/substituídos são arquivados com justificativa.

### 16.6 Relacionamento e relatórios

- [ ] Equipe registra reuniões, decisões e observações.
- [ ] Documentos são associados ao cliente/projeto e protegidos por permissão.
- [ ] Comentários e menções respeitam acesso.
- [ ] Dashboards variam conforme função.
- [ ] Relatórios distinguem atividade, entrega, resultado e impacto.
- [ ] Cliente recebe apenas relatório compartilhado e autorizado.
- [ ] Compartilhamento pode ser revogado ou expirado.

### 16.7 Segurança e operação

- [ ] Testes de autorização e isolamento passam.
- [ ] Tokens públicos são fortes, expirados e revogáveis.
- [ ] Rate limit e validação de entrada estão ativos.
- [ ] Logs não expõem dados pessoais desnecessários.
- [ ] Backup e restauração foram testados.
- [ ] Health check e observabilidade estão disponíveis.
- [ ] Migrações são aplicadas de forma controlada.

---

## 17. Estado atual conhecido versus alvo da V1

| Área | Estado descrito no documento anterior do MVP | Alvo da V1 |
|---|---|---|
| Usuários | Uma administradora | Administrador, líderes e integrantes com permissões |
| Organização | Operação de uma conta | Organização como fronteira de isolamento, preparada para múltiplas |
| Cliente | Cadastro básico | Histórico contextual e vários projetos |
| Projeto | Não estruturado como entidade central | Cliente → Projeto/Campanha → Briefing |
| Briefing | Formulário adaptativo público | Briefing vinculado a projeto e catálogo versionado |
| Diagnóstico | Motor determinístico em cinco categorias | Diagnóstico versionado, explicável, revisável e auditável |
| Recomendações | Problemas e oportunidades | Recomendações contextuais, priorizadas e agrupadas em objetivos |
| Planejamento | Não contemplado como fluxo completo | Plano principal, planos complementares, objetivos, ações e tarefas |
| Indicadores | Métricas do formulário | Indicadores estratégicos, metas, medições e evidências |
| Comunicação | Não contemplada como módulo | Comentários, menções e notificações essenciais |
| Documentos | PDF de briefing | Documentos contextuais de cliente/projeto e relatórios |
| Relatórios | PDF do briefing | Relatórios operacionais, estratégicos e de desempenho |
| Cliente externo | Respondente do briefing | Respondente e destinatário de relatórios compartilhados |
| Integrações | Não implementadas | Produto standalone, arquitetura preparada para futuras integrações |

**Nota:** a coluna de estado atual reproduz a documentação anterior. Deve ser conferida com o código e com o resultado da inspeção técnica antes de planejar migrações.

---

## 18. Decisões pendentes de produto

As decisões abaixo precisam ser resolvidas antes de detalhar os requisitos de implementação correspondentes.

| ID | Tema | Decisão necessária | Impacto |
|---|---|---|---|
| PD-01 | Permissões | Matriz de ações por função e escopo | Autorização, UX e testes |
| PD-02 | Múltiplas funções | Como combinar permissões de um membro com mais de uma função | Segurança |
| PD-03 | Prioridade | Fórmula, pesos, escalas e desempates | Motor de recomendação |
| PD-04 | Recomendações | Deduplicação, conflitos e versionamento | Consistência estratégica |
| PD-05 | Indicadores | Tipos de dados, unidades e formatos aceitos | Modelo de dados |
| PD-06 | Validação de resultados | Quem pode validar quais indicadores | Permissões e auditoria |
| PD-07 | Metas | Como registrar alteração de meta sem perder histórico | Histórico e relatórios |
| PD-08 | Relatórios compartilhados | PDF/link, autenticação, validade, revogação e escopo | Segurança e experiência externa |
| PD-09 | Modelos | Regras de herança ao duplicar projeto/briefing/plano | Integridade |
| PD-10 | Recorrência | Criação automática ou sugestão de novo projeto | Automação e notificações |
| PD-11 | Notificações | Eventos obrigatórios, preferências e canais iniciais | Comunicação |
| PD-12 | Arquivamento/exclusão | Política por entidade e exceções de retenção | LGPD e integridade |
| PD-13 | Acesso ao projeto | Se o acesso é por atribuição individual, equipe ou combinação | Autorização |
| PD-14 | Aprovação | Quais entidades exigem aprovação e por quais funções | Fluxos de trabalho |

---

## 19. Roadmap de requisitos por incrementos

A ordem abaixo organiza dependências; não substitui o roadmap técnico.

### Incremento 0 — Confiabilidade do MVP existente

- Fechar falhas de autenticação e autorização.
- Tornar envio e diagnóstico atômicos.
- Validar respostas semanticamente.
- Completar ciclo de vida de links.
- Versionar catálogo e regras.
- Implementar rate limit, cabeçalhos e auditoria mínima.
- Preparar privacidade, retenção, exportação e exclusão.
- Testar backup, restauração, deploy e PDF.

### Incremento 1 — Fundamentos multiusuário e estrutura de trabalho

- Organização e isolamento.
- Membros, funções e permissões.
- Cliente, projeto, responsável e colaboradores.
- Briefing associado a projeto.
- Histórico contextual básico.

### Incremento 2 — Inteligência estratégica

- Diagnóstico versionado.
- Recomendações contextuais.
- Priorização explicável.
- Aprovações e trilha de auditoria.

### Incremento 3 — Planejamento e execução

- Plano estratégico principal e planos complementares.
- Objetivos, ações e tarefas.
- Conversão assistida de recomendações.
- Comentários, menções e notificações essenciais.

### Incremento 4 — Indicadores e resultados

- Definição de indicadores e metas.
- Medições, evidências e validação.
- Revisão de objetivos.
- Encerramento de projeto.

### Incremento 5 — Relatórios e operação ampliada

- Dashboards por função.
- Relatórios operacionais e estratégicos.
- Compartilhamento externo controlado.
- Modelos, duplicação e recorrência.
- Melhorias guiadas por uso e feedback.

---

## 20. Definition of Done

Uma entrega só pode ser considerada pronta quando:

- [ ] O requisito possui critério de aceite verificável.
- [ ] O fluxo feliz e os erros relevantes têm testes automatizados.
- [ ] Autenticação, autorização e isolamento foram testados.
- [ ] Não há regressão de privacidade, segurança ou acessibilidade.
- [ ] Logs e mensagens não expõem dados pessoais desnecessários.
- [ ] A interface funciona em mobile e desktop.
- [ ] Estados de carregamento, vazio, erro e sucesso estão definidos.
- [ ] Migrações e variáveis de ambiente estão documentadas.
- [ ] Impacto em backup, retenção, observabilidade e custo foi considerado.
- [ ] `lint`, `typecheck`, testes e build passam no CI.
- [ ] Documentação de produto, requisitos, arquitetura e roadmap foi atualizada.
- [ ] A mudança foi validada em ambiente de preview antes de produção.

---

## 21. Relação com os demais documentos

| Documento | Responsabilidade |
|---|---|
| `PRODUCT.md` | Identidade, público, propósito, princípios e limites do produto |
| `02-requisitos.md` | O que o sistema deve fazer, regras, qualidade e critérios de aceite |
| `03-inspecao-e-arquitetura.md` | Estado técnico, arquitetura, dados, segurança e decisões de implementação |
| `04-roadmap-melhorias.md` | Ordem de execução, dependências, fases e prioridades |
| `design.md` | Tokens, componentes, padrões e comportamento visual, quando criado |

