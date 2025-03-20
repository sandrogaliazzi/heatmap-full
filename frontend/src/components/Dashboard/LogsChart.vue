<script setup>
import { ref, onMounted } from "vue";
import { Bar } from "vue-chartjs";
import { getTotalLogsByCity } from "./chart";
import fetchApi from "@/api";
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

const { selectedDate } = defineProps(["selectedDate"]);
const emit = defineEmits(["update:loading"]);

const chartOptions = ref({
  responsive: true,
});

const logCounterBycity = ref({
  labels: [],
  data: [],
});
const loaded = ref(false);
const logs = ref([]);
const chartData = ref(null);

onMounted(async () => {
  logs.value = await fetchApi("logctoclient");

  logCounterBycity.value = await getTotalLogsByCity(
    logs.value.data,
    selectedDate
  );

  const { labels, data } = logCounterBycity.value;

  chartData.value = {
    labels,
    datasets: [
      {
        data,
        label: `Ativações`,
        backgroundColor: [
          "#FF9800",
          "#ff006e",
          "#3a86ff",
          "#8338ec",
          "#2c6e49",
          "#d90429",
          "#2b2d42",
        ],
        color: "#fff",
      },
    ],
  };

  if (logCounterBycity.value.data.length > 0) {
    loaded.value = true;
  }
  emit("update:loading");
});
</script>

<template>
  <Bar
    id="my-chart-id"
    :options="chartOptions"
    :data="chartData"
    v-if="loaded"
  />
</template>
