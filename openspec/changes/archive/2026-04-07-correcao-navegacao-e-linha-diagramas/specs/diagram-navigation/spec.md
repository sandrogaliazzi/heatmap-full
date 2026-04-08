## MODIFIED Requirements

### Requirement: Botão de navegação em nós de cabo com próximo AP
Nós do tipo `cable` que possuem o campo `next_ap` com um `id` válido SHALL exibir um elemento interativo (botão ou ícone clicável) sobreposto ao nó no SVG. O botão SHALL estar visível sem hover para que o técnico perceba a possibilidade de navegação. O texto ou tooltip do botão SHALL indicar o nome do próximo AP (`next_ap.name`). O campo `next_ap` SHALL ser preservado com seu valor original durante a mesclagem de dados de conexão (função `mergeConnectionData`), mesmo quando a versão aninhada da conexão possui `next_ap` vazio.

#### Scenario: Botão visível em nó de cabo com next_ap
- **WHEN** o diagrama renderiza um nó de cabo cujo `next_ap` contém `{ id, name }`
- **THEN** um elemento clicável é exibido no nó, indicando o nome do próximo AP

#### Scenario: Nó de cabo sem next_ap não exibe botão
- **WHEN** o diagrama renderiza um nó de cabo com `next_ap` ausente, vazio ou sem campo `id`
- **THEN** nenhum botão de navegação é exibido nesse nó

#### Scenario: next_ap preservado após mesclagem de dados
- **WHEN** a mesma conexão aparece no nível raiz com `next_ap` preenchido e como objeto aninhado em uma fusão com `next_ap` vazio
- **THEN** o valor não-vazio de `next_ap` é preservado e o botão de navegação é renderizado

### Requirement: Linhas de fusão bicolores sem artefato visual em nós do mesmo lado
Quando uma fusão conecta fibras de cores distintas entre dois nós posicionados no mesmo lado (esquerda ou direita), o ponto de divisão dos dois segmentos de cor SHALL estar sobre a rota real traçada (no vértice de dobramento da linha), e não no centróide aritmético entre os pontos de âncora. O resultado visível SHALL ser uma linha contínua sem quebra ou ponto intermediário.

#### Scenario: Fusão bicolor entre nós do mesmo lado sem quebra de linha
- **WHEN** dois nós do lado esquerdo estão conectados por uma fusão com fibras de cores diferentes
- **THEN** a linha é exibida como dois segmentos contínuos que se encontram no vértice de dobramento, sem diagonal ou ponto intermediário visível
