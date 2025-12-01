<script setup>
import { ref, onMounted, computed } from "vue";
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

const sales = defineModel();
const sellers = ref([]);

const loadSellers = async () => {
  const response = await fetchApi.get("/users");
  return response.data
    .filter((user) => user.category === "vendas" || user.name == "felipe")
    .map((user) => ({ ...user, name: user.name.toUpperCase() }));
};

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

const sellersNames = computed(() =>
  sellers.value.map((seller) => seller.name.toUpperCase())
);

const ticketAmountSum = computed(() => {
  const sum = ticketAmountBySeller.value.reduce((a, b) => a + b, 0);
  return sum?.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
});

const ticketAmountBySeller = computed(() => {
  const ticketAmounts = [];
  sellersNames.value.forEach((name) => {
    const sellerSales = sales.value.filter(
      (sale) => sale.seller.toUpperCase() === name
    );
    const ticketAmount = sellerSales.reduce(
      (total, sale) => total + parseFloat(sale.ticketValue || 0),
      0
    );

    ticketAmounts.push(ticketAmount);
  });
  return ticketAmounts;
});

onMounted(async () => {
  sellers.value = await loadSellers();
  console.log(sales);
});

const data = computed(() => ({
  labels: sellersNames.value,
  datasets: [
    {
      label: `Valor Total Recorrente`,
      backgroundColor: "#42A5F5",
      data: ticketAmountBySeller.value,
    },
  ],
}));
</script>

<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <p>Valor total recorrente por vendedor</p>
    </v-card-title>
    <v-card-subtitle>
      <p>TOTAL: {{ ticketAmountSum }}</p>
    </v-card-subtitle>
    <v-card-text>
      <Bar v-if="data" :data="data" :options="options" />
    </v-card-text>
  </v-card>
</template>
