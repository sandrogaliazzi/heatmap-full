<script setup>
import { ref, onMounted, inject, computed } from "vue";
import fetchApi from "@/api";

import PonSignal from "./PonSingal";
import TableSignalsData from "./TableSignalsData.vue";
import ClientTableData from "./ClientTableData.vue";
import RamalForm from "./RamalForm.vue";
import { useNotificationStore } from "@/stores/notification";

const isLoadingRamals = ref(true);
const ramals = ref([]);
const query = ref("");
const ponSignals = ref([]);
const average = ref(null);
const gponData = ref([]);
const cardId = ref("");
const loading = ref(false);
const showReport = ref(false);
const showClientReport = ref(false);
const notificationStore = useNotificationStore();
const rawSignals = ref([]);

const closeDialog = inject("closeDialog");

const filterRamal = computed(() => {
  const q = query.value.toLowerCase();

  return ramals.value.filter(
    (ramal) =>
      ramal.oltRamal.toLowerCase().includes(q) ||
      ramal.oltName.toLowerCase().includes(q),
  );
});

const oltNames = computed(() => {
  return ramals.value
    .map((ramal) => ramal.oltName)
    .reduce((acc, val) => {
      if (!acc.includes(val)) acc.push(val);

      return acc;
    }, []);
});

const getRamals = async () => {
  try {
    const oltRamals = await fetchApi("ramais");
    ramals.value = oltRamals.data;
    isLoadingRamals.value = false;
  } catch (error) {
    notificationStore.setNotification({
      status: "error",
      msg: "Erro ao buscar ramais " + error.message,
    });
  } finally {
    isLoadingRamals.value = false;
  }
};

function calculateAverages(data) {
  if (data.length === 0) {
    return { avgTx: null, avgRx: null };
  }

  let totalTx = 0;
  let totalRx = 0;

  for (const item of data) {
    if (isNaN(item.tx) || isNaN(item.rx)) continue;
    totalTx += item.tx;
    totalRx += item.rx;
  }

  const avgTx = totalTx / data.length;
  const avgRx = totalRx / data.length;

  return {
    tx: parseFloat(avgTx.toFixed(2)),
    rx: parseFloat(avgRx.toFixed(2)),
  };
}

const getOnuSignalsFromFiberHome = async (oltIp, slot, pon) => {
  try {
    const response = await fetchApi.post("listar-onu-fiberhome-por-pon", {
      oltIp,
      slot,
      pon,
    });

    const onus = response.data.onus;

    if (onus.length === 0) {
      return { data: [] };
    }
    const signals = await fetchApi.post("verificar-onu-fiberhome", {
      onus: onus,
    });

    rawSignals.value = signals.data;

    return signals.data.map((onu) => ({
      alias: onu.name,
      rx: parseFloat(onu["RSSI"].split("dBm")[0]),
      tx: parseFloat(onu["Power Level"].split("dBm")[0]),
      status:
        parseFloat(onu["RSSI"].split("dBm")[0]) !== 0
          ? "ACTIVE (PROVISIONED)"
          : "INACTIVE",
    }));
  } catch (error) {
    console.log(error);
  }
};

const selectRamal = async (ramal) => {
  try {
    cardId.value = ramal._id;
    loading.value = true;
    gponData.value = [];

    const { oltIp, oltPon } = ramal;

    let ponSignalsData = [];

    if (ramal.oltName.includes("FIBERHOME")) {
      const [slot, pon] = oltPon.split("/");
      ponSignalsData.data = await getOnuSignalsFromFiberHome(oltIp, slot, pon);
    } else {
      ponSignalsData = await fetchApi.post("verificar-pon", {
        oltIp,
        oltPon,
      });
      rawSignals.value = ponSignalsData.data;
    }

    ponSignals.value = ponSignalsData.data;
    average.value = calculateAverages(
      ponSignalsData.data.filter(
        (onu) => onu.status === "ACTIVE (PROVISIONED)",
      ),
    );

    loading.value = false;
  } catch (error) {
    notificationStore.setNotification({
      status: "error",
      msg: "Erro ao buscar sinais do ramal " + error.message,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await getRamals();
});
</script>

<template>
  <v-card>
    <slot name="header">
      <v-card-title class="bg-orange">
        <div
          class="d-flex flex-column flex-md-row justify-space-between align-center"
        >
          <div class="d-flex">
            <p class="me-2">SINAIS OLT</p>
            <v-icon>mdi-circle-box</v-icon>
          </div>
          <div class="d-flex flex-column flex-md-row align-center">
            <v-btn prepend-icon="mdi-plus-circle" variant="text"
              >Add ramal
              <RamalForm @ramal-saved="getRamals" />
            </v-btn>
            <v-btn variant="text" prepend-icon="mdi-chart-box">
              RELATORIO DE SINAIS
              <v-menu activator="parent">
                <v-list density="compact">
                  <v-list-item
                    title="Por ramal"
                    @click="showReport = true"
                  ></v-list-item>
                  <v-list-item
                    title="Por cliente"
                    @click="showClientReport = true"
                  ></v-list-item>
                </v-list>
              </v-menu>
            </v-btn>
            <v-btn variant="text" icon="mdi-close" @click="closeDialog"></v-btn>
          </div>
        </div>
      </v-card-title>
    </slot>
    <v-card-text>
      <v-container>
        <v-row no-gutters>
          <v-col cols="12">
            <v-text-field
              variant="outlined"
              label="Pesquisar ramal"
              prepend-inner-icon="mdi-magnify"
              single-line
              v-model="query"
              hide-details
              class="mb-3"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-select
              variant="outlined"
              label="Filtrar por OLT"
              prepend-inner-icon="mdi-router-wireless"
              v-model="query"
              class="my-3"
              :items="oltNames"
            ></v-select>
          </v-col>
        </v-row>
        <v-row no-gutters v-if="!isLoadingRamals">
          <v-col v-for="ramal in filterRamal || ramals" :key="ramal._id">
            <div>
              <v-card
                :title="ramal.oltName.split('-').join(' ')"
                :subtitle="ramal.oltRamal"
                variant="elevated"
                elevation="2"
                class="mb-3"
                max-width="500px"
                min-width="300px"
                :loading="loading && cardId === ramal._id"
                link
              >
                <template #append>
                  <v-btn
                    icon="mdi-chevron-up"
                    variant="plain"
                    @click="cardId = null"
                    v-if="cardId === ramal._id"
                  ></v-btn>
                </template>
                <v-card-text v-if="ponSignals && cardId == ramal._id">
                  <p>
                    <v-icon icon="mdi-chevron-double-up"></v-icon>
                    TX Média: {{ average?.tx }}dbm
                  </p>
                  <p>
                    <v-icon icon="mdi-chevron-double-down"></v-icon>
                    RX Média: {{ average?.rx }}dbm
                  </p>
                  <p class="mt-2">
                    <v-icon icon="mdi-circle-box"></v-icon>
                    ONUS Total: {{ ponSignals.length }}
                  </p>
                </v-card-text>
                <v-card-text v-else-if="cardId == ramal._id">
                  <p>Não há clientes cadastrados neste ramal</p>
                </v-card-text>
                <v-card-text class="d-flex flex-column flex-md-row ga-2">
                  <v-btn
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-wifi"
                    @click="selectRamal(ramal)"
                    >Ver Sinais
                  </v-btn>
                  <v-btn color="grey" variant="text" prepend-icon="mdi-pen"
                    >Editar
                    <RamalForm :ramal="ramal" @ramal-saved="getRamals" />
                  </v-btn>
                  <v-btn
                    v-if="ponSignals && cardId == ramal._id"
                    color="success"
                    variant="tonal"
                  >
                    Exibir lista
                    <v-dialog activator="parent" width="auto">
                      <PonSignal
                        v-model="ponSignals"
                        :ramal="ramal"
                        :raw-signals="rawSignals"
                        :loading="loading"
                        @refresh-data="selectRamal(ramal)"
                      />
                    </v-dialog>
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col>
            <div>
              <div class="d-flex justify-center align-center">
                <v-progress-circular
                  color="orange"
                  indeterminate
                  :size="105"
                  :width="9"
                ></v-progress-circular>
              </div>
              <p class="subtitle text-center text-warning mt-4">
                Carregando lista dos ramais
              </p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
  <v-dialog v-model="showReport" fullscreen>
    <TableSignalsData @close-dialog="showReport = false" :ramals="ramals" />
  </v-dialog>
  <v-dialog v-model="showClientReport" fullscreen>
    <ClientTableData
      @close-dialog="showClientReport = false"
      :ramals="ramals"
    />
  </v-dialog>
</template>
