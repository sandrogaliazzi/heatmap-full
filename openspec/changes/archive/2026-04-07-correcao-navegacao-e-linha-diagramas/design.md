## Context

A feature de navegação entre diagramas foi implementada nas tasks anteriores. Dois bugs impedem o funcionamento correto:

**Bug 1 — Botão de navegação não renderizado:**
A função `collectAllConnections` em `mapApConn.js` acumula conexões a partir de fusões aninhadas (`fusion.access_point_connection_in/out`). Quando a mesma conexão aparece tanto no nível raiz (com `next_ap` preenchido) quanto no objeto aninhado (com `next_ap: ""`), `mergeConnectionData` usa `...incoming` sem guardar o valor existente — o `next_ap` não-vazio é sobrescrito pela string vazia. Resultado: `parseNextAp` retorna `null` e `node.nextAp?.id` falha no template.

**Bug 2 — Linha quebrada em nós do mesmo lado:**
`buildLinkPath` calcula o ponto de divisão bicolor como o centróide aritmético entre `start` e `end` (`mid = { x: (start.x+end.x)/2, y: (start.y+end.y)/2 }`). Para nós do mesmo lado (esquerda), `start.x ≈ end.x`, portanto `mid.x` fica longe de `bendX`. O segmento `first` termina em `mid` (fora da rota real), e o `second` parte de `mid`, gerando uma diagonal visível com aparência de linha quebrada com ponto no meio.

## Goals / Non-Goals

**Goals:**
- Preservar `next_ap` com valor ao mesclar conexões em `mergeConnectionData`
- Calcular o ponto de divisão bicolor no caminho real da linha (no `bendX`, à `midY`) para conexões same-side

**Non-Goals:**
- Nenhuma alteração de comportamento além da correção dos dois bugs
- Nenhum refactoring de lógica de layout ou de outras rotas de `buildLinkPath`

## Decisions

**Bug 1 — Preservação de `next_ap`:**
Adicionar `next_ap: incoming.next_ap || existing.next_ap` dentro do objeto retornado por `mergeConnectionData`, após o spread `...incoming`. Isso garante que o valor não-vazio de qualquer das duas fontes seja preservado.

Alternativa considerada: filtrar conexões aninhadas para não sobrescrever campos específicos. Rejeitado — mais invasivo e desnecessário.

**Bug 2 — Ponto de divisão same-side:**
Substituir `mid` (centróide aritmético) pelo ponto na rota real: `{ x: bendX, y: (start.y + end.y) / 2 }`. O `bendX` já é calculado corretamente para o branch same-side. Isso garante que `first` termina e `second` começa exatamente no dobramento da linha, sem diagonal.

Alternativa considerada: recalcular `mid` globalmente. Rejeitado — o `mid` aritmético é correto para lados opostos; só o branch same-side precisa de tratamento diferente.

## Risks / Trade-offs

- Mudança em `mergeConnectionData` pode afetar outros campos se o padrão `|| existing.field` for aplicado incorretamente → limitar apenas ao campo `next_ap` para minimizar risco
- A correção do ponto de divisão bicolor é localizada no branch `sourceSide === targetSide` e não afeta outros branches
