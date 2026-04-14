## Why

As operações de OLT e ONU hoje misturam callbacks, conexões SSH e respostas HTTP sem um contrato de erro consistente. Quando a OLT não responde, a shell falha ou uma exceção escapa do controller, o frontend frequentemente fica preso em loading ou mostra apenas falha genérica, sem orientar o usuário sobre o que aconteceu.

## What Changes

- Padronizar o retorno de erro dos endpoints de OLT/ONU para sempre encerrar a requisição com status e payload previsíveis.
- Adicionar guardas contra exceções não tratadas, timeouts de conexão SSH e respostas duplicadas nos fluxos de OLT Parks.
- Fazer o frontend interpretar erros dessas operações e encerrar estados de loading pendentes.
- Exibir notificações mais úteis para o usuário com contexto do erro e ação recomendada quando possível.

## Capabilities

### New Capabilities
- `olt-error-handling`: Contrato de erro resiliente para operações de OLT/ONU com tratamento consistente no backend e feedback explícito no frontend.

### Modified Capabilities
<!-- nenhuma -->

## Impact

- **Backend**: `backend/src/controllers/oltController.js` e possivelmente rotas/utilitários associados passam a tratar timeout, falha de shell SSH, validação de entrada e encerramento seguro de resposta.
- **Frontend**: componentes de OLT/ONU e o cliente Axios passam a traduzir falhas da API em notificações e a sempre limpar estados de loading.
- **Experiência do usuário**: operações de consulta, provisionamento, edição e remoção deixam de falhar silenciosamente ou ficar “penduradas”.
