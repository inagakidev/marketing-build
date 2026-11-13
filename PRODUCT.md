# Briefing Inteligente

Plataforma de gestão estratégica de marketing para equipes. Transforma informações de clientes em diagnósticos explicáveis, planos de ação e resultados acompanháveis — do briefing à avaliação da estratégia.

## Register

product

## Users

Equipes de marketing que atendem clientes e precisam trabalhar de forma coordenada, padronizada e orientada por estratégia. Inclui administradores responsáveis pela organização e configuração do espaço, líderes que coordenam equipes e projetos, e colaboradores que executam atividades e acompanham resultados.

Os clientes da equipe participam como respondentes externos: recebem um link seguro, preenchem o briefing sem criar uma conta e podem receber relatórios compartilháveis. Não precisam acessar o ambiente interno da plataforma.

O trabalho é organizado em **Organização → Cliente → Projeto/Campanha → Briefing**. Um cliente não pertence obrigatoriamente a uma equipe específica. Cada projeto tem uma pessoa responsável principal e pode ter colaboradores.

## Problem

Equipes de marketing frequentemente trabalham com informações fragmentadas entre formulários, reuniões, mensagens, documentos e ferramentas de tarefas. Isso gera briefings inconsistentes, diagnósticos dependentes da interpretação individual, decisões sem rastreabilidade e pouca continuidade entre planejamento e execução.

O problema não termina quando o briefing é preenchido. Sem uma ligação clara entre respostas, diagnóstico, recomendações, objetivos, tarefas e resultados, a equipe perde contexto, repete alinhamentos e tem dificuldade para demonstrar o impacto do trabalho.

## Product Purpose

O Briefing Inteligente centraliza a jornada estratégica de marketing. O briefing é a porta de entrada; a plataforma acompanha o trabalho desde a coleta de informações até a avaliação dos resultados.

A jornada principal é:

1. **Coletar:** criar briefings adaptativos para cada cliente e projeto.
2. **Diagnosticar:** interpretar respostas por meio de regras determinísticas e sinais explicáveis.
3. **Recomendar:** produzir recomendações contextuais, rastreáveis às respostas e regras que as originaram.
4. **Priorizar:** organizar recomendações considerando severidade, impacto estratégico, urgência e esforço.
5. **Planejar:** agrupar recomendações em objetivos e planos de ação.
6. **Executar:** transformar ações em tarefas com responsáveis, colaboradores, prazos, prioridades e status.
7. **Avaliar:** acompanhar indicadores, evidências, resultados e impacto.
8. **Aprender:** preservar histórico e usar dados e feedback para orientar a evolução do trabalho.

### Princípios funcionais

- O diagnóstico da primeira versão é determinístico, reproduzível e auditável; não depende de IA generativa.
- Recomendações são geradas por combinações de respostas, sinais, categorias e regras predefinidas. A equipe pode editar e personalizar as recomendações sem perder sua origem.
- Recomendações são organizadas por categoria de diagnóstico, agrupadas em objetivos estratégicos e ordenadas por prioridade.
- A prioridade inicial é calculada considerando severidade, impacto estratégico, urgência e esforço. Integrantes podem sugerir mudanças; somente pessoas autorizadas podem confirmá-las, com justificativa e histórico.
- A aprovação de recomendações não cria compromissos automaticamente. O sistema sugere objetivos, ações, tarefas, responsáveis e prazos; a equipe revisa e confirma a conversão.
- Cada projeto possui um plano estratégico principal, dividido em objetivos. A equipe também pode criar planos complementares vinculados ao projeto.
- O progresso operacional (tarefas concluídas) deve ser distinguido do resultado estratégico (metas e indicadores alcançados).
- Qualquer integrante autorizado no projeto pode registrar resultados e evidências; responsáveis designados validam os registros.
- O acompanhamento de indicadores pode ser configurado individualmente. A equipe pode atualizá-los quando necessário, sem uma periodicidade obrigatória imposta pelo produto.
- Objetivos não atingidos podem ser revisados. O sistema pode sugerir ajustes com base em regras, mas mudanças estratégicas dependem de aprovação humana.
- Objetivos cancelados ou substituídos permanecem no histórico, com motivo, responsável e impacto registrados.
- O encerramento de um projeto inclui revisão estratégica, resultados, aprovação e relatório final.

### Organização e colaboração

A plataforma começa preparada para uma organização, mas sua arquitetura deve permitir múltiplas organizações independentes no futuro. A organização é a fronteira de isolamento dos dados.

O modelo de colaboração é híbrido: membros compartilham visibilidade conforme o escopo de acesso, enquanto ações e aprovações dependem de permissões. Há funções padrão de administrador, líder e colaborador; as permissões e funções exatas devem ser detalhadas no documento de requisitos.

Os painéis se adaptam à função:
- **Administrador:** visão geral da organização, equipes, clientes, projetos e operação.
- **Líder:** visão dos projetos e da equipe sob sua responsabilidade.
- **Colaborador:** projetos, tarefas e atividades em que participa.

### Gestão contextual de clientes

A plataforma mantém histórico de reuniões, observações, interações, decisões e documentos, além de uma visão dos projetos e resultados associados ao cliente. Isso não pretende substituir um CRM completo.

Documentos são associados ao contexto de cliente ou projeto e possuem categoria, descrição, arquivo, autor e data. A plataforma permite visualizar e baixar arquivos, sem se propor a ser um sistema completo de gestão documental.

### Relatórios e compartilhamento

A plataforma oferece relatórios operacionais, estratégicos e de desempenho, com filtros por período, cliente, projeto e integrante, além de gráficos, tabelas, comparações e exportações.

Clientes não acessam o ambiente interno. A primeira versão permite compartilhar relatórios com eles. O escopo de informações exibidas, a validade e a revogação dos compartilhamentos devem ser definidos nos requisitos.

### Indicadores de sucesso

A métrica norteadora deve refletir valor estratégico entregue, não apenas volume de atividade. Acompanhar, entre outras:
- projetos com diagnóstico revisado e plano estratégico validado;
- objetivos com indicadores e resultados atualizados;
- evolução entre metas e resultados;
- recomendações aprovadas que avançaram para execução;
- percepção da equipe sobre utilidade dos diagnósticos e recomendações;
- conclusão e abandono dos briefings;
- qualidade, confiabilidade e uso dos relatórios.

As metas quantitativas devem ser calibradas com dados reais após a implantação, evitando assumir metas de volume ou produtividade sem uma linha de base.

## Brand Personality

Clara, estratégica, confiável e colaborativa. A plataforma deve transmitir organização e segurança sem parecer burocrática, punitiva ou excessivamente corporativa.

### Tone

Escrever em português do Brasil, com linguagem direta, humana e profissional. Explicar termos estratégicos quando necessário. Preferir instruções acionáveis a mensagens vagas. O diagnóstico deve apontar oportunidades e riscos sem julgar o cliente ou tratar uma pontuação como verdade absoluta.

Mensagens de erro devem explicar o que aconteceu e como resolver. Estados vazios devem orientar o próximo passo. A interface deve distinguir claramente sugestões automáticas, decisões humanas, tarefas em execução e resultados confirmados.

## Anti-references

- MUST NOT parecer apenas um criador de formulários ou uma ferramenta isolada de diagnóstico.
- MUST NOT se transformar em um CRM genérico ou em um gerenciador de tarefas sem contexto estratégico.
- MUST NOT apresentar recomendações automáticas como verdades incontestáveis ou decisões finais.
- MUST NOT confundir tarefas concluídas com objetivos alcançados ou impacto comprovado.
- MUST NOT classificar clientes ou negócios de forma pejorativa, nem apresentar categorias sem dados como resultados negativos.
- MUST NOT usar IA generativa como autoridade autônoma para diagnóstico, aprovação ou decisão estratégica na primeira versão.
- MUST NOT expor dados de uma organização a outra, nem informações internas em links públicos ou relatórios compartilhados sem autorização.
- MUST NOT incentivar competição improdutiva entre colaboradores por contagem bruta de tarefas.
- MUST NOT depender de uma interface exclusivamente desktop ou esconder estados importantes em elementos visuais ambíguos.

## Design Principles

1. **Estratégia antes de atividade.** Toda recomendação, objetivo e tarefa deve manter vínculo com o diagnóstico e com o resultado que pretende produzir.
2. **Humano no controle.** O sistema organiza evidências e sugere caminhos; pessoas autorizadas revisam, decidem e aprovam.
3. **Explicabilidade por padrão.** Diagnósticos, prioridades e recomendações devem mostrar de onde vieram e quais regras ou evidências os sustentam.
4. **Continuidade do contexto.** Informações de briefing, decisões, documentos, planos e resultados devem permanecer conectados ao cliente e ao projeto.
5. **Colaboração com responsabilidade.** A visibilidade compartilhada não elimina permissões, atribuições, aprovações ou trilhas de auditoria.
6. **Simplicidade progressiva.** A primeira versão cobre a jornada estratégica completa, mas cada módulo começa com o conjunto mínimo de capacidades necessário.
7. **Personalização com limites claros.** Equipes podem adaptar campos, status, categorias, modelos de briefing, diagnóstico e relatórios sem comprometer integridade, segurança ou consistência dos dados.
8. **Histórico preservado.** Alterações relevantes, aprovações, cancelamentos, resultados e reprocessamentos devem ser rastreáveis.
9. **Confiabilidade operacional.** Integridade de dados, backups, recuperação, monitoramento e segurança são requisitos do produto, não melhorias cosméticas.
10. **Métricas com contexto.** Indicadores de desempenho devem considerar resultados, qualidade e contexto, não apenas quantidade de entregas.

## Accessibility & Inclusion

- MUST funcionar em dispositivos móveis e desktop, com experiência responsiva.
- MUST oferecer navegação por teclado, foco visível, rótulos programáticos e estrutura semântica.
- MUST manter contraste adequado e não depender exclusivamente de cor para comunicar status, prioridade ou diagnóstico.
- MUST permitir ampliação de texto e respeitar preferências de movimento reduzido.
- MUST apresentar mensagens, validações e estados de salvamento de forma perceptível e compreensível.
- MUST usar linguagem simples, inclusiva e não estigmatizante.
- SHOULD seguir WCAG 2.2 nível AA como referência de qualidade e validação.

## Offer

O Briefing Inteligente é, neste estágio, uma plataforma de uso interno para equipes de marketing. Não há preço público, plano comercial ou modelo de cobrança definido. A prioridade é validar a jornada de trabalho e a utilidade estratégica do produto antes de estabelecer uma oferta comercial.

## Boundaries

- A primeira versão não é um CRM completo, uma plataforma de automação de marketing, um gerenciador genérico de projetos ou um construtor de formulários independente.
- A primeira versão não usa IA generativa como núcleo do diagnóstico nem executa decisões estratégicas sem validação humana.
- Clientes respondem briefings por links externos e podem receber relatórios compartilháveis; não possuem acesso geral ao ambiente interno na V1.
- A primeira versão começa com uma organização, mas deve ser construída com isolamento de dados por organização desde o início.
- A plataforma começa standalone. Integrações com Drive, calendário, comunicação, CRM, gestão de projetos e plataformas de marketing são possibilidades futuras, não dependências para o fluxo central.
- Aplicativo mobile nativo, white-label, billing e cadastro público de organizações não fazem parte da primeira versão.
- A V1 entrega a jornada central completa — briefing, diagnóstico, recomendações, planejamento, execução e avaliação — com profundidade inicial controlada em cada módulo.
- Detalhes de implementação, contratos de API, critérios de aceite, modelo de dados físico e decisões de infraestrutura pertencem aos documentos técnicos relacionados, não a este arquivo.

## Stack

Este arquivo define identidade, público, propósito, princípios e limites do produto. Não substitui a documentação de implementação.

- `README.md` — visão técnica e instruções para executar o projeto.
- `AGENTS.md` — convenções e instruções para agentes de desenvolvimento.
- `docs/02-requisitos.md` — requisitos funcionais e não funcionais, permissões, fluxos, critérios de aceite e contratos.
- `docs/03-inspecao-e-arquitetura.md` — estado técnico, arquitetura, segurança, integridade, riscos e decisões arquiteturais.
- `docs/04-roadmap-melhorias.md` — sequência de implementação, prioridades, fases e definição de pronto.
- `design.md` — tokens, componentes, padrões visuais e comportamento da interface, quando criado.
- `auth.md` — modelo detalhado de autenticação, autorização e acesso, quando criado.
