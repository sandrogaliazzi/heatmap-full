## Context

As operações de OLT Parks concentram a maior parte do risco de UX ruim no projeto: elas dependem de conexão SSH, parse de saída textual e combinação de callbacks com respostas HTTP diretas. Hoje há controllers que podem lançar exceção dentro de callback, responder duas vezes, nunca responder em caso de timeout, ou retornar formatos de erro diferentes (`error`, `msg`, `message`), o que dificulta a reação do frontend.

No frontend, os fluxos de OLT/ONU consomem esses endpoints de forma heterogênea. Em vários pontos a falha é tratada apenas com `console.log`, sem limpeza robusta de loading e sem mensagem útil para o usuário.

## Goals / Non-Goals

**Goals:**
- Garantir que os endpoints críticos de OLT/ONU sempre finalizem a requisição com sucesso ou erro explícito.
- Introduzir um contrato de erro consistente para o frontend extrair mensagens legíveis.
- Evitar loading infinito no frontend quando houver timeout, falha de autenticação SSH ou erro inesperado.
- Melhorar notificações nos fluxos de listar/provisionar/editar/remover ONU e administrar OLTs.

**Non-Goals:**
- Reescrever todos os controllers do backend para `async/await`.
- Padronizar todos os endpoints do sistema fora do domínio de OLT/ONU nesta mudança.
- Redesenhar a UI; o foco é feedback e resiliência.

## Decisions

### D1: Introduzir helpers locais para resposta segura no `oltController`

**Escolha:** adicionar utilitários no próprio arquivo para encapsular `safeRespond`, timeout e encerramento seguro da conexão SSH.

**Rationale:** o problema é transversal dentro de `oltController.js`, mas restrito a esse domínio. Um helper local reduz risco de regressão, evita dependências novas e permite corrigir rapidamente múltiplos métodos.

**Alternativa descartada:** criar middleware genérico de erro para SSH. Isso exigiria refatorar grande parte do controller de uma vez.

### D2: Padronizar payload de erro com `message`, `code` e `details` opcionais

**Escolha:** responder erros de OLT/ONU com um objeto compatível com o frontend, sempre contendo `message`, e usar `code` para categorias operacionais como `OLT_CONNECTION_ERROR`, `OLT_TIMEOUT` e `OLT_COMMAND_ERROR`.

**Rationale:** o frontend já usa mensagens simples; manter `message` como campo principal reduz impacto. `code` prepara a UI para tratamentos mais específicos sem depender de texto literal.

**Alternativa descartada:** adotar um envelope mais complexo para toda a API. Seria útil, mas foge do escopo.

### D3: Adicionar timeout explícito nas conexões/execuções SSH

**Escolha:** aplicar timeout de conexão (`readyTimeout`) e timeout de operação com `setTimeout` nos endpoints críticos de OLT Parks.

**Rationale:** o principal sintoma relatado é request “pendurada”. Mesmo com falha remota ou equipamento lento, a API precisa fechar com erro previsível.

**Alternativa descartada:** deixar apenas o timeout padrão da lib SSH. Isso continua inconsistente entre métodos e pode não cobrir travamentos de shell.

### D4: Centralizar extração de mensagens no frontend

**Escolha:** criar helper para extrair mensagem de erro de respostas Axios (`message`, `error`, `msg`, timeout/network error) e reutilizá-lo nos componentes de OLT/ONU.

**Rationale:** há vários pontos de consumo e o padrão atual repete `console.log` com mensagens vagas. Um helper simples melhora consistência sem reestruturar a aplicação.

### D5: Encerrar estados de loading no `finally` ou em caminhos únicos de saída

**Escolha:** revisar os fluxos de OLT/ONU do frontend para garantir limpeza de `loading` mesmo quando parte da operação falha.

**Rationale:** parte do problema de UX não é só a mensagem, mas o componente ficar bloqueado após erro intermediário.

## Risks / Trade-offs

- [Cobrir apenas endpoints críticos pode deixar inconsistências residuais] → priorizar os fluxos usados pelo frontend de OLT/ONU e documentar o padrão para futuras extensões.
- [Timeout agressivo demais pode marcar equipamentos lentos como falha] → usar janela moderada e mensagem orientando nova tentativa.
- [Padronização parcial de payload de erro convive com respostas antigas] → frontend fará fallback para múltiplos campos enquanto a migração não é total.
- [Refatorar controller extenso pode introduzir regressão] → limitar a mudança a helpers reutilizáveis e endpoints diretamente consumidos pela UI atual.

## Migration Plan

1. Registrar a capability no `openspec`.
2. Implementar helpers de erro/timeout no backend e aplicar aos endpoints críticos de OLT/ONU.
3. Ajustar o cliente Axios e os componentes do frontend para extrair e exibir mensagens úteis.
4. Validar manualmente os fluxos principais de OLT listagem, consulta de perfis, consulta de ONU, provisionamento e remoção.

**Rollback:** reverter os arquivos alterados do backend/frontend. Não há migração de dados.

## Open Questions

- Há algum tempo máximo operacional esperado para comandos específicos de OLT que justifique timeout diferente por endpoint?
- O frontend deve distinguir falha de rede, timeout e rejeição operacional da OLT com mensagens diferentes, ou uma mensagem genérica melhorada já atende o uso em campo?
