<script setup>
import { ref } from "vue";
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

const { rx, tx, labels, ramal } = defineProps(["rx", "tx", "labels", "ramal"]);

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
  labels,
  datasets: [
    {
      label: "Sinais rx",
      backgroundColor: "#2196F3",
      borderColor: "#2196F3",
      data: rx,
    },
    {
      label: "Sinais tx",
      backgroundColor: "#FF9800",
      borderColor: "#FF9800",
      data: tx,
    },
  ],
});
</script>

<template>
  <v-dialog v-model="showChart" max-width="1200px">
    <v-card>
      <v-card-title>{{ ramal }}</v-card-title>
      <v-card-text class="ma-5">
        <Line id="my-chart-id" :options="chartOptions" :data="chartData" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
