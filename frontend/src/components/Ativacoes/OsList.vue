<script setup>
import { inject, ref, computed } from "vue";
import DataDisplay from "./DataDisplay.vue";
import TomodatList from "./TomodatList.vue";
import fetchApi from "@/api";
import { getOsByType, extractCto } from "../CtoModalDialog/hubApi";

const dateRange = ref([]);
const osList = ref([]);
const isLoading = ref(false);
const tab = ref(0);

const formattedDateRange = computed(() => {
  const startDate = new Date(dateRange.value[0]).toISOString().split("T")[0];
  const endDate =
    dateRange.value.length > 1
      ? new Date(dateRange.value[dateRange.value.length - 1])
          .toISOString()
          .split("T")[0]
      : startDate;

  return { startDate, endDate };
});

const formattedOsList = (list) => {
  return list.map((os) => {
    return {
      id: os.id_ordem_servico,
      client: os.dados_cliente.nome_razaosocial,
      bairro: os.dados_endereco_instalacao.bairro,
      cto: extractCto(os.descricao_fechamento),
      tecnico: os.usuario_fechamento.name,
      coordenadas: os.dados_endereco_instalacao.coordenadas,
      endereco: os.endereco_instalacao,
      descricao: {
        abertura: os.descricao_abertura,
        fechamento: os.descricao_fechamento,
      },
    };
  });
};
const getOsList = async () => {
  isLoading.value = true;

  try {
    const [ativacoes, transferencias] = await Promise.all([
      getOsByType(
        "23",
        formattedDateRange.value.startDate,
        formattedDateRange.value.endDate,
        "finalizado"
      ),
      getOsByType(
        "24",
        formattedDateRange.value.startDate,
        formattedDateRange.value.endDate,
        "finalizado"
      ),
    ]);

    osList.value = formattedOsList([...ativacoes, ...transferencias]);

    isLoading.value = false;
  } catch (error) {
    console.error("Erro ao obter lista de OS:", error);
    isLoading.value = false;
  }
};

const findCoordinates = async (address) => {
  try {
    const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    return data;
  } catch (error) {
    console.log(error);
  }
};

const findTomodatCtoId = async (data, retries = 0) => {
  const MAX_RETRIES = 3;

  const {
    cto: targetCtoName,
    coordenadas: { latitude, longitude },
    endereco,
  } = data;

  try {
    const { data: ctosNearby } = await fetchApi.get(
      `/aprange/${latitude}/${longitude}/2000`
    );

    if (!ctosNearby) {
      return {
        name: targetCtoName,
        id: null,
        client: data.client,
        coordenadas: data.coordenadas,
      };
    }
    const foundCto = ctosNearby.find((cto) => cto.name === targetCtoName);

    if (foundCto) {
      return {
        ...foundCto,
        latitude,
        longitude,
        client: data.client,
        user: data.tecnico,
      };
    }

    if (retries >= MAX_RETRIES) {
      console.warn(
        `CTO "${targetCtoName}" não encontrado após ${MAX_RETRIES} tentativas.`
      );
      return {
        name: targetCtoName,
        id: null,
        client: data.client,
        coordenadas: data.coordenadas,
      };
    }

    const coordResponse = await findCoordinates(endereco);
    const result = coordResponse?.results?.[0];

    if (!result) {
      throw new Error(
        "Não foi possível obter novas coordenadas para o endereço."
      );
    }

    const newLatitude = result.geometry.location.lat;
    const newLongitude = result.geometry.location.lng;

    const updatedData = {
      ...data,
      coordenadas: {
        latitude: newLatitude,
        longitude: newLongitude,
      },
    };

    return findTomodatCtoId(updatedData, retries + 1);
  } catch (error) {
    console.error("Erro ao encontrar CTO:", error.message || error);
    return null;
  }
};

const tomodatList = ref([]);

const loadingTomodat = ref(false);

const findTomodatCtoList = async (data) => {
  loadingTomodat.value = true;
  try {
    tomodatList.value = await Promise.all(data.map((d) => findTomodatCtoId(d)));
    tab.value = 1;
  } catch (error) {
    loadingTomodat.value = false;
    console.log("erro ao buscar ctos", error);
  }

  loadingTomodat.value = false;
};

const closeDialog = inject("closeDialog");
</script>
<template>
  <v-card :loading="loadingTomodat">
    <v-toolbar color="orange">
      <v-btn icon="mdi-close" @click="closeDialog"></v-btn>

      <v-toolbar-title>Ordens de Ativação</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-toolbar-items>
        <v-btn icon="mdi-chevron-left" @click="tab = 0"></v-btn>
        <v-btn icon="mdi-chevron-right" @click="tab = 1"></v-btn>
      </v-toolbar-items>
    </v-toolbar>

    <v-card theme="dark" variant="flat" class="overflow-y-auto">
      <v-window v-model="tab">
        <v-window-item :key="0">
          <v-card-text class="mt-4 mx-3">
            <v-date-input
              v-model="dateRange"
              label="Selecionar Período"
              multiple="range"
              clearable
              @click:clear="dateRange = []"
            ></v-date-input>
            <v-btn
              block
              color="success"
              v-if="dateRange.length > 0"
              @click="getOsList"
              :disabled="isLoading"
              class="mb-3"
              >Buscar</v-btn
            >
            <template v-if="!osList.length">
              <v-sheet
                :height="400"
                class="d-flex flex-column justify-center align-center"
              >
                <v-icon size="200px" v-if="!isLoading">mdi-flag</v-icon>
                <v-progress-circular
                  v-else
                  color="orange"
                  indeterminate
                  :size="128"
                  :width="6"
                ></v-progress-circular>
              </v-sheet>
            </template>

            <DataDisplay
              v-model="osList"
              :loading="loadingTomodat"
              @save-tomodat="(data) => findTomodatCtoList(data)"
              v-else
            />
          </v-card-text>
        </v-window-item>
        <v-window-item :key="1">
          <tomodat-list v-model="tomodatList" v-if="tomodatList.length" />
          <v-sheet
            v-else
            :height="400"
            class="d-flex flex-column justify-center align-center"
          >
            <v-icon size="200px">mdi-cube</v-icon>
            <p class="text-button">Nenhuma cto encontrada</p>
          </v-sheet>
        </v-window-item>
      </v-window>
    </v-card>

    <v-divider></v-divider>
  </v-card>
</template>
