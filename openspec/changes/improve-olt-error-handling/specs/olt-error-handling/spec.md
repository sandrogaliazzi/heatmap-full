## ADDED Requirements

### Requirement: Endpoints de OLT/ONU MUST encerrar com resposta explícita em falhas operacionais
Os endpoints críticos de OLT/ONU usados pelo frontend SHALL encerrar a requisição com resposta HTTP explícita quando ocorrer falha de conexão SSH, erro ao abrir shell, timeout operacional, erro inesperado de processamento ou validação de entrada. Nenhuma dessas falhas pode deixar a requisição pendente indefinidamente.

#### Scenario: Falha de conexão com a OLT
- **WHEN** a API não consegue estabelecer conexão SSH com a OLT
- **THEN** o endpoint retorna erro HTTP 5xx com payload JSON contendo pelo menos o campo `message`

#### Scenario: Timeout durante operação na OLT
- **WHEN** a conexão é aberta mas o comando não finaliza dentro do tempo configurado
- **THEN** o endpoint encerra a operação, fecha a conexão e retorna erro HTTP 504 ou 5xx com payload JSON contendo pelo menos o campo `message`

#### Scenario: Parâmetros obrigatórios ausentes
- **WHEN** o frontend chama um endpoint de OLT/ONU sem os parâmetros mínimos exigidos
- **THEN** o endpoint retorna erro HTTP 400 com payload JSON contendo pelo menos o campo `message`

### Requirement: Payload de erro de OLT/ONU SHALL ser consistente para o frontend
Os endpoints de OLT/ONU abrangidos por esta capability SHALL retornar erros em JSON com formato previsível, contendo `message` como campo principal, e MAY incluir `code` e `details` para enriquecer o tratamento da interface.

#### Scenario: Erro operacional da OLT
- **WHEN** ocorre uma falha de shell, autenticação, timeout ou comando na OLT
- **THEN** a resposta JSON inclui `message` legível para o usuário ou para extração pelo frontend

#### Scenario: Erro inesperado no backend
- **WHEN** uma exceção interna ocorre durante o processamento do endpoint
- **THEN** a resposta JSON inclui `message` genérica e não expõe stack trace ao cliente

### Requirement: Frontend MUST encerrar loading e informar o usuário em falhas de OLT/ONU
Os fluxos do frontend que listam, consultam, provisionam, editam ou removem ONU/OLT usando os endpoints abrangidos SHALL encerrar estados de loading mesmo em falha e SHALL exibir feedback visível ao usuário com a mensagem do erro, ou fallback amigável quando ela não estiver disponível.

#### Scenario: Falha ao consultar dados de OLT
- **WHEN** uma operação como listar OLTs, perfis GPON, traduções VLAN ou ONUs não autorizadas falha
- **THEN** o componente encerra o loading e mostra notificação de erro ao usuário

#### Scenario: Falha ao provisionar, editar ou remover ONU
- **WHEN** uma operação de provisionamento, edição de alias ou remoção retorna erro
- **THEN** o componente encerra o loading, não permanece bloqueado e mostra notificação com contexto suficiente para orientar nova tentativa

#### Scenario: Timeout ou erro de rede no cliente HTTP
- **WHEN** a requisição falha por timeout, indisponibilidade da API ou ausência de payload padronizado
- **THEN** o frontend usa uma mensagem de fallback legível em vez de falhar silenciosamente
