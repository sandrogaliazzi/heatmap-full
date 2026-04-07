# Capability: redis-cache

Cache server-side com Redis para os endpoints de alta carga (`/newfetch` e `/cables`), com fallback transparente para a fonte original e warm-up automático a cada 2 horas.

> **Origem**: Introduzida pela change `implement-redis-cache`. Substitui o cache client-side em `frontend/src/stores/tomodat.js` (removido nessa change — ver nota ao final).

---

## Requirement: Módulo singleton do client Redis
O backend SHALL expor um client Redis singleton em `backend/src/lib/redis.js`, instanciado com a biblioteca `ioredis`, configurado via `REDIS_URL`. Todos os demais módulos que precisarem de Redis SHALL importar este singleton — nenhum módulo deverá instanciar seu próprio client.

### Scenario: REDIS_URL definida
- **WHEN** a variável de ambiente `REDIS_URL` está definida
- **THEN** o client Redis conecta usando essa URL

### Scenario: REDIS_URL não definida
- **WHEN** a variável de ambiente `REDIS_URL` não está definida
- **THEN** o client Redis conecta em `redis://localhost:6379`

---

## Requirement: Cache server-side para `GET /newfetch`
O backend SHALL armazenar em Redis o resultado de `GET /newfetch` sob a chave `cache:newfetch`, serializado como JSON string (JSON.stringify), com TTL de 150 minutos. Ao receber uma requisição, o sistema SHALL verificar o cache antes de consultar o MongoDB.

> **Rationale do TTL**: O MongoDB (`newFetch`) é atualizado pelo cron `tomodatUpdateLoop` a cada 240 minutos. Um TTL de 150 minutos garante que o cache expire antes de completar um ciclo sem atualização, e o warm-up (a cada 120 minutos) mantém o cache sempre quente.

### Scenario: Cache hit em /newfetch
- **WHEN** o cache Redis contém a chave `cache:newfetch` com TTL válido
- **THEN** o endpoint faz parse do JSON armazenado e retorna os dados com status 200, sem consultar o MongoDB

### Scenario: Cache miss em /newfetch
- **WHEN** a chave `cache:newfetch` não existe no Redis ou expirou
- **THEN** o endpoint consulta o MongoDB (`newFetch.find()` com projeção padrão), serializa o resultado como JSON string, armazena no Redis com TTL de 150 minutos e retorna os dados com status 200

---

## Requirement: Cache server-side para `GET /cables`
O backend SHALL armazenar em Redis o resultado de `GET /cables` sob a chave `cache:cables`, serializado como JSON string (JSON.stringify), com TTL de 150 minutos. Ao receber uma requisição, o sistema SHALL verificar o cache antes de ler o arquivo KML em disco.

> **Nota**: `GET /cables` não consulta MongoDB. A fonte de dados é o arquivo KML em `backend/src/kmlTomodat/`. O cache elimina o parse do KML a cada requisição.

### Scenario: Cache hit em /cables
- **WHEN** o cache Redis contém a chave `cache:cables` com TTL válido
- **THEN** o endpoint faz parse do JSON armazenado e retorna os dados com status 200, sem ler ou parsear o arquivo KML

### Scenario: Cache miss em /cables
- **WHEN** a chave `cache:cables` não existe no Redis ou expirou
- **THEN** o endpoint executa o parse do arquivo KML via `fetchCables.js`, serializa o resultado como JSON string, armazena no Redis com TTL de 150 minutos e retorna os dados com status 200

---

## Requirement: Fallback para a fonte original quando Redis indisponível
O sistema SHALL funcionar normalmente se o Redis estiver indisponível. Em caso de falha na leitura ou escrita do Redis (timeout, ECONNREFUSED, ou qualquer erro de I/O), o endpoint SHALL buscar os dados diretamente da fonte original (MongoDB para `/newfetch`, KML para `/cables`) e retornar com status 200, sem propagar o erro do Redis ao cliente.

### Scenario: Redis indisponível em /newfetch
- **WHEN** a conexão com o Redis falha ao tentar ler `cache:newfetch`
- **THEN** o endpoint consulta o MongoDB e retorna os dados com status 200, sem retornar erro ao cliente

### Scenario: Redis indisponível em /cables
- **WHEN** a conexão com o Redis falha ao tentar ler `cache:cables`
- **THEN** o endpoint lê e parseia o arquivo KML e retorna os dados com status 200, sem retornar erro ao cliente

---

## Requirement: Warm-up automático do cache a cada 2 horas
O backend SHALL executar um job cron a cada 2 horas que pré-carrega os dados de `/newfetch` e `/cables` no Redis com TTL de 150 minutos, garantindo que o cache esteja sempre quente antes de qualquer requisição de usuário.

- O warm-up de `cache:newfetch` SHALL buscar os dados via `newFetch.find()` com a mesma projeção usada pelo controller `ListarFetchNew`.
- O warm-up de `cache:cables` SHALL buscar os dados via a função `listCables()` de `fetchCables.js` (parse do KML), não via MongoDB.
- O cron SHALL ser registrado em `backend/server.js` junto aos demais loops existentes, respeitando a guarda `NODE_ENV === "production"`.

### Scenario: Warm-up executa com sucesso
- **WHEN** o cron de warm-up é disparado
- **THEN** o sistema busca `newFetch` do MongoDB e cables do KML, serializa ambos como JSON string, grava no Redis com TTL de 150 minutos e registra log de sucesso

### Scenario: Redis indisponível durante o warm-up
- **WHEN** o Redis está indisponível durante a execução do cron
- **THEN** o cron registra o erro no log e encerra sem lançar exceção não tratada

### Scenario: Arquivo KML ilegível durante o warm-up
- **WHEN** o parse do KML falha (arquivo ausente, corrompido ou ilegível)
- **THEN** o cron registra o erro no log, não grava `cache:cables`, e encerra sem lançar exceção não tratada (o warm-up de `cache:newfetch` não é afetado)

---

## Nota: Requisito removido nesta change

### Cache client-side no store tomodat (usuário autenticado) — REMOVIDO
**Reason**: Substituído pelo cache server-side com Redis. O gerenciamento de TTL, reabastecimento e invalidação passa a ser responsabilidade exclusiva do backend.

**Migration**: Removido de `frontend/src/stores/tomodat.js`:
- Funções: `readCache`, `writeCache`, `invalidateCache`
- Constantes: `CACHE_KEY_FULL`, `CACHE_KEY_GUEST`, `CACHE_TTL_MS`
- Na função `getTomodatData`: removida a verificação de cache (leitura e escrita de localStorage) para o fluxo do usuário autenticado. A função passa a chamar `GET /newfetch` e `GET /cables` diretamente a cada invocação.

**Nota sobre usuário guest**: O usuário guest chama `GET /tomodat-basico`, endpoint que não está no escopo deste cache Redis. A remoção de `CACHE_KEY_GUEST` e `readCache`/`writeCache` implica que o usuário guest perderá o cache de 120 minutos que existia no localStorage. Esta degradação é intencional e aceita — o acesso guest é limitado e a simplificação do código justifica a mudança.
