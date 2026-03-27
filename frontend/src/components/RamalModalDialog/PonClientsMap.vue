<script setup>
import { ref, onMounted } from "vue";
import fetchApi from "@/api";
import hubSoftApi from "@/api/hubsoftApi";
import clientUpIcon from "@/assets/cliente-online.png";
import clientDownIcon from "@/assets/cliente-offline.png";

const { ramal } = defineProps(["ramal"]);
const emit = defineEmits(["closeDialog"]);

const clientList = ref([]);
const loading = ref(false);
const showSessionText = ref(false);
const sessionText = ref("");
const isActive = defineModel();

const getOnuAliasAndMacList = async () => {
  try {
    if (ramal.oltName.includes("FIBERHOME")) {
      const [slot, pon] = ramal.oltPon.split("/");
      const response = await fetchApi.post("listar-onu-fiberhome-por-pon", {
        oltIp: ramal.oltIp,
        slot: slot,
        pon: pon,
      });

      if (!response.data.onus.length) {
        return [];
      }

      return response.data.onus.map((onu) => ({
        alias: onu.name,
        mac: onu.mac,
      }));
    }

    const response = await fetchApi.post("verificar-onu-mac", {
      oltIp: ramal.oltIp,
      oltPon: ramal.oltPon,
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Erro ao buscar ONU alias e MAC list:", response);
      return [];
    }
  } catch (error) {
    console.error("Erro ao buscar ONU alias e MAC list:", error);
    return [];
  }
};

const findClientOnHubsoftByMac = async (mac) => {
  try {
    const response = await hubSoftApi.get(
      `/api/v1/integracao/cliente?inativo=nao&ultima_conexao=sim&busca=mac&termo_busca=${mac}&relacoes=endereco_instalacao`,
    );

    if (
      response.data.status === "success" &&
      response.data.clientes.length > 0
    ) {
      return response.data.clientes[0];
    }
  } catch (error) {
    console.error("erro ao buscar cliente no hubsoft " + error.message);
  }
};

const getClientLocationAndStatusList = async () => {
  loading.value = true;
  try {
    const onuList = await getOnuAliasAndMacList();

    const clientDataList = await Promise.all(
      onuList.map(async (onu) => {
        const clientData = await findClientOnHubsoftByMac(onu.mac);
        return {
          alias: onu.alias,
          mac: onu.mac,
          coordenadas: clientData
            ? clientData.servicos[0].endereco_instalacao.coordenadas
            : null,
          conectado: clientData
            ? clientData.servicos[0].ultima_conexao.conectado
            : null,
          sessao: clientData ? clientData.servicos[0].ultima_conexao : null,
        };
      }),
    );
    loading.value = false;
    return clientDataList.filter(
      (client) => client.coordenadas?.latitude && client.coordenadas?.longitude,
    );
  } catch (error) {
    loading.value = false;
    console.error("Erro ao buscar dados dos clientes:", error);
    return [];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  clientList.value = await getClientLocationAndStatusList();
});
</script>

<template>
  <v-dialog v-model="showSessionText">
    <v-card>
      <v-card-title>Informações da sessão</v-card-title>
      <v-card-text>
        <div v-if="sessionText">
          {{ sessionText }}
        </div>
        <div v-else>Nenhuma informação de sessão disponível.</div>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="text" @click="showSessionText = false">Fechar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-card :loading="loading" width="800">
    <v-card-title>Mapa de Clientes conectados</v-card-title>
    <v-card-subtitle
      >Apenas clientes que possuem coordenadas no hubsoft serao exibidos no
      mapa. Total de clientes: {{ clientList.length }}</v-card-subtitle
    >
    <v-card-text>
      <GMapMap
        :center="{
          lat: -29.5841522,
          lng: -50.887663417,
        }"
        :zoom="10"
        style="width: 100%; height: 500px"
      >
        <GMapMarker
          v-for="client in clientList"
          :key="client.mac"
          :position="{
            lat: Number.parseFloat(client.coordenadas.latitude),
            lng: Number.parseFloat(client.coordenadas.longitude),
          }"
          :icon="client.conectado ? clientUpIcon : clientDownIcon"
          :title="client.alias"
          @click="
            showSessionText = true;
            sessionText = client.sessao;
          "
        />
      </GMapMap>
    </v-card-text>
    <v-card-actions>
      <v-btn prepend-icon="mdi-refresh" @click="getClientLocationAndStatusList"
        >Recarregar</v-btn
      >
      <v-btn prepend-icon="mdi-close" @click="emit('closeDialog')"
        >Fechar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
