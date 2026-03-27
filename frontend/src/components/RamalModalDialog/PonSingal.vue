<script setup>
import { ref, computed, onMounted } from "vue";
import { useNotificationStore } from "@/stores/notification";
import signalChart from "./signalChart.vue";
import fetchApi from "@/api";
import PonClientsMap from "./PonClientsMap.vue";

const { ramal, loading, rawSignals } = defineProps([
  "ramal",
  "loading",
  "rawSignals",
]);

const onuList = defineModel();
const emit = defineEmits(["refreshData"]);

const notification = useNotificationStore();

const ramalHistory = ref([]);
const prevData = ref(false);
const selectedDate = ref(new Date().toISOString().split("T")[0]);
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

const downloadCsv = () => {
  if (!rawSignals || rawSignals.length === 0) {
    console.warn("Sem dados para exportar.");
    return;
  }

  const headers = Object.keys(rawSignals[0]);

  const csvRows = [];

  csvRows.push(headers.join(";"));

  for (const item of rawSignals) {
    const row = headers.map((header) => {
      let value = item[header] ?? "";

      value = String(value).replace(/"/g, '""');

      if (value.includes(";") || value.includes("\n") || value.includes('"')) {
        value = `"${value}"`;
      }

      return value;
    });

    csvRows.push(row.join(";"));
  }

  const csvString = csvRows.join("\n");
  const csvContent =
    "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);

  const link = document.createElement("a");
  link.href = csvContent;
  link.download = `${ramal?.oltRamal ?? "export"}_signals.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

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

const subtractOneDayFromCurrentDate = (dateValue) => {
  const date = new Date(dateValue);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
};

const selectPrevData = () => {
  selectedDate.value = subtractOneDayFromCurrentDate(selectedDate.value);
  prevData.value = ramalHistory.value.find(
    (item) => item.date_time.split("T")[0] === selectedDate.value,
  )?.gpon_data;
  if (!prevData.value) {
    notification.setNotification({
      msg: "Nenhum dado encontrado para a data selecionada",
      status: "red",
    });
  }
};

const selectFollowingData = () => {
  const followingDate = new Date(selectedDate.value);
  followingDate.setDate(followingDate.getDate() + 1);
  const followingDateString = followingDate.toISOString().split("T")[0];

  const nextData = ramalHistory.value.find(
    (item) => item.date_time.split("T")[0] === followingDateString,
  )?.gpon_data;

  if (nextData) {
    selectedDate.value = followingDateString;
    prevData.value = nextData;
  } else {
    notification.setNotification({
      msg: "Nenhum dado encontrado para a data seguinte",
      status: "red",
    });
  }
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
        <v-card-title
          class="d-flex flex-column flex-md-row align-center justify-space-between flex-wrap"
        >
          <span class="text-h6">{{ ramal.oltRamal }}</span>

          <div class="d-flex align-center ga-2 mt-2">
            <v-btn prepend-icon="mdi-map-search" variant="text">
              Ver mapa
              <v-dialog activator="parent" max-width="800">
                <template v-slot:default="{ isActive }">
                  <pon-clients-map
                    :ramal="ramal"
                    @closeDialog="isActive.value = false"
                  />
                </template>
              </v-dialog>
            </v-btn>
            <v-btn
              color="orange"
              variant="tonal"
              prepend-icon="mdi-history"
              v-if="ramalHistory.length > 0"
              @click="showChart = !showChart"
            >
              histórico
            </v-btn>
            <v-btn
              color="primary"
              variant="tonal"
              @click="emit('refreshData')"
              prepend-icon="mdi-refresh"
              >Recarregar</v-btn
            >
          </div>
        </v-card-title>
        <v-card-subtitle class="d-flex flex-column ga-2">
          <v-divider class="my-2"></v-divider>
          <span
            >✅ {{ activeOnuLength }} online / ❌
            {{ offlineOnuLength }} offline</span
          >
          <span>{{ selectedDate.toString() }}</span>
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
    <v-card-actions class="d-flex">
      <v-row>
        <v-col cols="12" md="6">
          <!-- <v-btn
            color="secondary"
            class="w-100"
            variant="tonal"
            @click="setDataByDate(ramalHistory[0])"
            ></v-btn
          > -->
          <v-btn
            class="w-100"
            variant="tonal"
            color="orange"
            prepend-icon="mdi-chevron-left"
            @click="selectPrevData"
          >
            dia anterior
          </v-btn>
        </v-col>
        <v-col cols="12" md="6">
          <v-btn
            color="primary"
            variant="tonal"
            @click="selectFollowingData"
            class="w-100"
            append-icon="mdi-chevron-right"
            >dia seguinte</v-btn
          >
        </v-col>
      </v-row>
    </v-card-actions>
  </v-card>
</template>
