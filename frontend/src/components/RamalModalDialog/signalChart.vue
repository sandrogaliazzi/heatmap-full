<script setup>
import { ref, toRefs } from "vue";
import { Line } from "vue-chartjs";

const showChart = defineModel();

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const props = defineProps(["rx", "tx", "labels", "ramal", "loaded"]);

const { rx, tx, labels, ramal, loaded } = toRefs(props);

const chartOptions = ref({
  responsive: true,
  scales: {
    x: {
      ticks: {
        display: false, // Oculta as labels do eixo X
      },
    },
    y: {
      ticks: {
        display: true, // Oculta as labels do eixo Y
      },
    },
  },
});

const chartData = ref({
  labels: labels.value,
  datasets: [
    {
      label: "Sinais Tx",
      backgroundColor: "#2196F3",
      borderColor: "#2196F3",
      data: rx.value,
    },
    {
      label: "Sinais Rx",
      backgroundColor: "#FF9800",
      borderColor: "#FF9800",
      data: tx.value,
    },
  ],
});
</script>

<template>
  <v-dialog v-model="showChart" max-width="1200px">
    <v-card>
      <v-card-title>{{ ramal }}</v-card-title>
      <v-card-text class="ma-5">
        <Line
          v-if="loaded"
          id="my-chart-id"
          :options="chartOptions"
          :data="chartData"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
