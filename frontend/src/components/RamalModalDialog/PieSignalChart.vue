<script setup>
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { ref } from "vue";
import { Pie } from "vue-chartjs";

const chartData = defineModel();

const data = ref({
  labels: ["Maior que -27dB", "Menor que -25dB", "Media entre -27dB e -25dB"],
  datasets: [
    {
      backgroundColor: ["#eb4034", "#34eb64", "#ebab34"],
      data: [
        chartData.value.badSignal,
        chartData.value.goodSignal,
        chartData.value.avgSignal,
      ],
    },
  ],
});

const options = {
  responsive: true,
  maintainAspectRatio: false,
};

ChartJS.register(ArcElement, Tooltip, Legend);
</script>

<template>
  <Pie :data="data" :options="options" />
</template>
