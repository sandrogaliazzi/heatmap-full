## 1. Correção do botão de navegação (next_ap sobrescrito)

- [x] 1.1 Em `mapApConn.js`, na função `mergeConnectionData`, adicionar `next_ap: incoming.next_ap || existing.next_ap` no objeto retornado, após o spread `...incoming`, para preservar o valor não-vazio de `next_ap`

## 2. Correção da linha quebrada em nós do mesmo lado

- [x] 2.1 Em `ShowApConnDiagram.vue`, na função `buildLinkPath`, no branch `sourceSide === targetSide`, substituir o uso de `mid` (centróide aritmético) pelo ponto real de dobramento: `{ x: bendX, y: (start.y + end.y) / 2 }` nos retornos de `segment === "first"` e `segment === "second"`
