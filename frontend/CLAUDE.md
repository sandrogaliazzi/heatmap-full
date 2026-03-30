# CLAUDE.md — Frontend

Vue 3 SPA com Vite para o sistema Heatmap da Rede (Conectnet Telecom). Porta de desenvolvimento **5000**.

## Comandos

```bash
npm run dev      # Vite dev server com hot-reload
npm run build    # Build de produção (gera dist/)
npm run preview  # Preview do build de produção
```

Sem testes automatizados configurados.

## Estrutura

```
frontend/src/
├── main.js          # Cria app Vue, registra plugins, monta #app
├── App.vue          # Root: tema dark/light, modal de token expirado, Notification
├── router/          # Vue Router com guards de auth e role
├── stores/          # Pinia state management
├── api/             # Instâncias Axios por domínio
├── views/           # Componentes de página
├── components/      # Componentes reutilizáveis por feature
├── directives/      # Diretiva v-role para RBAC nos templates
├── utils/           # Funções utilitárias
└── assets/          # Imagens, fontes (MDI, Roboto)
```

## Roteamento (`router/index.js`)

| Rota | View | Acesso |
|---|---|---|
| `/login` | `LoginView` | Público |
| `/heatmap` | `HeatMapView` | Autenticado (default home) |
| `/dashboard` | `DashboardView` | `adm` |
| `/dashboard/users` | `UserList` | `adm` |
| `/dashboard/olt` | `OltList` | `adm` |
| `/dashboard/logs` | `LogsList` | `adm` |
| `/dashboard/camera` | `CameraList` | `adm`, `tecnico` |
| `/comercial` | `DashboardComercialView` | `adm`, `vendas` |
| `/viabilidade` | `ViabilityView` | `convidado` e superiores |
| `/auditoria` | `AuditoriaView` | Autenticado |
| `/*` | `PageNotFoundView` | — |

**Lógica do guard:**
1. Verifica `user` e `token` no localStorage
2. Valida role via `user.category`
3. Sem auth → `/login`
4. Role incorreta → `/heatmap`
5. `convidado` → `/viabilidade`

## Stores (Pinia)

### `user.js`
- `setUser(userData)` — salva user + token no localStorage, seta `isAuthenticated`
- `logout()` — limpa localStorage
- Reativo: `user`, `isAuthenticated`

### `auth.js`
- Reativo: `tokenExpired` — quando `true`, `App.vue` exibe modal de sessão expirada

### `tomodat.js` (store principal de dados)
- `getTomodatData(user)` — chama `/newfetch` + `/cables` (convidado não recebe `/cables`)
- `getAllLocatedClients()` — chama `/ctoclient`
- Reativo: `ctoList`, `cableList`, `locatedClients`, `selectedCto`, `mapZoom`, `selectedUserLocation`, `loadingData`, `setPolygonDrawMode`
- Computed: `getClients`

### `heatmap.js`
- `toggleHeatMap()`, `togglePolyLineDrawingMode()`
- Reativo: `isHeatMapVisible`, `isPolyLineDrawingMode`

### `services.js`
- `fetchServices()` — busca serviços no Hubsoft via `/api/v1/integracao/configuracao/servico`
- Reativo: `services`

## API / HTTP (`api/`)

### `index.js` — instância principal (`fetchApi`)
- Base URL: `https://api.heatmap.conectnet.net/`
- **Request interceptor:** injeta `x-access-token` do localStorage em toda requisição
- **Response interceptor:** em 401/403, tenta refresh via `/refresh-token`; se falhar, seta `tokenExpired = true` no store `auth`
- Flag `_retry` evita loop infinito no refresh

### `mkApi.js`
- Integração com ERP Mk Solutions
- Exporta: `getMkToken()`, `getClientFone(name, token)`

### `hubsoftApi.js`
- Integração com ERP Hubsoft

### `telegramApi.js`
- Notificações via Telegram

## Views

- **`LoginView.vue`** — Formulário de login
- **`HeatMapView.vue`** — Wrapper simples: `<AppBar /> + <HeatMap />`
- **`DashboardView.vue`** — Container admin com `<router-view>`
- **`DashboardComercialView.vue`** — Dashboard comercial
- **`ViabilityView.vue`** — View para convidado/vendas (viabilidade técnica)
- **`AuditoriaView.vue`** — Logs de auditoria
- **`PageNotFoundView.vue`** — 404

## Componentes principais

### `HeatMap/` (15 arquivos — núcleo do sistema)
- **`HeatMap.vue`** — Componente principal. Integra Google Maps, heatmap de sinais, marcadores de CTO, cabos, eventos, ferramentas de desenho. Usa stores `tomodat`, `heatmap`, `user`.
- **`HeatMap.js`** — Lógica de cálculo do raio do heatmap (`getNewRadius`)
- **`Marker.vue`** — Marcadores de CTO no mapa
- **`CeMarkers.vue`** — Marcadores de CEs (caixas de emenda)
- **`OsMarkers.vue`** — Marcadores de Ordens de Serviço
- **`EventMarker.vue`** + **`EventForm.vue`** — Eventos no mapa
- **`Cables.vue`** — Visualização de cabos (polylines)
- **`PolyLine.vue`** — Desenho de polígonos/áreas
- **`RightSidebar.vue`** — Sidebar com lista de CTOs
- **`MapsControl.vue`** — Controles do Google Maps
- **`util.js`** + **`is-point-within-polygon.js`** — Utilitários geoespaciais
- **`hubApi.js`** — Wrapper do Hubsoft específico para este componente

### `Dashboard/`
`AdminPanel`, `UserList`, `OltList`, `LogsList`, `CameraList` — painel administrativo

### Modais e Dialogs
- **`CtoModalDialog/`** — Detalhes da CTO (`CtoCard.vue`, `CtoViability.vue`)
- **`ClientesOnuModalDialog/`** — Sinais de clientes por ONU
- **`OnuModalDialog/`** — Detalhes da ONU
- **`RamalModalDialog/`** — Detalhes de ramal
- **`CeModalDialog/`** — Detalhes de CE
- **`EmailModalDialog/`** — Envio de email
- **`Dialog/`** — Dialog genérico reutilizável

### Outros
- **`AppBar/`** — Barra de navegação
- **`Notification/`** — Toasts/notificações
- **`Viabilidade/`** — Verificação de viabilidade técnica
- **`Auditoria/`** — Componentes de auditoria
- **`Ativacoes/`** — Ativação de serviços
- **`HubsoftApi/`** — Componentes de integração Hubsoft
- **`Reservados/`** — Dados reservados/planejados
- **`OsList/`** — Ordens de serviço

## Diretiva `v-role`

Definida em `directives/roleDirective.js`, registrada globalmente em `main.js`.

```html
<!-- Oculta elemento se role não corresponde -->
<div v-role="'adm'">Só admin vê</div>
<div v-role="['adm', 'vendas']">Admin ou vendas</div>
```

Role lida de `user.category` no localStorage.

## Autenticação (fluxo frontend)

1. Login → backend retorna JWT → `useUserStore.setUser()` salva em localStorage
2. Toda requisição Axios injeta `x-access-token` automaticamente
3. Em 401/403: tenta `/refresh-token` → se falhar → `tokenExpired = true`
4. `App.vue` observa `tokenExpired` → exibe modal → redireciona para login

## Roles

| Role | Acesso |
|---|---|
| `adm` | Tudo |
| `tecnico` | HeatMap + câmeras |
| `vendas` | HeatMap + comercial |
| `convidado` | Só viabilidade (sem dados de cabos) |

## Dependências principais

| Pacote | Versão | Uso |
|---|---|---|
| Vue | 3.x | Framework |
| Vuetify | 3.6 | UI component library |
| Pinia | 2.1 | State management |
| Vue Router | 4.5 | Roteamento |
| Axios | 1.4 | HTTP client |
| Vue Google Maps | — | Mapa interativo |
| Chart.js | — | Gráficos no dashboard |
| Drawflow | — | Editor de fluxo (experimental) |
| jwt-decode | — | Decodificação de JWT no cliente |
| moment-timezone | — | Formatação de datas |

## Configuração da API

A base URL está em `src/api/index.js`. Para desenvolvimento local, comentar a URL de produção e descomentar `http://localhost:5005`.
