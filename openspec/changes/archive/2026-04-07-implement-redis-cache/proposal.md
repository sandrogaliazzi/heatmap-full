## Why

O carregamento do componente HeatMap é o gargalo principal da aplicação: ele dispara dois endpoints pesados (`GET /newfetch` e `GET /cables`) que executam agregações MongoDB e buscas em coleções grandes a cada visita, e o resultado fica armazenado apenas no localStorage do navegador — frágil, limitado por tamanho e sem controle centralizado de invalidação. Mover o cache para o Redis no backend elimina esse processamento redundante, centraliza o ciclo de vida dos dados e melhora a experiência para todos os usuários simultaneamente.

## What Changes

- **Novo**: Camada de cache Redis no backend para os endpoints `GET /newfetch` e `GET /cables`.
- **Novo**: Job cron a cada 2 horas que reabastece proativamente o cache Redis (warm-up), garantindo que os dados sempre estejam prontos antes de qualquer requisição.
- **Removido**: Lógica de cache client-side (localStorage) no store `tomodat.js` do frontend — funções `readCache`, `writeCache`, `invalidateCache` e as constantes `CACHE_KEY_FULL`, `CACHE_KEY_GUEST`, `CACHE_TTL_MS`.
- **Modificado**: `fetchController.js` — os métodos `ListarFetchNew` e `ListarCabos` passam a verificar/popular o Redis antes de consultar o MongoDB.
- **Modificado**: `server.js` — registra o novo cron de warm-up do cache ao lado dos crons existentes.

## Capabilities

### New Capabilities

- `redis-cache`: Cache server-side com Redis para os endpoints de dados geoespaciais do HeatMap, com warm-up automático a cada 2 horas e TTL de segurança.

### Modified Capabilities

<!-- nenhuma — mudança é de implementação, sem alteração de contratos de API ou comportamento observável pelo frontend -->

## Impact

- **Backend**: Adiciona dependência `ioredis`. Requer instância Redis acessível (local ou via Docker). Os endpoints `/newfetch` e `/cables` passam a responder em < 50ms quando o cache está quente.
- **Frontend**: Remove ~40 linhas de lógica de cache do `tomodat.js`; a API pública do store (`getTomodatData`, `invalidateCache`) é removida ou simplificada — `invalidateCache` deixa de existir no frontend.
- **Docker**: `docker-compose.yml` precisa incluir o serviço Redis.
- **Variáveis de ambiente**: Nova variável opcional `REDIS_URL` (padrão: `redis://localhost:6379`).
