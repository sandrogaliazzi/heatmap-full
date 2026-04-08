## 1. Redesign — Espaçamento dos clientes (bottom)

- [x] 1.1 Em `mapApConn.js`, remover o `BOTTOM_BASE_Y` hardcoded e calcular dinamicamente como `maxY(nós laterais) + 120`
- [x] 1.2 Verificar visualmente com o `diagramModel.json` que clientes não se sobrepõem a splitters de 8+ portas

## 2. Redesign — Linhas de fusão bicolores

- [x] 2.1 Em `mapApConn.js`, refatorar `buildLinks` para retornar dois objetos de link por fusão quando `FIBER_COLORS[fiber_in] !== FIBER_COLORS[fiber_out]`: um com a cor de origem e `segment: 'first'`, outro com a cor de destino e `segment: 'second'`
- [x] 2.2 Em `ShowApConnDiagram.vue`, atualizar `buildLinkPath` para aceitar o campo `segment` e retornar apenas a metade do path (ponto inicial → ponto médio para `'first'`, ponto médio → ponto final para `'second'`)
- [x] 2.3 Calcular o ponto médio como a média aritmética das coordenadas SVG de `start` e `end` do path

## 3. Redesign — Notas de slot sem transbordamento

- [x] 3.1 Em `ShowApConnDiagram.vue`, substituir o elemento `<text class="slot-note">` por `<foreignObject>` com um `<div>` interno para cada nota de slot
- [x] 3.2 Estilizar o `<div>` interno com `word-break: break-word; overflow: hidden; font-size: 11px; line-height: 1.2;` e `max-height` igual a `rowHeight`
- [x] 3.3 Ajustar `x`, `y`, `width` e `height` do `<foreignObject>` para respeitar os limites visuais da linha da porta

## 4. Navegação — Botão de próximo AP nos nós de cabo

- [x] 4.1 Em `mapApConn.js`, adicionar ao objeto `node` o campo `nextAp` (resultado de `parseNextApName` já existente, mas agora incluindo o `id` completo do objeto `next_ap` parseado) para nós do tipo `cable`
- [x] 4.2 Em `ShowApConnDiagram.vue`, dentro do `<g>` dos nós não-cliente, adicionar um bloco condicional `v-if="node.nextAp?.id"` que renderiza um `<foreignObject>` com um `<v-btn>` ou `<button>` HTML mostrando "→ {{ node.nextAp.name }}"
- [x] 4.3 Posicionar o botão no rodapé do nó (abaixo da última linha de porta) sem ultrapassar os limites do `node.height`

## 5. Navegação — Estado de histórico e fetch do próximo AP

- [x] 5.1 Em `ShowApConnDiagram.vue`, adicionar `ref` para o histórico de navegação: `navHistory = ref([{ apId: null, apName: props.title, connections: props.connections }])`
- [x] 5.2 Adicionar `ref` para o índice atual: `currentIndex = ref(0)` e um computed `currentConnections` que retorna `navHistory.value[currentIndex.value].connections`
- [x] 5.3 Implementar a função `navigateToAp(apId, apName)`: faz `fetchApi.get('connections/' + apId)`, exibe spinner durante o fetch, em caso de sucesso empilha `{ apId, apName, connections: response.data }` no `navHistory` e incrementa `currentIndex`
- [x] 5.4 Tratar erros de fetch com `try/catch` e exibir snackbar ou alert Vuetify com a mensagem de erro
- [x] 5.5 Trocar `:connections="props.connections"` no `computed(() => mapApConn(...))` para usar `currentConnections`

## 6. Navegação — Breadcrumbs Vuetify

- [x] 6.1 Adicionar `<v-breadcrumbs>` acima do `<svg>` no template, com `items` mapeados de `navHistory` (cada item: `{ title: entry.apName, disabled: index === currentIndex }`)
- [x] 6.2 Ao clicar em um item do breadcrumb, definir `currentIndex.value = index` (sem novo fetch — dados já estão em `navHistory`)
- [x] 6.3 Truncar o `navHistory` ao item clicado + 1 para descartar o histórico "à frente" ao navegar para um ponto anterior (comportamento padrão de histórico de browser)
- [x] 6.4 Estilizar o breadcrumb para contraste adequado sobre o fundo cinza do container `.ap-conn-diagram`

## 7. Integração e verificação visual

- [x] 7.1 Abrir o diagrama na aplicação usando `diagramModel.json` como dados e conferir: espaçamento de clientes, bicolor nas linhas, notas sem overflow
- [x] 7.2 Simular navegação manualmente (mockar `fetchApi` ou apontar para API local) e verificar breadcrumb e troca de diagrama
- [x] 7.3 Verificar comportamento no mobile (zoom < 1) — breadcrumb não deve quebrar o layout
