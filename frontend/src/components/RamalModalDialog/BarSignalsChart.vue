<script setup>
import { ref, onMounted } from "vue";
import fetchApi from "@/api";
import { Bar } from "vue-chartjs";
import TableSignalsData from "./TableSignalsData.vue";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const { ramals } = defineProps(["ramals"]);

const loadingChart = ref(true);
const chartData = ref(null);
const tableData = ref(null);
const emit = defineEmits(["closeDialog"]);
const switchMode = ref("chart");
const date = ref(
  new Date().toLocaleDateString("pt-BR").split("/").reverse().join("-")
);
const notFound = ref(false);

const options = ref({
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: "Média de Sinal por Ramal",
      font: { size: 16 },
    },
    legend: {
      position: "bottom",
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.dataset.label}: ${context.parsed.y} dBm`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Potência (dBm)",
      },
    },
    x: {
      title: {
        display: true,
        text: "Ramal",
      },
    },
  },
});

const loadData = async () => {
  try {
    loadingChart.value = true;
    const response = await fetchApi.get("/get-ramal-logs/" + date.value);

    const logs = response.data.ramalHistory || [];

    tableData.value = logs.map((item) => {
      const ramal = ramals.find((r) => r._id === item.id);
      return {
        oltRamal: ramal.oltRamal,
        rx: item.avgSignal.rx,
        tx: item.avgSignal.tx,
        oltName: ramal.oltName,
        clients: item.gpon_data.sort((a, b) => a.rx - b.rx),
      };
    });

    // Monta as labels e datasets
    const labels = logs.map(
      (item) => ramals.find((r) => r._id === item.id)?.oltRamal
    );
    const txData = logs.map((item) => item.avgSignal?.tx ?? 0);
    const rxData = logs.map((item) => item.avgSignal?.rx ?? 0);

    chartData.value = {
      labels,
      datasets: [
        {
          label: "TX (Transmissão)",
          backgroundColor: "#42A5F5",
          data: txData,
        },
        {
          label: "RX (Recepção)",
          backgroundColor: "#66BB6A",
          data: rxData,
        },
      ],
    };

    notFound.value = false;
  } catch (error) {
    console.error("Erro ao carregar dados do gráfico:", error);
    notFound.value = true;
  } finally {
    loadingChart.value = false;
  }
};

onMounted(loadData);
</script>

<template>
  <v-card :loading="loadingChart" class="overflow-x-auto">
    <v-card-title class="bg-orange">
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex">
          <p class="me-2">Relatorio de Sinais</p>
          <v-icon>mdi-chart-box</v-icon>
        </div>
        <div class="d-flex justify-center align-center ga-3">
          <v-btn
            v-if="switchMode === 'chart'"
            variant="text"
            prepend-icon="mdi-table"
            @click="switchMode = 'table'"
            >Ver modo tabela</v-btn
          >
          <v-btn
            v-else
            variant="text"
            prepend-icon="mdi-chart-box"
            @click="switchMode = 'chart'"
            >Ver modo gráfico</v-btn
          >
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
      <template v-if="!notFound">
        <template v-if="switchMode === 'chart'">
          <Suspense>
            <div class="overflow-x-auto">
              <Bar v-if="chartData" :data="chartData" :options="options" />
            </div>

            <template #fallback>
              <h2>Carregando gráfico...</h2>
            </template>
          </Suspense>
        </template>

        <template v-else>
          <TableSignalsData :data="tableData" />
        </template>
      </template>

      <template v-else>
        <div
          style="height: 600px"
          class="d-flex flex-column justify-center align-center ga-2"
        >
          <v-icon size="150">mdi-database-off</v-icon>
          <h2>Não foram encontrados dados para essa data</h2>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>
