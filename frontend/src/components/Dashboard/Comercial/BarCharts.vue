<script setup>
import { ref, onMounted, watch } from "vue";
import fetchApi from "@/api";
import { Bar } from "vue-chartjs";
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

const { sales } = defineProps(["sales"]);

const salesByCity = ref([]);
const loadingChart = ref(false);
const hasFilter = ref(true);
const data = ref(null);

const options = ref({
  indexAxis: "x",
  plugins: {
    title: {
      display: true,
      text: "Chart.js Bar Chart - Stacked",
    },
    legend: {
      position: "right",
    },
  },
  responsive: true,
  aspectRatio: 3,
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
    },
  },
});

const citys = ref([
  "NOVA HARTZ",
  "IGREJINHA",
  "ARARICA",
  "TAQUARA",
  "GRAVATAI",
  "PAROBÉ",
  "GLORINHA",
  "NOVO HAMBURGO",
  "SAPIRANGA",
  "TRÊS COROAS",
]);

const sellers = ref([
  "FELIPE",
  "LUIS FELIPE",
  "NADINE",
  "JESSICA",
  "GIACOMO",
  "DIEGO",
  "EQUIPE CONECT",
]);

const colors = {
  FELIPE: "#d90429",
  "LUIS FELIPE": "#2c6e49",
  JEFERSON: "#8338ec",
  MARONES: "#3a86ff",
  NADINE: "#ff006e",
  JANICE: "#FF9800",
  JESSICA: "#ccff33",
  GIACOMO: "#A020F0",
  DIEGO: "#03ffa2",
  "EQUIPE CONECT": "#00296b",
};

const byCurrentMonth = (sale) => {
  const month = sale.date.split("-")[1];
  const year = sale.date.split("-")[0];
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  const currentYear = String(new Date().getFullYear()).padStart(4, "0");

  return month === currentMonth && year === currentYear;
};

const getSalesByCity = async () => {
  try {
    const sellersData = await Promise.all(
      sellers.value.map(async (seller) => {
        const salesByCity = await Promise.all(
          citys.value.map(async (city) => {
            const response = await fetchApi(`/sales/${seller}/${city}`);
            if (response.status === 200) {
              return hasFilter.value
                ? response.data.filter(byCurrentMonth)
                : response.data;
            } else {
              throw new Error(`Falha ao obter vendas de ${seller} em ${city}`);
            }
          })
        );
        return { seller, salesByCity };
      })
    );
    return sellersData;
  } catch (error) {
    console.error("Um erro ocorreu:", error);
    throw error;
  }
};

const renderChart = async () => {
  salesByCity.value = await getSalesByCity();

  const datasets = salesByCity.value.map((item) => {
    return {
      data: item.salesByCity.map((i) => i.length),
      barThickness: 15,
      maxBarThickness: 20,
      label: `${item.seller} ${item.salesByCity
        .map((i) => i.length)
        .reduce((acc, val) => acc + val)}`,
      backgroundColor: colors[item.seller],
      color: "#fff",
    };
  });

  const labels = citys.value.map((city, i) => {
    const counter = datasets
      .map((t) => t.data[i])
      .reduce((acc, val) => acc + val);
    return `${city} ${counter}`;
  });

  data.value = { labels, datasets };
};

watch(hasFilter, () => renderChart());

onMounted(() => {
  renderChart();
});

setInterval(() => {
  renderChart();
}, 15000);
</script>
<template>
  <v-card :loading="loadingChart">
    <v-card-title class="d-flex justify-space-between align-center">
      <p>Numero de Ativaçõs por cidade</p>
      <!-- <div>
        <v-switch
          v-model="hasFilter"
          label="Mês atual"
          hide-details
          color="orange-darken-4"
        ></v-switch>
      </div> -->
    </v-card-title>
    <v-card-text>
      <Suspense>
        <Bar v-if="data" :data="data" :options="options" />
        <template #fallback>
          <h2>Loading chart...</h2>
        </template>
      </Suspense>
    </v-card-text>
  </v-card>
</template>
