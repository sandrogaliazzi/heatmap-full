<script setup>
import { ref, computed, onMounted } from "vue";
import { useNotificationStore } from "@/stores/notification";
import signalChart from "./signalChart.vue";

const { ramal, loading } = defineProps(["ramal", "loading"]);

const onuList = defineModel();
const emit = defineEmits(["refreshData"]);
import fetchApi from "@/api";

const notification = useNotificationStore();

const ramalHistory = ref([]);
const prevData = ref(false);
const selectedDate = ref("");
const showChart = ref(false);
const avgRxList = ref([]);
const avgTxList = ref([]);
const labels = ref(null);

const search = ref("");

function calculateAverages(data) {
  if (data.length === 0) {
    return { avgTx: null, avgRx: null };
  }

  let totalTx = 0;
  let totalRx = 0;

  for (const item of data) {
    totalTx += item.tx;
    totalRx += item.rx;
  }

  const avgTx = totalTx / data.length;
  const avgRx = totalRx / data.length;

  return {
    tx: parseFloat(avgTx.toFixed(2)),
    rx: parseFloat(avgRx.toFixed(2)),
  };
}

const headers = ref([
  {
    align: "start",
    key: "alias",
    sortable: false,
    title: "Nome",
  },
  { key: "status", title: "status" },
  { key: "tx", title: "Tx sinal" },
  { key: "rx", title: "Rx Sinal" },
]);

const saveGponData = async () => {
  const save = await fetchApi.post("ramal-log-register", {
    id: ramal._id,
    date_time: new Date().toISOString(),
    gpon_data: onuList.value,
    avgSignal: calculateAverages(onuList.value),
  });

  console.log(save);

  if (save.status === 200) {
    notification.setNotification({
      msg: "Salvo no histórico de sinais com sucesso",
      status: "success",
    });
  } else {
    notification.setNotification({
      msg: "Erro ao adicionar no histórico",
      status: "red",
    });
  }
};

const setDataByDate = (data) => {
  prevData.value = data.gpon_data;
  selectedDate.value = data.date_time;
};

const activeOnuLength = computed(() => {
  return onuList.value.filter((onu) => onu.status === "ACTIVE (PROVISIONED)")
    .length;
});

const offlineOnuLength = computed(() => {
  return onuList.value.filter((onu) => onu.status !== "ACTIVE (PROVISIONED)")
    .length;
});

onMounted(async () => {
  const response = await fetchApi(`find-ramal-logs/${ramal._id}`);
  if (response.status === 200) {
    ramalHistory.value = response.data.ramalHistory;
    avgRxList.value = ramalHistory.value.map((item) => item.avgSignal.rx);
    avgTxList.value = ramalHistory.value.map((item) => item.avgSignal.tx);
    labels.value = ramalHistory.value.map((item) => item.date_time);
  }
});
</script>

<template>
  <signal-chart
    v-model="showChart"
    :tx="avgTxList"
    :rx="avgRxList"
    :labels="labels"
    :ramal="ramal.oltRamal"
    :loaded="true"
    v-if="labels"
  />
  <v-card :loading="loading">
    <v-card-text>
      <v-card flat>
        <v-card-title class="d-flex align-center justify-space-between">
          Lista clientes {{ ramal.oltRamal }}

          <div class="d-flex align-center ga-2 mt-2">
            <v-btn
              color="orange"
              variant="tonal"
              v-if="ramalHistory.length > 0"
              @click="showChart = !showChart"
            >
              Ver histórico
            </v-btn>
            <v-btn color="primary" variant="tonal" @click="emit('refreshData')"
              >Recarregar</v-btn
            >
          </div>
        </v-card-title>
        <v-card-subtitle>
          <v-divider class="my-2"></v-divider>
          ✅ {{ activeOnuLength }} online / ❌ {{ offlineOnuLength }} offline
        </v-card-subtitle>
        <template v-slot:text>
          <v-text-field
            v-model="search"
            label="Pesquisar"
            prepend-inner-icon="mdi-magnify"
            single-line
            variant="outlined"
            hide-details
          ></v-text-field>
        </template>

        <v-data-table
          :headers="headers"
          :items="prevData ? prevData : onuList"
          :search="search"
        ></v-data-table>
      </v-card>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" block @click="saveGponData"
        >Salvar no histórico</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
