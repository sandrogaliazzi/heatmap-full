# CLAUDE.md — Backend

Node.js + Express API para o sistema Heatmap da Rede (Conectnet Telecom). Porta **5005**.

## Comandos

```bash
npm run dev      # nodemon (desenvolvimento)
npm run cad      # scripts/cadastroFetch.js
```

Sem testes automatizados configurados.

## Estrutura

```
backend/
├── server.js          # Entry point: HTTP server + 3 cron loops
├── src/
│   ├── app.js         # Express setup, MongoDB connect, registra rotas
│   ├── routes/        # 28 arquivos de rotas, agregados em index.js
│   ├── controllers/   # 29 controllers — toda a lógica de negócio
│   ├── models/        # 29 schemas Mongoose
│   ├── middleware/    # auth, IP injection, multer, request monitor
│   ├── scripts/       # Jobs de background (node-cron)
│   └── config/        # dbConnect.js
```

## Rotas (28 módulos)

Todos registrados em `src/routes/index.js`:

| Arquivo | Domínio |
|---|---|
| `userRoutes.js` | CRUD de usuários |
| `loginRoutes.js` | Dados de login |
| `oltRoutes.js` | OLTs e ONUs |
| `onuClienteRoutes.js` | Dados de cliente por ONU |
| `pppoeRoutes.js` | Sessões PPPoE |
| `fetchRoutes.js` | ETL do Tomodat (6 endpoints de agregação) |
| `ctoClientRoutes.js` | Clientes por CTO |
| `trackingRoutes.js` | Rastreamento de clientes |
| `ramalLogRoutes.js` | Logs de ramais |
| `vlanRoutes.js` | VLANs |
| `equipamentRoutes.js` | Equipamentos |
| `instalacoesRoutes.js` | Registros de instalação |
| `salesRoutes.js` | Dados comerciais |
| `eventRoutes.js` | Log de eventos |
| `messageRoutes.js` | Mensagens internas |
| `noteRoutes.js` | Notas |
| `cableRoutes.js` | Cabos de rede |
| `auditoriaRoutes.js` | Auditoria de ações |
| `reservadosRoutes.js` | Dados reservados |
| `tokenRoutes.js` | Refresh de token JWT |
| `tomodatRoutes.js` | Operações ETL Tomodat |
| `backupRoutes.js` | Backup |
| `uploadRoutes.js` | Upload de arquivos |
| `mkOsRoutes.js` | Integração ERP Mk Solutions |
| `hubsoftTokenRoutes.js` | Token Hubsoft |
| `macVendorRoutes.js` | Lookup de fabricante por MAC |
| `pdfRoutes.js` | Geração de PDFs |
| `fullTrackRoutes.js` | Rastreamento completo |

## Controllers principais

- **`oltController.js`** — O maior. Gerencia conexões SSH e TL1 com OLTs (Parks, Fiberhome). Busca sinais RX/TX de ONUs, CRUD de ramais.
- **`fiberhomeController.js`** — Protocolo específico para OLTs Fiberhome via TCP raw socket.
- **`fetchController.js`** — ETL do Tomodat para MongoDB. Usa pipelines de `$lookup` para dados relacionais.
- **`usersController.js`** — CRUD de usuários, hash bcrypt, geração de JWT.
- **`mkOsController.js`** — Chamadas REST para ERP Mk Solutions.
- **`auditoriaController.js`** — Registro de trilha de auditoria.
- **`uploadController.js`** — Upload de arquivos via Multer.

## Models (MongoDB / Mongoose)

Infraestrutura de rede: `ctoModel`, `oltModel`, `onuClient`, `ramaisOlt`, `vlansModel`, `cableModel`
Clientes: `ctoClient`, `ctoClientLogModel`, `allOnuClients`
Rede/PPPoE: `pppoeModel`, `pppoeDataModel`, `fetchModel`, `newFetchWithPppoe`
Usuários: `users`, `loginModel`
Negócio: `salesModel`, `instalacoesModel`, `trackingModel`, `notesModel`, `eventModel`, `auditoriaModel`, `message`
Outros: `imageUploadModel`, `cameraModel`, `metricModel`, `Reservados`, `equipamentClientModel`

## Middleware

| Arquivo | Função |
|---|---|
| `auth.js` | Verifica JWT via header `x-access-token`. Rejeita se token inválido ou usuário `blocked`. |
| `injecClientIp.js` | Extrai IP do cliente da requisição |
| `reqMonitor.js` | Monitoramento de requisições |
| `upload.js` | Configuração do Multer para upload de arquivos |

## Scripts de Background (node-cron)

Iniciados em `server.js`, rodam continuamente:

- **`uploadSignals.js`** — Busca sinais RX/TX das ONUs conectando via SSH nas OLTs
- **`updateFetch.js`** — Sincroniza dados do Tomodat no MongoDB
- **`deleteReservados.js`** — Limpeza de registros expirados/reservados
- **`cadastroFetch.js`** — Cadastro inicial de dados do Tomodat
- **`fetchCables.js`** — Sincroniza dados de cabos

## Autenticação

- JWT assinado com `TOKEN_KEY` (env var)
- Token enviado no header `x-access-token`
- Refresh via `POST /refresh-token`
- Roles: `adm`, `tecnico`, `vendas`, `convidado`
- Usuários com campo `blocked: true` são rejeitados no middleware

## Banco de dados

**MongoDB** (principal):
- Connection string via `MONGO_DB_ACCESS` env var
- Configurado em `src/config/dbConnect.js`
- 29 coleções

**PostgreSQL** (legado Tomodat):
- Knex.js para query building
- Configurado em `knexfile.js` na raiz do backend
- Dados sincronizados para MongoDB via scripts de background

## Integrações externas

| Sistema | Tipo | Controller | Finalidade |
|---|---|---|---|
| OLTs Fiberhome | SSH + TL1 | `fiberhomeController.js` | Sinais ONU |
| OLTs Parks | SSH | `oltController.js` | Sinais ONU |
| Tomodat | REST API | `fetchController.js` | ETL de CTOs/cabos |
| Mk Solutions | REST API | `mkOsController.js` | ERP legado |
| Hubsoft | REST API | rotas hubsoft | ERP atual |

## Variáveis de Ambiente

```
MONGO_DB_ACCESS   # MongoDB connection string (obrigatório)
TOKEN_KEY         # Segredo para assinar JWT (obrigatório)
PORT              # Porta HTTP (padrão: 5005)
```

Sem `.env` commitado — configurar localmente ou via Docker.

## Padrões do projeto

- Rotas são thin wrappers — lógica fica nos controllers
- Pipelines de agregação MongoDB (`$lookup`, `$match`, `$group`) para dados relacionais
- Conexões SSH com OLTs são feitas sob demanda ou pelo cron, usando a lib `ssh2`
- Fiberhome usa TCP raw socket com protocolo TL1 proprietário
