## 1. Infraestrutura Redis

- [x] 1.1 Adicionar serviço `redis` ao `docker-compose.yml` (imagem `redis:7-alpine`, porta 6379)
- [x] 1.2 Adicionar `ioredis` como dependência em `backend/package.json` (`npm install ioredis`)
- [x] 1.3 Criar `backend/src/config/redisClient.js` exportando instância `ioredis` configurada via `REDIS_URL` env var (padrão: `redis://localhost:6379`) com reconexão automática

## 2. Utilitário de Cache

- [x] 2.1 Implementar função `getOrSetCache(key, ttlSeconds, fetchFn)` em `redisClient.js`: tenta `GET key` no Redis; em cache miss executa `fetchFn()`, salva resultado com `SETEX key ttl data` e retorna; em erro do Redis faz fallback direto para `fetchFn()`

## 3. Cache nos Controllers do Backend

- [x] 3.1 Modificar `fetchController.js` — método `ListarFetchNew`: substituir query direta ao MongoDB por `getOrSetCache('cache:newfetch', 9000, () => newFetch.find(...).exec())` (TTL 150 min = 9000s)
- [x] 3.2 Modificar `cableController.js` — método `ListCables`: substituir query direta ao MongoDB por `getOrSetCache('cache:cables', 9000, () => tomodatcompleto.find(...).exec())`

## 4. Cron de Warm-up

- [x] 4.1 Criar função `warmUpCache()` em `backend/src/scripts/warmUpCache.js` que executa as queries do MongoDB para `newfetch` e `cables` e popula o Redis com TTL de 9000s, com log de sucesso/erro
- [x] 4.2 Registrar cron `0 */2 * * *` em `server.js` chamando `warmUpCache()`, ao lado dos três crons existentes
- [x] 4.3 Executar `warmUpCache()` uma vez ao iniciar o servidor para pré-aquecer o cache no boot

## 5. Remoção do Cache Client-Side no Frontend

- [x] 5.1 Remover de `frontend/src/stores/tomodat.js` as constantes `CACHE_TTL_MS`, `CACHE_KEY_FULL`, `CACHE_KEY_GUEST` e as funções `readCache`, `writeCache`
- [x] 5.2 Simplificar a função `getTomodatData` no `tomodat.js` removendo as verificações de cache localStorage — manter apenas as chamadas às APIs (`/newfetch`, `/cables`, `/tomodat-basico`)
- [x] 5.3 Remover a função `invalidateCache` do store e sua exportação no `return` do `defineStore`

## 6. Variável de Ambiente

- [x] 6.1 Documentar a variável `REDIS_URL` no `docker-compose.yml` como variável de ambiente do serviço backend (ex: `REDIS_URL=redis://redis:6379`)
