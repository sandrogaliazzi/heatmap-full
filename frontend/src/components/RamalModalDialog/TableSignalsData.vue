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
const showChart = ref(false);

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
  isLoadingData.value = true;
  try {
    const response = await fetchApi.get("/get-ramal-logs/" + date.value);

    const logs = response.data.ramalHistory || [];

    data.value = logs.map((item) => {
      const ramal = ramals.find((r) => r._id === item.id);

      classifySignal(item.avgSignal.rx, clientsRxCounter);
      classifySignal(item.avgSignal.tx, clientsTxCounter);

      return {
        oltRamal: ramal.oltRamal,
        rx: item.avgSignal.rx,
        tx: item.avgSignal.tx,
        oltName: ramal.oltName,
        clients: item.gpon_data.sort((a, b) => a.rx - b.rx),
      };
    });

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
  {
    align: "start",
    key: "oltRamal",
    sortable: false,
    title: "Ramal",
  },
  { key: "rx", title: "Rx média" },
  { key: "tx", title: "Tx média" },
  { key: "oltName", title: "OLT" },
  { key: "data-table-expand", align: "end" },
];

function getSignalColor(signal) {
  if (signal >= -20) return "green";
  if (signal >= -29 && signal < -20) return "warning";
  if (signal < -29) return "red";
}

const copyName = (name) => {
  const formatedName = name.split("-").slice(1).join(" ").trim();
  navigator.clipboard.writeText(formatedName);
};

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
      <template v-if="isLoadingData">
        <div
          style="height: 600px"
          class="d-flex flex-column justify-center align-center ga-2"
        >
          <v-progress-circular
            color="orange"
            indeterminate
            size="128"
          ></v-progress-circular>
          <p class="mt-3">Carregando dados...</p>
        </div>
      </template>
      <template v-if="notFound && !isLoadingData">
        <div
          style="height: 600px"
          class="d-flex flex-column justify-center align-center ga-2"
        >
          <v-icon size="150">mdi-database-off</v-icon>
          <h2>Não foram encontrados dados para essa data</h2>
        </div>
      </template>
      <template v-if="!notFound && !isLoadingData">
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
          label="Pesquisar ramal"
          class="mb-3 mt-5"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          hide-details
          single-line
        ></v-text-field>

        <v-data-table
          :headers="headers"
          :items="data"
          item-value="oltRamal"
          :search="search"
        >
          <template v-slot:item.rx="{ item }">
            <v-chip :color="getSignalColor(item.rx)">{{ item.rx }}</v-chip>
          </template>
          <template v-slot:item.tx="{ item }">
            <v-chip :color="getSignalColor(item.tx)">{{ item.tx }}</v-chip>
          </template>
          <template
            v-slot:item.data-table-expand="{
              internalItem,
              isExpanded,
              toggleExpand,
            }"
          >
            <v-btn
              :append-icon="
                isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'
              "
              text="Mostrar Clientes"
              class="text-none"
              color="medium-emphasis"
              size="small"
              variant="text"
              border
              slim
              @click="toggleExpand(internalItem)"
            ></v-btn>
          </template>
          <template v-slot:expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="py-2">
                <v-sheet rounded="lg" border>
                  <v-table density="compact">
                    <tbody class="bg-surface-light">
                      <tr>
                        <th>alias</th>
                        <th>tx</th>
                        <th>rx</th>
                      </tr>
                    </tbody>

                    <tbody>
                      <tr v-for="client in item.clients" :key="client.alias">
                        <td class="py-2">
                          <div class="d-flex align-center ga-5">
                            <span>{{ client.alias }}</span>
                            <v-btn
                              size="x-small"
                              rounded="xl"
                              variant="outlined"
                              prepend-icon="mdi-pen"
                              text="copiar nome"
                              @click="copyName(client.alias)"
                            ></v-btn>
                          </div>
                        </td>
                        <td class="py-2">{{ client.tx }}</td>
                        <td class="py-2">{{ client.rx }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-sheet>
              </td>
            </tr>
          </template>
        </v-data-table>
      </template>
    </v-card-text>
  </v-card>
</template>
