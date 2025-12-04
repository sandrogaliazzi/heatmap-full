<script setup>
import { ref, onMounted, inject, computed } from "vue";
import fetchApi from "@/api";

import PonSignal from "./PonSingal";
import TableSignalsData from "./TableSignalsData.vue";
import ClientTableData from "./ClientTableData.vue";
import RamalForm from "./RamalForm.vue";

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

const closeDialog = inject("closeDialog");

const filterRamal = computed(() => {
  const q = query.value.toLowerCase();

  return ramals.value.filter(
    (ramal) =>
      ramal.oltRamal.toLowerCase().includes(q) ||
      ramal.oltName.toLowerCase().includes(q)
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
    // ramals.value.push({
    //   oltRamal: "PON TESTE",
    //   oltIp: "162.168.200.2",
    //   oltPon: "1/1",
    //   ponVlan: "1010",
    //   oltName: "FIBERHOME",
    // });
    isLoadingRamals.value = false;
  } catch (error) {
    // handle this shit later
  }
};

function calculateAverages(data) {
  if (data.length === 0) {
    return { avgTx: null, avgRx: null };
  }

  let totalTx = 0;
  let totalRx = 0;

  for (const item of data) {
    if (Number.isNaN(item.tx) || Number.isNaN(item.rx)) continue;
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

const getOnuSignalsFromFiberHome = async (slot, pon) => {
  try {
    const onus = await fetchApi.get("listar-onu-fiberhome");

    const filterBySlotAndPon = onus.data.onus.filter(
      (onu) => onu.slot === slot && onu.pon === pon
    );

    if (filterBySlotAndPon.length === 0) {
      return { data: [] };
    }
    const signals = await fetchApi.post(
      "verificar-onu-fiberhome",
      filterBySlotAndPon
    );

    return signals.data.map((onu) => ({
      alias: onu.name,
      rx: parseFloat(onu["RSSI"].split("dBm")[0]),
      tx: parseFloat(onu["Power Level"].split("dBm")[0]),
      status: "ACTIVE",
    }));
  } catch (error) {
    console.log(error);
  }
};

const selectRamal = async (ramal) => {
  cardId.value = ramal._id;
  loading.value = true;
  gponData.value = [];

  const { oltIp, oltPon } = ramal;

  let ponSignalsData = [];

  if (ramal.oltName.includes("FIBERHOME")) {
    const [slot, pon] = oltPon.split("/");
    ponSignalsData.data = await getOnuSignalsFromFiberHome(slot, pon);
  } else {
    ponSignalsData = await fetchApi.post("verificar-pon", {
      oltIp,
      oltPon,
    });
  }

  ponSignals.value = ponSignalsData.data;
  average.value = calculateAverages(ponSignalsData.data);

  loading.value = false;
};

onMounted(async () => {
  await getRamals();
});
</script>

<template>
  <v-card>
    <slot name="header">
      <v-card-title class="bg-orange">
        <div class="d-flex justify-space-between align-center">
          <div class="d-flex">
            <p class="me-2">SINAIS OLT</p>
            <v-icon>mdi-circle-box</v-icon>
          </div>
          <div>
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
                    class="ml-2"
                    color="success"
                    variant="tonal"
                  >
                    Exibir lista
                    <v-dialog activator="parent" width="auto">
                      <PonSignal :onuList="ponSignals" :ramal="ramal" />
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
