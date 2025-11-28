<script setup>
import { ref, computed, onMounted, watch } from "vue";
import moment from "moment-timezone";
import SalesCard from "@/components/Dashboard/Comercial/SalesCard";
import HeaderCard from "@/components/Dashboard/Comercial/HeaderCard.vue";
import MetricsCard from "@/components/Dashboard/Comercial/MetricsCard";
import BarCharts from "@/components/Dashboard/Comercial/BarCharts.vue";
import MessageBoard from "@/components/Dashboard/Comercial/MessageBoard.vue";
import fetchApi from "@/api";

const metrics = ref([]);
const currentMetric = ref({});
const loading = ref(true);
const viewNumber = ref(1);
const saleCategory = ref("Venda");
const sales = ref([]);
const nextKey = ref(0);
const nextKeyMessage = ref(0);

function getWeekNumber(date) {
  moment.tz.setDefault("America/Sao_Paulo");

  const momentDate = date ? moment(date) : moment();

  const weekNumber = momentDate.isoWeek();

  return weekNumber;
}

const salesCount = computed(() => {
  return {
    day: sales.value.dailySales?.length,
    week: sales.value.weekSales?.length,
    total: sales.value.sales?.length,
  };
});

const updateMetric = (metric) => {
  currentMetric.value = metric;
  nextKey.value++;
  fetchSales();
};

const fetchGoals = async () => {
  const response = await fetchApi("/goals");
  metrics.value = response.data;
  currentMetric.value = metrics.value[metrics.value.length - 1];
  nextKey.value++;
};

const fetchSales = async () => {
  const response = await fetchApi.post("/sales", {
    metricRef: currentMetric.value._id,
    weekRef: getWeekNumber(),
    saleCategory: saleCategory.value,
  });

  watch(saleCategory, () => {
    fetchSales();
  });

  const formatDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  response.data.dailySales = response.data.sales.filter(
    (s) => s.date === formatDate()
  );

  sales.value = response.data;
};

const fetchData = async () => {
  await fetchGoals();
  await fetchSales();
};

const refreshSales = () => {
  setInterval(() => {
    fetchSales();
  }, 15000);
};

refreshSales();

onMounted(async () => {
  await fetchData();
  loading.value = false;
});
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <!-- HEADER -->
        <HeaderCard
          v-if="metrics.length > 0"
          @update-metric="(metric) => updateMetric(metric)"
          @update-component="() => fetchGoals()"
          @update-sale="() => fetchSales()"
          @update-view-number="(number) => (viewNumber = number)"
          :metrics="metrics"
          :metric="currentMetric"
          :key="nextKey"
        />
      </v-col>
    </v-row>
    <v-row justify="center" v-if="!loading && viewNumber !== 3">
      <MetricsCard
        title="VENDAS MENSAIS"
        :metric="currentMetric.monthSales"
        :numberOfSales="salesCount.total"
      />
      <MetricsCard
        title="VENDAS SEMANAIS"
        :metric="currentMetric.weekSales"
        :numberOfSales="salesCount.week"
      />
      <MetricsCard
        title="VENDAS DIARIAS"
        :metric="currentMetric.dailySales"
        :numberOfSales="salesCount.day"
      />
    </v-row>
    <v-row v-if="sales.sales">
      <v-col>
        <v-window v-model="viewNumber">
          <v-window-item :value="1">
            <v-row>
              <v-col cols="12" md="4">
                <SalesCard
                  title="Vendas Mês"
                  :metric="currentMetric"
                  :sales="sales.sales"
                  filter="month"
                  :key="nextKey"
                  @update-sales="saleCategory = $event"
                />
              </v-col>
              <v-col cols="12" md="4">
                <SalesCard
                  title="Vendas Semana"
                  :sales="sales.weekSales"
                  filter="week"
                  @update-sales="saleCategory = $event"
                />
              </v-col>
              <v-col cols="12" md="4">
                <SalesCard
                  :title="'Vendas ' + new Date().toLocaleDateString()"
                  :sales="sales.dailySales"
                  filter="day"
                  @update-sales="saleCategory = $event"
                />
              </v-col>
            </v-row>
          </v-window-item>
          <v-window-item :value="2">
            <v-row>
              <v-col>
                <BarCharts v-model="currentMetric" />
              </v-col>
            </v-row>
          </v-window-item>
          <v-window-item :value="3">
            <v-row>
              <MessageBoard
                @re-render="nextKeyMessage++"
                :key="nextKeyMessage"
              />
            </v-row>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card
          v-if="viewNumber === 1"
          class="mx-auto rounded-xl mx-3"
          color="light-blue-darken-4"
          variant="tonal"
          prepend-icon="mdi-feather"
        >
          <template v-slot:prepend>
            <v-icon size="x-large">mdi-feather</v-icon>
          </template>

          <v-card-text
            class="text-h3 my-6 font-italic font-weight-light text-lowercase"
            style="line-height: 45px"
          >
            {{ `"${currentMetric.phrase}"` }}
          </v-card-text>
          <v-card-actions>
            <v-list-item class="w-100">
              <template v-slot:append>
                <div class="justify-self-end">
                  <v-icon class="me-1" icon="mdi-heart"></v-icon>
                  <span class="subheading me-2">256</span>
                  <span class="me-1">·</span>
                  <v-icon class="me-1" icon="mdi-share-variant"></v-icon>
                  <span class="subheading">45</span>
                </div>
              </template>
            </v-list-item>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
