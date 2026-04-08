## Context

O componente `ShowApConnDiagram.vue` recebe um array `connections` via prop e renderiza um SVG estático usando `mapApConn.js`. Atualmente, não há estado de navegação: o componente pai (`CtoCard.vue`) passa as conexões do AP atual e o diagrama não sabe de outros APs. O modelo de dados já inclui `next_ap` (objeto JSON stringificado) nos nós de cabo, contendo pelo menos `{ id, name }` do próximo ponto de acesso.

A API backend já expõe um endpoint para buscar conexões por AP (reutilizado ao abrir o diagrama pela primeira vez). O frontend usa Axios via `fetchApi` com token JWT injetado automaticamente.

## Goals / Non-Goals

**Goals:**
- Permitir navegação "para frente" de AP em AP clicando em nós de cabo com `next_ap`
- Manter histórico de navegação com breadcrumbs Vuetify para retornar a qualquer ponto anterior
- Aumentar espaçamento vertical entre clientes (bottom) e os nós de splitter/cabo
- Renderizar linhas de fusão bicolores quando as fibras dos dois extremos têm cores diferentes
- Impedir que notas de slot transbordem o container do nó SVG

**Non-Goals:**
- Navegação "para trás" automática (o breadcrumb cobre esse caso)
- Edição do diagrama no frontend
- Cache persistente de diagramas visitados entre sessões
- Alteração do backend

## Decisions

### 1. Estado de navegação no próprio `ShowApConnDiagram`

**Decisão:** O histórico de navegação (pilha de `{ apId, apName, connections }`) é gerenciado via `ref` dentro do próprio componente, não em Pinia.

**Alternativa rejeitada:** Store Pinia global — desnecessário para um estado de UI local ao modal de diagrama; adicionaria acoplamento.

**Razão:** O ciclo de vida do histórico é idêntico ao do componente; ao fechar o modal o histórico é descartado naturalmente.

---

### 2. Busca das conexões do próximo AP via `fetchApi` diretamente no componente

**Decisão:** `ShowApConnDiagram` faz `fetchApi.get('/access-point-connections/:apId')` (ou rota equivalente já usada por `CtoCard`) quando o usuário clica em navegar.

**Alternativa rejeitada:** Emitir evento para o pai e deixar `CtoCard` fazer o fetch — adiciona boilerplate desnecessário sem ganho real.

**Razão:** O componente já é responsável por renderizar o diagrama; ter a busca localmente mantém a coesão.

---

### 3. Linhas bicolores via dois `<path>` separados por fusão

**Decisão:** Quando `fiber_in` e `fiber_out` têm cores diferentes, `buildLinks` retorna dois objetos de link para a mesma fusão: um cobrindo a primeira metade do path (cor de origem) e outro a segunda metade (cor de destino). A divisão é feita pelo ponto médio das coordenadas SVG calculado em `buildLinkPath`.

**Alternativa rejeitada:** SVG `<linearGradient>` — gradiente não respeita a geometria arbitrária de paths curvilíneos (não é um gradiente linear do ponto A ao ponto B ao longo do path).

**Alternativa rejeitada:** `stroke-dasharray` com dois `<path>` sobrepostos — mais complexo e menos legível.

**Razão:** Dois paths com `d` dividido no ponto médio é simples, previsível e sem dependência de features SVG avançadas.

---

### 4. Notas de slot via `foreignObject` SVG

**Decisão:** O elemento de nota de slot (`slotLabelMap`) passa a usar `<foreignObject>` com um `<div>` HTML interno estilizado com `word-break: break-word; overflow: hidden; max-height: <rowHeight>px`.

**Alternativa rejeitada:** `textLength` + `lengthAdjust="spacingAndGlyphs"` — comprime o texto horizontalmente, prejudicando legibilidade.

**Alternativa rejeitada:** Truncar com `…` no JS — perde informação; o técnico precisa ver a nota completa.

**Razão:** `foreignObject` permite CSS completo para quebra de texto dentro de SVG, solução padrão para este problema.

---

### 5. Espaçamento dos clientes — ajuste de `BOTTOM_BASE_Y`

**Decisão:** Aumentar `BOTTOM_BASE_Y` de `660` para `820` (ou valor derivado dinamicamente do `maxY` dos nós laterais + padding fixo de `120px`).

**Razão:** O valor atual foi calibrado para um número pequeno de portas; com splitters de 8+ portas os clientes ficam sobrepostos. A derivação dinâmica é mais robusta.

## Risks / Trade-offs

- **Endpoint de conexões por AP desconhecido** → Mitigação: verificar em `CtoCard.vue` qual rota é usada para buscar as conexões iniciais e reutilizá-la.
- **`foreignObject` em SVG exportado/impresso** → `foreignObject` pode não renderizar em alguns contextos de exportação PDF. Mitigação: aceitar limitação para MVP; funcionalidade de export PDF é inexistente no momento.
- **Performance com diagramas grandes** → Cada navegação faz um fetch HTTP. Para APs com muitas conexões o SVG pode ficar grande. Mitigação: o scroll já existe no container; sem paginação por ora.
- **`next_ap` como string JSON** → Parsing pode falhar silenciosamente. A função `parseNextApName` já trata o caso; adicionar validação do campo `id` antes de tentar navegar.
