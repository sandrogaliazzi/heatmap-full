<script setup>
import { ref, onMounted } from "vue";
import fetchApi from "@/api";
import PieSignalChart from "./PieSignalChart.vue";

const emit = defineEmits(["closeDialog"]);

const { ramals } = defineProps(["ramals"]);

const data = ref([]);
const date = ref(
  new Date().toLocaleDateString("pt-BR").split("/").reverse().join("-")
);
const isLoadingData = ref(true);
const notFound = ref(false);
const clientsRxCounter = ref({
  badSignal: 0,
  goodSignal: 0,
  avgSignal: 0,
});

const clientsTxCounter = ref({
  badSignal: 0,
  goodSignal: 0,
  avgSignal: 0,
});

const chartKey = ref(0);

const classifySignal = (signal, ref) => {
  if (signal >= -25) ref.value.goodSignal += 1;
  if (signal < -25 && signal >= -27) ref.value.avgSignal += 1;
  if (signal < -27) ref.value.badSignal += 1;
};

const loadData = async () => {
  try {
    const response = await fetchApi.get("/get-ramal-logs/" + date.value);

    const logs = response.data.ramalHistory || [];

    data.value = logs.flatMap((item) =>
      item.gpon_data.map((client) => {
        classifySignal(client.rx, clientsRxCounter);
        classifySignal(client.tx, clientsTxCounter);

        return {
          id: Math.random().toString(36).substring(2, 10),
          oltRamal: ramals.find((r) => r._id === item.id)?.oltRamal,
          rx: client.rx,
          tx: client.tx,
          oltName: ramals.find((r) => r._id === item.id)?.oltName,
          alias: client.alias,
        };
      })
    );

    isLoadingData.value = false;
    notFound.value = false;
    chartKey.value++;
  } catch (error) {
    console.error(error);
    isLoadingData.value = false;
    notFound.value = true;
  } finally {
    isLoadingData.value = false;
  }
};

const search = ref("");
const headers = [
  { key: "alias", title: "ciente" },
  {
    align: "start",
    key: "oltRamal",
    sortable: false,
    title: "Ramal",
  },
  { key: "rx", title: "Rx" },
  { key: "tx", title: "Tx" },
  { key: "oltName", title: "OLT" },
];

function getSignalColor(signal) {
  if (signal >= -20) return "green";
  if (signal >= -26 && signal < -20) return "warning";
  if (signal < -27) return "red";
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <v-card flat :loading="isLoadingData">
    <v-card-title class="bg-orange">
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex">
          <p class="me-2">Relatorio de Sinais</p>
          <v-icon>mdi-chart-box</v-icon>
        </div>
        <div>
          <v-btn
            variant="text"
            icon="mdi-close"
            @click="emit('closeDialog')"
          ></v-btn>
        </div>
      </div>
    </v-card-title>
    <v-card-text>
      <div class="text-center" style="width: 100%">
        <v-text-field
          type="date"
          class="d-inline-block"
          label="selecionar data"
          variant="underlined"
          v-model="date"
          @update:modelValue="loadData"
        ></v-text-field>
      </div>
      <template v-if="notFound">
        <div
          style="height: 600px"
          class="d-flex flex-column justify-center align-center ga-2"
        >
          <v-icon size="150">mdi-database-off</v-icon>
          <h2>Não foram encontrados dados para essa data</h2>
        </div>
      </template>
      <template v-else>
        <v-card title="Gráfico RX" v-if="!isLoadingData">
          <v-card-text>
            <pie-signal-chart
              v-model="clientsRxCounter"
              :key="chartKey"
            ></pie-signal-chart>
          </v-card-text>
        </v-card>

        <v-card title="Gráfico TX" v-if="!isLoadingData">
          <v-card-text>
            <pie-signal-chart
              v-model="clientsTxCounter"
              :key="chartKey"
            ></pie-signal-chart>
          </v-card-text>
        </v-card>

        <v-text-field
          v-model="search"
          label="Pesquisar Cliente"
          class="mb-3"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          hide-details
          single-line
        ></v-text-field>

        <v-data-table
          :headers="headers"
          :items="data"
          item-value="id"
          :search="search"
        >
          <template v-slot:item.rx="{ item }">
            <v-chip :color="getSignalColor(item.rx)">{{ item.rx }}</v-chip>
          </template>
          <template v-slot:item.tx="{ item }">
            <v-chip :color="getSignalColor(item.tx)">{{ item.tx }}</v-chip>
          </template>
        </v-data-table>
      </template>
    </v-card-text>
  </v-card>
</template>
