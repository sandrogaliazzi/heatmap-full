<script setup>
import { ref, onMounted, inject, computed } from "vue";
import fetchApi from "@/api";

import PonSignal from "./PonSingal";

const isLoadingRamals = ref(true);
const ramals = ref([]);
const query = ref("");
const ponSignals = ref([]);
const average = ref(null);
const gponData = ref([]);
const cardId = ref("");
const loading = ref(false);

const closeDialog = inject("closeDialog");

const filterRamal = computed(() => {
  if (!query.value) return;

  return ramals.value.filter((ramal) => {
    return ramal.oltRamal
      .toLowerCase()
      .includes(query.value.toLocaleLowerCase());
  });
});

const getRamals = async () => {
  try {
    const oltRamals = await fetchApi("ramais");
    ramals.value = oltRamals.data;
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

const selectRamal = async (ramal) => {
  cardId.value = ramal._id;
  loading.value = true;
  gponData.value = [];

  const { oltIp, oltPon } = ramal;

  console.log(oltIp, oltPon);

  const ponSignalsData = await fetchApi.post("verificar-pon", {
    oltIp,
    oltPon,
  });

  ponSignals.value = ponSignalsData.data;
  console.log(ponSignalsData.data);
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
              label="Pesquisar cliente"
              append-inner-icon="mdi-magnify"
              single-line
              v-model="query"
              hide-details
              class="mb-3"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col cols="12">
            <div v-if="!isLoadingRamals">
              <v-card
                v-for="ramal in filterRamal || ramals"
                :key="ramal._id"
                :title="ramal.oltName.split('-').join(' ')"
                :subtitle="ramal.oltRamal"
                variant="elevated"
                class="mb-3"
                :loading="loading && cardId === ramal._id"
                link
              >
                <template #prepend>
                  <v-icon icon="mdi-signal" color="orange"></v-icon>
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
                <v-card-text>
                  <v-btn
                    color="primary"
                    variant="tonal"
                    @click="selectRamal(ramal)"
                    >Ver Sinais
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
            <div v-else>
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
</template>
