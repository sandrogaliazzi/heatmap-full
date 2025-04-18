# 🔥 Heatmap da Rede - Conectnet Telecom

Aplicação desenvolvida para mapear a infraestrutura de rede do provedor Conectnet Telecom, oferecendo aos técnicos uma visão clara e interativa da topologia da rede. Além de localizar caixas de atendimento, emendas e cabos, também permite consultar os clientes conectados, bem como os sinais RX/TX de suas ONUs, integrando diretamente com as OLTs GPON.

<p align="center">
  <img src="assets/heatmap.gif" width="1000" alt="Demonstração do Heatmap" />
</p>

## 🚀 Funcionalidades

- Visualização de caixas de atendimento, emendas e cabos no mapa
- Consulta de clientes conectados por caixa
- Integração com OLTs GPON para leitura de sinal RX/TX das ONUs
- Busca e detalhamento de clientes por nome ou localização
- Interface intuitiva para uso em campo pelos técnicos
- Backend e frontend em containers distintos, gerenciados por Docker
- Proxy reverso com Nginx para distribuição do tráfego

## 🛠️ Tecnologias Utilizadas

- **Frontend:** Vue.js
- **Backend:** Node.js + Express
- **Banco de Dados:** MongoDB
- **Outros:** Knex.js, Docker, REST API, Nginx

## 📦 Estrutura do Projeto

```plaintext
/heatmap-full
├── backend/
│   └── (código Node + Express)
├── frontend/
│   └── (aplicação Vue.js)
├── docker-compose.yml
└── nginx.conf
```

## 🖥️ Implantação

A aplicação é utilizada internamente na **Conectnet Telecom**, rodando em ambiente Linux com containers isolados para backend e frontend, e utilizando Nginx como proxy reverso.
