<script setup>
import { ref, onMounted, computed, watch } from "vue";
import fetchApi from "@/api";
import PieSignalChart from "./PieSignalChart.vue";

const emit = defineEmits(["closeDialog"]);

const { ramals } = defineProps(["ramals"]);

const data = ref([]);
const date = ref(
  new Date().toLocaleDateString("pt-BR").split("/").reverse().join("-"),
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
const showChart = ref(false);
const originalData = ref([]);
const selectedOlts = ref([]);

const oltNames = computed(() => {
  return ramals
    .map((ramal) => ramal.oltName)
    .reduce((acc, val) => {
      if (!acc.includes(val)) acc.push(val);

      return acc;
    }, []);
});

watch(selectedOlts, (oltList) => {
  if (!oltList.length) data.value = originalData.value;

  data.value = originalData.value.filter((item) =>
    oltList.includes(item.oltName),
  );
  chartKey.value++;
});

const classifySignal = (signal, ref) => {
  if (typeof signal === "string") {
    signal = parseFloat(signal.split("dBm")[0].trim());
  }
  if (signal >= -25) ref.value.goodSignal += 1;
  if (signal < -25 && signal >= -27) ref.value.avgSignal += 1;
  if (signal < -27) ref.value.badSignal += 1;
};

const loadData = async () => {
  try {
    isLoadingData.value = true;
    const response = await fetchApi.get("/get-ramal-logs/" + date.value);

    const logs = response.data.ramalHistory || [];

    data.value = logs.flatMap((item) =>
      item.gpon_data.map((client) => {
        classifySignal(client.rx || client["Power Level"], clientsRxCounter);
        classifySignal(client.tx || client["RSSI"], clientsTxCounter);

        return {
          id: Math.random().toString(36).substring(2, 10),
          oltRamal: ramals.find((r) => r._id === item.id)?.oltRamal,
          rx: client.rx || parseFloat(client["Power Level"].split("dBm")[0]),
          tx: client.tx || parseFloat(client["RSSI"].split("dBm")[0]),
          oltName: ramals.find((r) => r._id === item.id)?.oltName,
          alias: client.alias || client.name,
        };
      }),
    );

    originalData.value = data.value;

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
  if (typeof signal === "string") {
    signal = parseFloat(signal.split("dBm")[0].trim());
  }
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
        <div class="d-flex ga-2">
          <p>Relatorio de Sinais</p>
          <v-icon>mdi-chart-box</v-icon>
          <v-progress-circular
            indeterminate
            v-if="isLoadingData"
          ></v-progress-circular>
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
      <div
        class="text-center d-flex justify-center flex-column align-center"
        style="width: 100%"
      >
        <v-text-field
          type="date"
          class="d-inline-block"
          label="selecionar data"
          variant="underlined"
          v-model="date"
          @update:modelValue="loadData"
        ></v-text-field>
        <v-btn
          variant="outlined"
          @click="showChart = !showChart"
          :append-icon="showChart ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          class="mb-5"
          >ver graficos</v-btn
        >
      </div>
      <template v-if="notFound && !isLoadingData">
        <div
          style="height: 600px"
          class="d-flex flex-column justify-center align-center ga-2"
        >
          <v-icon size="150">mdi-database-off</v-icon>
          <h2>Não foram encontrados dados para essa data</h2>
        </div>
      </template>
      <template v-else>
        <v-card title="Gráfico RX" v-if="!isLoadingData && showChart">
          <v-card-text>
            <pie-signal-chart
              v-model="clientsRxCounter"
              :key="chartKey"
            ></pie-signal-chart>
          </v-card-text>
        </v-card>

        <v-card title="Gráfico TX" v-if="!isLoadingData && showChart">
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

        <v-select
          :items="oltNames"
          variant="outlined"
          label="filtrar por olt"
          prepend-inner-icon="mdi-router-wireless"
          multiple
          chips
          v-model="selectedOlts"
        >
        </v-select>

        <v-data-table
          :headers="headers"
          :items="data"
          item-value="id"
          :search="search"
          :key="chartKey"
        >
          <template v-slot:item.alias="{ item }"
            ><b>{{ item.alias || item.name }}</b></template
          >
          <template v-slot:item.rx="{ item }">
            <v-chip :color="getSignalColor(item.rx || item['Power Level'])">{{
              item.rx || item["Power Level"]
            }}</v-chip>
          </template>
          <template v-slot:item.tx="{ item }">
            <v-chip :color="getSignalColor(item.tx || item['RSSI'])">{{
              item.tx || item["RSSI"]
            }}</v-chip>
          </template>
        </v-data-table>
      </template>
    </v-card-text>
  </v-card>
</template>
