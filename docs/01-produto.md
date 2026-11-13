# Briefing Inteligente — Documento de Produto

> **Versão:** 1.0  
> **Status:** MVP funcional, em fase de endurecimento para produção  
> **Data:** 12/11/2026  
> **Produto:** Briefing Inteligente — coleta adaptativa de briefing de marketing com diagnóstico determinístico

---

## 1. Resumo executivo

O **Briefing Inteligente** é uma ferramenta interna de marketing para **coletar briefings de clientes de forma adaptativa e transformá-los automaticamente em um diagnóstico inicial**.

Uma administradora (consultora, agência ou freelancer de marketing) cadastra um cliente e gera um **link público único**. O cliente responde um formulário que **se adapta ao tipo de negócio dele** — por exemplo, um e-commerce recebe perguntas sobre frete e conversão, enquanto um negócio local recebe perguntas sobre região e Google Perfil. Assim que o cliente envia, o sistema executa um **motor de regras determinístico** e entrega à administradora:

- sinais de alerta classificados por severidade;
- pontuação de 0 a 100 em cinco categorias;
- lista de principais problemas e oportunidades;
- exportação em PDF.

O produto **não usa IA generativa nesta fase**. Todo o diagnóstico é código determinístico, versionável e auditável. Isso é uma decisão de produto: o resultado precisa ser reproduzível, explicável e barato.

---

## 2. Problema que o produto resolve

Agências e profissionais de marketing perdem tempo e qualidade em três momentos do início de um projeto:

| Problema | Consequência |
|---|---|
| Briefing feito por reunião ou questionário genérico | Perguntas irrelevantes, respostas vagas, muito tempo gasto |
| Formulário igual para todo mundo | O cliente de e-commerce e o de serviço local respondem coisas que não ajudam |
| Diagnóstico montado manualmente | Depende da memória e do humor de quem conduz; difícil de comparar e repassar |
| Respostas espalhadas em WhatsApp, e-mail e documento | Perda de contexto, retrabalho e nenhuma rastreabilidade |
| Nenhum controle sobre o link enviado | Link vaza, expira sem aviso, cliente responde duas vezes |

O custo aparece depois: reuniões de alinhamento repetidas, peças produzidas com premissas erradas, escopo refeito e uma relação comercial que começa com informação fraca.

---

## 3. Proposta de valor

**“Briefings que se adaptam ao cliente. Diagnósticos que você lê em segundos.”**

1. **Formulário adaptativo por tipo de negócio.** O núcleo tem 30 perguntas fixas; cada tipo de negócio libera de 4 a 5 perguntas específicas, totalizando 51 perguntas no catálogo. A ramificação vive em dados, não em `if/else` espalhado pelo código.
2. **Diagnóstico automático e determinístico.** Nove regras de sinal avaliam cinco categorias: Posicionamento, Público, Oferta, Presença digital e Marketing atual. Cada sinal tem severidade e aponta para as respostas que o dispararam.
3. **Experiência de resposta sem atrito.** Sem login, mobile-first, salvamento automático, retomada posterior, validação por etapa e revisão antes do envio.
4. **Painel de leitura rápida.** Semáforo por categoria, principais problemas ordenados por gravidade, oportunidades e respostas completas por bloco.
5. **Saída pronta para o trabalho.** PDF gerado a partir da mesma tela do painel, sem template duplicado.
6. **Custo e auditabilidade.** Nenhuma chamada de LLM; o mesmo conjunto de respostas produz o mesmo diagnóstico, o que permite testar, versionar e explicar o resultado.

---

## 4. Público-alvo e personas

### Persona primária — a administradora
- **Quem é:** consultora de marketing, dona de agência pequena ou freelancer que conduz briefings de clientes.
- **Objetivo:** começar um projeto com informação suficiente e um diagnóstico defensável, sem gastar horas em reunião.
- **Dores:** briefing incompleto, cliente que responde “depende”, dificuldade de comparar maturidade entre clientes, retrabalho.
- **Ganho:** link único, formulário que faz as perguntas certas, diagnóstico imediato e PDF para anexar à proposta.

### Persona secundária — o respondente
- **Quem é:** empreendedor, gestor ou responsável pelo negócio do cliente.
- **Objetivo:** explicar o negócio sem burocracia e sem se sentir avaliado.
- **Dores:** formulário longo, pergunta que não se aplica, perder o que digitou, não saber se enviou.
- **Ganho:** etapas curtas, perguntas contextualizadas, salvamento automático, retorno claro ao final.

### Persona futura — equipe
- Analistas e assistentes que precisam acessar briefings, mas não administrar contas. Hoje o modelo de dados já suporta múltiplos usuários, mas o produto é operado por uma única administradora.

---

## 5. Jornada do produto

### 5.1 Jornada da administradora

```
Login
  └─ Lista de clientes (status do briefing mais recente)
       └─ Cadastrar cliente
            └─ Criar briefing (gera token e prazo)
                 └─ Copiar link e enviar ao cliente
                      └─ Acompanhar status (aguardando / em preenchimento / pronto)
                           └─ Abrir briefing
                                ├─ Ler respostas por categoria
                                ├─ Ler diagnóstico (semáforo, problemas, oportunidades)
                                ├─ Reprocessar com as regras atuais
                                └─ Exportar PDF
```

### 5.2 Jornada do respondente

```
Abre o link
  └─ Tela de boas-vindas (quantas etapas, tempo estimado, salvamento automático)
       └─ Etapas por categoria (até 6 perguntas por tela)
            ├─ Ramificação: escolher o tipo de negócio acrescenta perguntas específicas
            ├─ Autosave a cada alteração
            └─ Validação de obrigatórias antes de avançar
                 └─ Revisão
                      └─ Envio
                           └─ Tela de agradecimento
```

### 5.3 Jornada do link
```
Criado ──► Aguardando resposta ──► Em preenchimento ──► Pronto para revisão
   │                                      │
   ├─ expira pelo prazo                   └─ cliente pode fechar e voltar
   ├─ já enviado bloqueia edição
   └─ link inválido / expirado / já enviado têm telas próprias
```

---

## 6. Escopo do produto

### 6.1 Dentro do escopo (MVP)

- Autenticação de uma administradora via Supabase Auth.
- Cadastro, edição, listagem e remoção de clientes.
- Criação de briefings com token opaco, prazo de validade e link público.
- Formulário público adaptativo, sem login, com ramificação por tipo de negócio.
- Salvamento automático das respostas e retomada posterior.
- Validação de perguntas obrigatórias visíveis.
- Motor determinístico de sinais e diagnóstico.
- Painel com respostas por categoria, respostas brutas, semáforo, problemas e oportunidades.
- Reprocessamento manual do diagnóstico.
- Exportação em PDF.
- Testes unitários do motor e testes de integração da camada de servidor.

### 6.2 Fora do escopo (por decisão de produto)

- IA generativa, LLM ou geração automática de estratégia.
- Envio automático de e-mail ou WhatsApp.
- Múltiplos administradores com papéis e permissões.
- Cadastro público de contas.
- Integrações com CRM, ferramentas de anúncio ou automação de marketing.
- Aplicativo mobile nativo.
- White-label / personalização visual por cliente.
- Cobrança, assinatura ou billing.
- Gestão do catálogo de perguntas por interface (hoje é via seed).
- Analytics avançado, comparação entre clientes e benchmarking de mercado.

### 6.3 Fora do escopo nesta fase, mas candidato a próximo ciclo

- Aprovação formal do briefing (`approved`) e fluxo de revisão.
- Revogação, regeneração e reenvio de links.
- Notificações por e-mail.
- Exclusão/anonimização de dados e exportação LGPD.
- Busca, paginação e filtros mais ricos.
- Versionamento do catálogo de perguntas.
- Assistente opcional de IA para redigir recomendações a partir dos sinais.

---

## 7. Diferenciais estruturais

| Diferencial | Por que importa |
|---|---|
| Ramificação orientada a dados | Adicionar um novo tipo de negócio é alterar o catálogo, não o código de tela. |
| Motor puro em `src/core` | Não importa Next, Prisma ou Supabase; pode ser testado sem banco e reutilizado em outro transporte. |
| Diagnóstico rastreável | Cada sinal aponta para os IDs das respostas que o dispararam. |
| Diagnóstico reprocessável | Regras evoluem; o resultado pode ser recalculado de forma idempotente. |
| Token como única credencial | O respondente não cria conta; o link é opaco, longo e não derivado de dados do cliente. |
| PDF da mesma página | Painel e PDF não divergem, porque o PDF renderiza a própria tela de impressão. |
| Núcleo testado | Os testes do motor são a rede de proteção para evoluir regras sem quebrar o produto. |

---

## 8. Conceitos e modelo de domínio

### 8.1 Entidades principais

| Entidade | Papel no produto |
|---|---|
| **User** | A administradora. No MVP há um registro, mas a tabela já é multiusuário. |
| **Client** | O cliente da administradora. Um cliente pode ter vários briefings. |
| **Briefing** | Uma coleta. Tem token, status, prazo e, depois do envio, um diagnóstico. |
| **Question** | Catálogo global de perguntas. Não é duplicado por briefing. |
| **Answer** | Resposta de um briefing a uma pergunta. Uma por par briefing/pergunta. |
| **Signal** | Alerta detectado por uma regra. Guarda severidade, descrição e respostas de origem. |
| **Diagnosis** | Resultado agregado por categoria. Guarda pontuação, status e sinais relacionados. |

### 8.2 Categorias de pergunta × categorias de diagnóstico

As categorias de pergunta organizam o formulário; as de diagnóstico organizam a avaliação. Várias categorias de pergunta alimentam uma categoria de diagnóstico.

```
Negócio, Marca, Concorrência ──► Posicionamento
Público ────────────────────────► Público
Oferta ─────────────────────────► Oferta
Presença digital ───────────────► Presença digital
Objetivos ──────────────────────► Marketing atual
Fechamento ─────────────────────► (não avaliado)
```

### 8.3 Status do briefing

| Status | Significado | Usado hoje |
|---|---|---|
| `draft` | Rascunho interno | Não (o briefing nasce como `awaiting_response`) |
| `awaiting_response` | Link criado, aguardando o cliente | Sim |
| `in_progress` | Cliente começou a responder | Sim |
| `submitted` | Enviado pelo cliente | Não (o envio vai direto para `ready_for_review`) |
| `ready_for_review` | Respostas fechadas e diagnóstico gerado | Sim |
| `approved` | Briefing revisado e aprovado pela administradora | Não |

### 8.4 Pontuação e semáforo

- Cada categoria começa com **100 pontos**.
- Cada sinal desconta: **leve 15**, **moderado 25**, **forte 40**.
- Faixas: **verde 80–100**, **amarelo 50–79**, **vermelho 0–49**.
- Se uma pergunta obrigatória e visível da categoria estiver sem resposta, a categoria fica **cinza** (“sem dados suficientes”) e não recebe pontuação. Cinza é diferente de vermelho: não é um diagnóstico ruim, é ausência de base para diagnosticar.

---

## 9. Regras de negócio que definem o produto

1. **A ramificação é dado, não código.** A condição de exibição de cada pergunta fica em `questions.visibilityRule` (JSON).
2. **Uma regra de visibilidade só enxerga perguntas anteriores.** O formulário é preenchido de cima para baixo; condicionar a exibição a uma resposta futura não faria sentido.
3. **Resposta de pergunta invisível não conta.** Se o cliente troca o tipo de negócio, respostas antigas continuam no banco, mas são ignoradas pelo motor.
4. **Obrigatória só é exigida se estiver visível.** Perguntas de outro tipo de negócio não podem travar o envio.
5. **Apagar o campo apaga a resposta.** “Respondida e depois limpa” deve ser o mesmo estado que “nunca respondida”.
6. **Uma resposta por pergunta por briefing.** O autosave faz upsert.
7. **O envio fecha o briefing.** Depois de enviado, o link não aceita mais edição.
8. **O diagnóstico é gravado no envio.** Mudanças de regra não alteram briefings antigos sem ação explícita de reprocessamento.
9. **Reprocessar é idempotente.** Apaga sinais e diagnósticos anteriores e recria dentro de uma transação.
10. **O link é a credencial do respondente.** Token opaco de 24 caracteres, com entropia aproximada de 124 bits, e prazo de validade.
11. **O formulário público nunca expõe dados internos.** Nome do cliente e nome de quem enviou, apenas. Nunca e-mail, telefone, notas ou diagnóstico.
12. **O diagnóstico não é uma sentença.** Cinza representa falta de dados, não negócio ruim; o produto comunica isso no painel e no PDF.

---

## 10. Métricas de sucesso

### Métrica norteadora
**Briefings concluídos e revisados por semana.** É a métrica que combina geração de link, resposta do cliente e leitura do diagnóstico.

### Funil
| Etapa | Métrica | Meta inicial |
|---|---|---|
| Link criado | Briefings criados por semana | 10 |
| Link aberto | Taxa de abertura | > 80% |
| Iniciado | Taxa de início | > 60% |
| Concluído | Taxa de conclusão | > 50% |
| Revisado | Briefings abertos pela administradora | > 90% |
| Aprovado | Briefings aprovados | > 70% |

### Qualidade do diagnóstico
- Percentual de categorias cinza por briefing (meta: < 20%).
- Número médio de sinais por briefing.
- Taxa de reprocessamento após mudança de regra.
- Feedback qualitativo da administradora sobre utilidade dos sinais.

### Experiência
- Tempo mediano de preenchimento (meta: 12–18 minutos).
- Taxa de erro de autosave (meta: < 1%).
- Abandono por etapa.
- Exportações de PDF por briefing revisado.

### Guardrails
- Nenhum vazamento de dado pessoal em rota pública.
- Nenhum briefing enviado sem diagnóstico.
- p95 do autosave abaixo de 500 ms.
- Nenhum acesso ao painel por conta não autorizada.

---

## 11. Estado atual e maturidade

O produto está **funcional de ponta a ponta**:

- build, lint e typecheck passam;
- 133 testes unitários passam em 7 arquivos;
- há testes de integração contra Postgres real;
- fluxo público e painel existem e cobrem o caminho principal;
- geração de PDF existe e reutiliza a página de impressão.

O que separa o produto de uma operação confiável em produção está mapeado em **[03 — Inspeção e arquitetura](./03-inspecao-e-arquitetura.md)**. Em resumo: restringir quem pode ser administradora, tornar o envio atômico, versionar o catálogo de perguntas, validar respostas contra o catálogo, adicionar rate limiting e concluir o ciclo de vida do link/briefing.

---

## 12. Riscos de produto

| Risco | Impacto | Mitigação |
|---|---|---|
| Formulário longo (até 51 perguntas) | Abandono no meio | Etapas curtas, progresso, autosave, perguntas ramificadas opcionais, medir abandono por etapa |
| Diagnóstico percebido como julgamento | Cliente se sente avaliado | Linguagem de diagnóstico, não de nota; explicar cinza; separar “problema” de “oportunidade” |
| Heurísticas de texto geram falso positivo | Perda de confiança | Calibrar palavras-chave, permitir revisão humana, tornar regra visível e versionada |
| Uma única administradora | Dependência operacional | Modelo já multiusuário; evoluir para papéis e convite |
| Link encaminhado para terceiros | Vazamento de respostas | Token forte, expiração, `noindex`, `no-referrer`, opção de revogar |
| Dados pessoais em respostas | Risco LGPD | Política de retenção, consentimento, exportação/exclusão, criptografia e controle de acesso |
| Dependência de Chromium para PDF | Falha em serverless | Adaptador isolado; migrar para Chromium compatível ou worker |
| Mudança de regra altera leitura de briefings antigos | Inconsistência histórica | Diagnóstico gravado; reprocessamento explícito; versionar regras |

---

## 13. Evolução de produto (alto nível)

### Agora — confiabilidade
- Restringir contas administrativas.
- Envio atômico e bloqueio de edição.
- Validação semântica de respostas.
- Rate limiting e cabeçalhos de segurança.
- Ciclo de vida do link: revogar, regenerar, reenviar.
- Persistir motivo de categoria cinza.
- Página inicial do produto (hoje ainda é a tela padrão do Next.js).

### Próximo — operação
- Aprovação do briefing e histórico de ações.
- Notificações por e-mail.
- Busca, paginação e filtros por status de qualquer briefing.
- Exportação LGPD e rotina de retenção.
- Painel de métricas do funil.

### Depois — escala
- Multiusuário com papéis.
- Catálogo de perguntas gerenciável por interface e versionado.
- Comparação entre clientes e benchmarking.
- Integrações com CRM e automação.
- Assistente opcional de IA para redigir recomendações, sempre com revisão humana.

---

## 14. Glossário

| Termo | Definição |
|---|---|
| **Briefing** | Instância de coleta de informações de um cliente. |
| **Diagnóstico** | Resultado agregado por categoria, com pontuação, status e sinais. |
| **Sinal** | Alerta gerado por uma regra a partir das respostas. |
| **Ramificação** | Perguntas que aparecem apenas para um tipo de negócio. |
| **Visibilidade** | Regra que decide se uma pergunta aparece no formulário. |
| **Categoria de pergunta** | Bloco do formulário (negócio, objetivos, público etc.). |
| **Categoria de diagnóstico** | Dimensão avaliada (posicionamento, público, oferta etc.). |
| **Token** | Credencial opaca do link público do briefing. |
| **Cinza** | Categoria sem dados suficientes para ser pontuada. |
| **Reprocessar** | Recalcular sinais e diagnóstico com as regras atuais. |
| **Determinístico** | Mesma entrada produz a mesma saída, sem IA generativa. |
