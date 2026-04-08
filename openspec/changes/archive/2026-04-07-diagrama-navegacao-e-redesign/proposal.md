## Why

O diagrama de conexões dos pontos de acesso (CTO/CE) exibe corretamente a estrutura de fusões de um único ponto de acesso, mas não permite navegar entre pontos conectados — para inspecionar a continuidade da rede o técnico precisa fechar o diagrama e abrir manualmente o próximo AP. Adicionalmente, o layout visual está condensado (elementos cliente colados aos splitters/cabos), as linhas de fusão usam cor única (ignorando a cor das fibras nos dois extremos), e as notas de slot transbordando o container dificultam a leitura.

## What Changes

- **Navegação entre diagramas**: elementos do tipo cabo que possuem `next_ap` recebem um botão clicável; ao clicar, o diagrama carrega as conexões do próximo AP via API, empilhando o histórico de navegação.
- **Breadcrumb de navegação**: barra Vuetify Breadcrumbs acima do SVG exibe o caminho percorrido (ex: CTO-A → CE-1 → CTO-B) com links para retornar a qualquer ponto anterior.
- **Espaçamento dos clientes**: elementos do tipo `client` (bottom) recebem maior distância vertical dos nós de splitter/cabo, evitando sobreposição visual.
- **Linhas de fusão bicolores**: quando a fibra de origem e a fibra de destino têm cores diferentes, o path SVG é dividido em dois segmentos — primeira metade na cor da fibra de origem, segunda metade na cor da fibra de destino.
- **Notas de slot com quebra de texto**: o elemento SVG `<text>` das notas passa a usar `foreignObject` com `<div>` controlado por CSS (`word-break`, `overflow: hidden`), ou texto SVG com `textLength` + `lengthAdjust`, impedindo transbordamento do container do nó.

## Capabilities

### New Capabilities

- `diagram-navigation`: Sistema de navegação entre diagramas de AP — botão "próximo AP" nos nós de cabo com `next_ap`, carregamento dinâmico do diagrama seguinte, histórico de breadcrumbs.

### Modified Capabilities

- (nenhuma — as melhorias de estilo são puramente de implementação, sem mudança de requisitos de negócio)

## Impact

- **`frontend/src/components/CtoDiagram/ShowApConnDiagram.vue`** — adiciona breadcrumbs, estado de histórico de navegação, botão de navegação nos nós de cabo, lógica de carregamento do próximo AP.
- **`frontend/src/components/CtoDiagram/mapApConn.js`** — ajusta `BOTTOM_BASE_Y` / espaçamento dos clientes; refatora `buildLinks` para suportar links bicolores (retornar dois segmentos por fusão quando cores diferem).
- **`frontend/src/components/CtoModalDialog/CtoCard.vue`** — pode precisar expor `apId` para que o componente filho busque as conexões do próximo AP.
- **API backend** — rota existente de busca de conexões por AP (`/access-point/:id/connections` ou equivalente) será reutilizada; sem novas rotas necessárias.
- **Dependência**: Vuetify já presente no projeto (usado para breadcrumbs).
