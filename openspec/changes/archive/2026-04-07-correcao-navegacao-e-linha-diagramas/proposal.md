## Why

A última implementação da feature de navegação entre diagramas tem dois bugs críticos: o botão de navegação para o próximo AP nunca é renderizado, tornando a navegação inoperante; e conexões entre nós do mesmo lado (esquerda) exibem uma linha quebrada com um ponto no meio, causando artefato visual.

## What Changes

- Corrigir `mergeConnectionData` em `mapApConn.js` para preservar o campo `next_ap` não-vazio ao mesclar dados de conexões aninhadas (o spread `...incoming` sobreescreve o `next_ap` existente com string vazia)
- Corrigir `buildLinkPath` em `ShowApConnDiagram.vue` para que segmentos bicolor em nós do mesmo lado (same-side) usem o ponto de dobra correto como ponto de divisão, e não o centróide aritmético entre start e end (que fica fora da rota real)

## Capabilities

### New Capabilities
<!-- nenhuma nova capability -->

### Modified Capabilities
- `diagram-navigation`: O botão de navegação passa a ser renderizado corretamente quando `next_ap` está preenchido na conexão de cabo

## Impact

- `frontend/src/components/CtoDiagram/mapApConn.js` — função `mergeConnectionData`
- `frontend/src/components/CtoDiagram/ShowApConnDiagram.vue` — função `buildLinkPath` (branch same-side segments)
