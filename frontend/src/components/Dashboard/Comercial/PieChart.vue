<script setup>
import hubApi from "@/api/hubsoftApi";
import { ref, onMounted } from "vue";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "vue-chartjs";

const prospectos = ref([]);

ChartJS.register(ArcElement, Tooltip, Legend);

const data = ref({
  labels: ["VueJs", "EmberJs", "ReactJs", "AngularJs"],
  datasets: [
    {
      backgroundColor: ["#41B883", "#E46651", "#00D8FF", "#DD1B16"],
      data: [40, 20, 80, 10],
      fontSize: 16,
    },
  ],
});

const options = ref({
  responsive: true,
  aspectRatio: 3,
  plugins: {
    legend: {
      labels: {
        font: {
          size: 14,
        },
        color: "#fff",
      },
    },
  },
});

const getProspectos = async () => {
  try {
    const response = await hubApi.get("/api/v1/integracao/prospecto/all");
    prospectos.value = response.data;
    console.table(prospectos.value.prospectos);
  } catch (error) {
    console.log(error);
  }
};

onMounted(() => {
  getProspectos();
});
</script>
<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <p>Origem de Contato Prospectos</p>
    </v-card-title>
    <v-card-text class="mb-3">
      <Pie :data="data" :options="options" />
    </v-card-text>
  </v-card>
</template>
