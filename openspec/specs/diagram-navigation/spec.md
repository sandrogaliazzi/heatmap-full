## Requirements

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

---

### Requirement: Carregamento do diagrama do próximo AP
Ao clicar no botão de navegação, o sistema SHALL buscar as conexões do AP indicado em `next_ap.id` via API e substituir o diagrama atual pelo diagrama do AP carregado. Um indicador de carregamento (spinner) SHALL ser exibido enquanto a requisição estiver em andamento.

#### Scenario: Navegação bem-sucedida para o próximo AP
- **WHEN** o usuário clica no botão de navegação de um nó de cabo
- **THEN** o sistema exibe um spinner, faz GET das conexões do AP destino e substitui o SVG pelo novo diagrama

#### Scenario: Falha no carregamento do próximo AP
- **WHEN** a requisição para buscar as conexões do próximo AP retorna erro HTTP
- **THEN** o spinner é ocultado, o diagrama atual permanece visível e uma mensagem de erro é exibida ao usuário

---

### Requirement: Histórico de navegação com breadcrumbs
O componente SHALL manter um histórico (pilha) dos APs visitados na sessão de navegação atual. Um componente Vuetify `v-breadcrumbs` SHALL ser exibido acima do SVG, listando o nome de cada AP visitado em ordem cronológica. Clicar em um item anterior do breadcrumb SHALL retornar o diagrama ao estado daquele AP (usando os dados já carregados, sem novo fetch).

#### Scenario: Breadcrumb atualizado após navegação
- **WHEN** o usuário navega do AP A para o AP B
- **THEN** o breadcrumb exibe "AP A > AP B", com "AP A" como link clicável

#### Scenario: Retorno via breadcrumb
- **WHEN** o usuário clica em um item anterior no breadcrumb
- **THEN** o diagrama volta a exibir o diagrama daquele AP sem fazer nova requisição HTTP

#### Scenario: Breadcrumb com item único (estado inicial)
- **WHEN** nenhuma navegação foi feita (primeiro AP carregado)
- **THEN** o breadcrumb exibe apenas o nome do AP atual, sem links clicáveis anteriores

---

### Requirement: Espaçamento aumentado entre clientes e nós laterais
Elementos do tipo `client` (posicionados na camada `bottom`) SHALL estar separados dos nós de cabo e splitter por uma margem vertical mínima de `120px` acima do `maxY` dos nós laterais. O valor de `BOTTOM_BASE_Y` SHALL ser calculado dinamicamente com base na altura total dos nós laterais mais altos, não hardcoded.

#### Scenario: Clientes não se sobrepõem a nós laterais
- **WHEN** o diagrama possui splitters com 8 ou mais portas
- **THEN** os elementos cliente na camada bottom aparecem abaixo de todos os nós laterais com margem visível

---

### Requirement: Linhas de fusão bicolores sem artefato visual em nós do mesmo lado
Quando uma fusão conecta fibras de cores distintas entre dois nós posicionados no mesmo lado (esquerda ou direita), o ponto de divisão dos dois segmentos de cor SHALL estar sobre a rota real traçada (no vértice de dobramento da linha), e não no centróide aritmético entre os pontos de âncora. O resultado visível SHALL ser uma linha contínua sem quebra ou ponto intermediário.

#### Scenario: Fusão bicolor entre nós do mesmo lado sem quebra de linha
- **WHEN** dois nós do lado esquerdo estão conectados por uma fusão com fibras de cores diferentes
- **THEN** a linha é exibida como dois segmentos contínuos que se encontram no vértice de dobramento, sem diagonal ou ponto intermediário visível

---

### Requirement: Linhas de fusão bicolores
Quando uma fusão conecta uma fibra de cor X a uma fibra de cor Y (sendo X ≠ Y), o traço da ligação SHALL ser dividido em dois segmentos iguais: o primeiro segmento na cor de X (fibra de origem) e o segundo na cor de Y (fibra de destino). Quando X = Y, o traço permanece monocrômico como atualmente.

#### Scenario: Fusão com fibras de cores diferentes renderiza traço bicolor
- **WHEN** `fusion.fiber_in` tem cor verde e `fusion.fiber_out` tem cor amarela
- **THEN** a linha é dividida no ponto médio: primeira metade verde, segunda metade amarela

#### Scenario: Fusão com fibras de mesma cor renderiza traço monocrômico
- **WHEN** `fusion.fiber_in` e `fusion.fiber_out` têm o mesmo índice de cor
- **THEN** a linha é desenhada com uma única cor, como no comportamento atual

---

### Requirement: Notas de slot sem transbordamento
O texto das notas de slot (`connection_slot_notes`) SHALL ser contido dentro dos limites do nó SVG. Quando o texto exceder a largura disponível do nó, SHALL ser quebrado em múltiplas linhas (`word-break`). O conteúdo SHALL ser truncado com reticências se exceder a altura da linha da porta (`rowHeight`).

#### Scenario: Nota curta exibida normalmente
- **WHEN** o texto da nota cabe em uma linha dentro da largura do nó
- **THEN** a nota é exibida em linha única sem truncamento

#### Scenario: Nota longa quebrada dentro do container
- **WHEN** o texto da nota excede a largura disponível do nó
- **THEN** o texto quebra em múltiplas linhas e permanece dentro dos limites visuais do nó

#### Scenario: Nota muito longa truncada com reticências
- **WHEN** o texto da nota, mesmo quebrado, excede a altura da linha da porta
- **THEN** o texto é truncado com `…` na última linha visível
