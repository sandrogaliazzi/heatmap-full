## 1. Backend OLT Resilience

- [x] 1.1 Adicionar helpers de resposta segura, payload padronizado e timeout operacional em `backend/src/controllers/oltController.js`
- [x] 1.2 Aplicar o padrão aos endpoints críticos consumidos pelo frontend (`listar-olt`, `listar-onu`, `listar-perfis-gpon-parks`, `listar-vlan-translation`, `verificar-onu-completo`, `liberar-onu`, `liberar-onu-avulsa`, `atualizar-alias-onu`, `deletar-onu`, `editar-status-olt`, `update-olt`)
- [x] 1.3 Validar entradas mínimas e evitar exceções não tratadas ou respostas duplicadas nesses fluxos

## 2. Frontend Error UX

- [x] 2.1 Criar helper de extração de mensagens de erro no cliente HTTP/Axios com fallback para timeout e falha de rede
- [x] 2.2 Atualizar componentes de OLT/ONU para mostrar notificações úteis em vez de apenas `console.log`
- [x] 2.3 Garantir limpeza de estados de loading/pending em todos os caminhos de falha dos fluxos críticos

## 3. Verification

- [x] 3.1 Verificar manualmente os fluxos de listagem e sincronização de OLT
- [x] 3.2 Verificar manualmente consulta de perfis/traduções/ONUs e operações de provisionamento/edição/remoção
- [x] 3.3 Confirmar que a change `openspec/changes/improve-olt-error-handling/` está pronta para implementação/aplicação
