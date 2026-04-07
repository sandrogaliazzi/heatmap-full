## Context

O HeatMap é o componente central da aplicação. Ao ser carregado, dispara dois endpoints custosos:

- `GET /newfetch` — consulta a coleção `newfetchWithPppoe` no MongoDB (dados de CTOs com clientes e PPPoE agregados). Coleção pode ter centenas de documentos, cada um com arrays de clientes.
- `GET /cables` — consulta a coleção `tomodatcompleto` no MongoDB (dados de cabos geoespaciais, potencialmente volumosa).

Atualmente, o frontend mitiga o problema com cache no localStorage (TTL de 120 minutos). Esse modelo tem três problemas: (1) cada usuário/dispositivo executa o pipeline pesado na primeira visita; (2) o localStorage tem limite de 5–10 MB e pode falhar silenciosamente; (3) não há como invalidar o cache de todos os usuários centralmente.

A solução move o cache para o Redis no backend, onde um único warm-up serve todos os usuários.

## Goals / Non-Goals

**Goals:**
- Servir `/newfetch` e `/cables` em < 50ms quando o cache Redis está quente.
- Warm-up automático a cada 2 horas via cron, sem intervenção manual.
- Remover toda lógica de cache do `tomodat.js` no frontend.
- Zero downtime: se o Redis estiver indisponível, os endpoints fazem fallback para MongoDB normalmente.

**Non-Goals:**
- Cache de outros endpoints além de `/newfetch` e `/cables`.
- Cache por usuário ou por role (o cache é global — convidados recebem dados filtrados pelo próprio endpoint `/tomodat-basico`, que não entra no escopo desta mudança).
- Implementar Redis Cluster ou replicação.

## Decisions

### D1: `ioredis` como cliente Redis

**Escolha:** `ioredis` em vez de `redis` (pacote oficial).

**Rationale:** `ioredis` tem melhor suporte a reconexão automática, promisify nativo e é amplamente usado em projetos Node.js de produção. O backend já usa padrões de callback/promise mistos — `ioredis` se integra bem.

**Alternativa descartada:** `redis` v4 — funciona, mas `ioredis` tem documentação mais madura e suporte a Sentinel/Cluster para evolução futura.

---

### D2: Cache global, não por usuário

**Escolha:** Uma única chave Redis por endpoint (`cache:newfetch` e `cache:cables`), sem segmentação por role.

**Rationale:** Os endpoints já retornam dados completos sem filtragem por role — o frontend faz a filtragem visual. O endpoint `/tomodat-basico` (usado pelo `convidado`) é separado e leve, então fica fora do escopo.

**Alternativa descartada:** Cache por role — aumentaria complexidade e consumo de memória sem benefício real, pois `adm`/`tecnico`/`vendas` recebem os mesmos dados.

---

### D3: Warm-up proativo via cron (não lazy-load)

**Escolha:** Um cron job a cada 2 horas reabastece o cache ativamente, independente de requisições.

**Rationale:** Com lazy-cache, o primeiro usuário após a expiração sofre a latência do MongoDB. Com warm-up proativo, o cache nunca expira do ponto de vista do usuário — o cron garante dados frescos antes mesmo de qualquer requisição.

**TTL Redis:** 150 minutos (2h30min) — 30 minutos de janela de segurança caso o cron atrase. Se o cron falhar e o cache expirar, o fallback para MongoDB é acionado automaticamente (ver D4).

---

### D4: Fallback silencioso para MongoDB se Redis indisponível

**Escolha:** Se `ioredis` lançar erro ou o TTL expirar antes do warm-up, o handler do endpoint executa a query MongoDB normalmente e retorna os dados sem armazenar no cache.

**Rationale:** Redis é uma otimização, não um requisito de disponibilidade. A aplicação deve funcionar sem ele.

---

### D5: Módulo `redisClient.js` centralizado

**Escolha:** Criar `backend/src/config/redisClient.js` que exporta uma instância única de `ioredis` e uma função utilitária `getOrSetCache(key, ttl, fetchFn)`.

**Rationale:** Evita duplicação de lógica de try/catch e fallback em cada controller. Centraliza a configuração da URL Redis (`REDIS_URL` env var).

---

### D6: Cron de warm-up em `server.js`

**Escolha:** Adicionar o cron de warm-up ao lado dos três crons existentes em `server.js`, chamando as mesmas funções de fetch já usadas nos controllers.

**Rationale:** `server.js` já é o ponto de registro de todos os crons do sistema. Manter a consistência arquitetural.

## Risks / Trade-offs

| Risco | Mitigação |
|---|---|
| Redis fora do ar em produção | Fallback para MongoDB (D4) — aplicação segue funcional com latência degradada |
| Cache desatualizado entre warm-ups | TTL de 150 min + cron a cada 120 min garantem no máximo 2h de defasagem — aceitável para dados de infraestrutura |
| Dados de cabos muito grandes para o Redis | Serialização JSON; se ultrapassar 512 MB, ajustar TTL ou fragmentar. Verificar tamanho real da coleção antes de implementar |
| Cron de warm-up falha silenciosamente | Adicionar log de erro explícito no cron; monitorar via logs existentes do servidor |
| Conflito de TTL: cron demora mais que 150 min | Improvável, mas mitigado pelo fallback MongoDB |

## Migration Plan

1. Adicionar Redis ao `docker-compose.yml`.
2. Implementar `redisClient.js` com `getOrSetCache`.
3. Modificar `fetchController.js` (`ListarFetchNew`) e `cableController.js` (`ListCables`) para usar `getOrSetCache`.
4. Adicionar cron de warm-up em `server.js`.
5. Remover lógica de cache do `frontend/src/stores/tomodat.js`.
6. Testar localmente: subir stack com Docker, verificar que HeatMap carrega sem localStorage.
7. Deploy: reiniciar backend; Redis inicia vazio → primeiras requisições fazem fallback MongoDB → cron popula cache → requisições subsequentes servidas pelo Redis.

**Rollback:** Reverter commits do backend e frontend individualmente. Não há migração de dados — Redis é efêmero.

## Open Questions

- Qual é o tamanho médio do payload de `/cables` em produção? (Determina se precisa de compressão antes de armazenar no Redis.)
- O Redis será gerenciado via Docker Compose ou como serviço externo (ex: Redis Cloud)? (Afeta a configuração da `REDIS_URL` no ambiente de produção.)
