<script setup>
import { ref, computed } from "vue";
import fetchApi from "@/api";
import signalChart from "../RamalModalDialog/signalChart.vue";

const { onuList } = defineProps(["onuList"]);

const isLoadingSignal = ref(false);
const signalList = ref({});

const avgRxList = ref(null);
const avgTxList = ref(null);
const labels = ref(null);
const ramal = ref("");
const showChart = ref(false);
const isLoadingClientHistory = ref(false);
const apiDataLoaded = ref(false);
const chartKey = ref(0);

const checkOnuSignal = async (onu) => {
  isLoadingSignal.value = true;
  let signal;
  if (!onu.onuNumber) {
    signal = await fetchApi.post(
      "verificar-onu-completo",
      {
        oltIp: onu.oltIp,
        onuAlias: onu.mac,
      },
      {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
        params: {
          t: new Date().getTime(),
        },
      }
    );
  } else {
    signal = await fetchApi.post("verificar-onu-fiberhome", [
      {
        slot: onu.slot,
        onuNumber: onu.onuNumber,
        pon: onu.pon,
        mac: onu.mac,
      },
    ]);
  }

  signalList.value[onu.mac] = Array.isArray(signal.data)
    ? signal.data[0]
    : signal.data;
  isLoadingSignal.value = false;
};

const signalCalc = computed(() => {
  const TXList = [];
  const RXList = [];
  for (const onu in signalList.value) {
    let tx = 0;
    let rx = 0;

    if (signalList.value[onu]["Power Level"] != "NO SIGNAL") {
      tx = formatSigal(signalList.value[onu]["Power Level"])
        .split("")
        .slice(1, 6)
        .join("");

      rx = formatSigal(signalList.value[onu]["RSSI"])
        .split("")
        .slice(1, 6)
        .join("");
    }

    if (tx !== 0 || rx !== 0) {
      TXList.push(Number.parseFloat(tx));
      RXList.push(Number.parseFloat(rx));
    }
  }

  let TXSum,
    RXSum = 0;

  if (TXList.length > 0) {
    TXSum = TXList.reduce((acc, val) => acc + val);
    RXSum = RXList.reduce((acc, val) => acc + val);
  }

  return {
    tx: TXSum / TXList.length,
    rx: RXSum / RXList.length,
  };
});

const formatSigal = (signal) => {
  return signal.split(" ")[0];
};

const formatVlan = (vlan) => {
  return vlan?.split("_").pop();
};

const checkAllSignal = async (onuList) => {
  signalList.value = {};

  const signals = onuList.map(async (onu) => await checkOnuSignal(onu));

  await Promise.all(signals);
};

const showClientSignalHistory = async (client) => {
  isLoadingClientHistory.value = true;
  try {
    const response = await fetchApi(
      `find-client-signal-logs?alias=${client.name}&mac=${client.mac}`
    );
    if (response.status === 200) {
      avgRxList.value = response.data.map((data) => data.gpon_data.rx);
      avgTxList.value = response.data.map((data) => data.gpon_data.tx);
      labels.value = response.data.map((data) => data.date);
      ramal.value = client.name;
      showChart.value = true;
      isLoadingClientHistory.value = false;
      apiDataLoaded.value = true;
      chartKey.value++;
    }

    if (response.status === 404) {
      alert("Histórico não encontrado");
      isLoadingClientHistory.value = false;
    }
  } catch (error) {
    isLoadingClientHistory.value = false;
    alert("erro ao obter dados");
    console.log(error);
  }
};
</script>

<template>
  <signal-chart
    v-model="showChart"
    :tx="avgTxList"
    :rx="avgRxList"
    :labels="labels"
    :ramal="ramal"
    v-if="apiDataLoaded"
    :loaded="apiDataLoaded"
    :key="chartKey"
  />
  <v-list lines="two">
    <v-list-subheader>
      <div class="d-flex flex-column flex-md-row ga-2">
        <v-btn
          color="success"
          rounded="xl"
          variant="tonal"
          :loading="isLoadingSignal"
          @click="checkAllSignal(onuList)"
          v-if="onuList.length <= 128"
          class="mr-3"
          >Calcular sinal
        </v-btn>
        <v-chip color="primary" v-if="!isNaN(signalCalc.tx)"
          >Média sinal | TX:{{ signalCalc.tx.toFixed(2) }} RX:
          {{ signalCalc.rx.toFixed(2) }}
        </v-chip>
      </div>
      <v-chip color="orange" class="my-3"
        >Clientes: {{ onuList.length }}</v-chip
      >
    </v-list-subheader>
    <v-virtual-scroll
      class="pt-0"
      height="400"
      item-height="50"
      :items="onuList"
    >
      <template #="{ item }">
        <v-list-group>
          <template #activator="{ props }">
            <v-list-item
              v-if="item.name"
              v-bind="props"
              prepend-icon="mdi-circle-box"
              :value="item.mac"
              :title="item.name"
            >
              <v-list-item-subtitle>
                <span class="text-disabled me-2"
                  >{{ item.mac }} VLAN: {{ formatVlan(item.flowProfile) }}</span
                >
                <v-chip
                  size="small"
                  :color="
                    signalList[item.mac]['Power Level'] == 'NO SIGNAL'
                      ? 'error'
                      : 'primary'
                  "
                  class="d-none d-md-inline-flex"
                  v-if="signalList[item.mac]"
                  >RX:
                  {{ formatSigal(signalList[item.mac]["Power Level"]) }} TX:
                  {{ formatSigal(signalList[item.mac]["RSSI"]) }}</v-chip
                >
              </v-list-item-subtitle>
            </v-list-item>
          </template>
          <v-list-item>
            <v-list-item-title
              class="d-flex flex-column flex-sm-row justify-end"
            >
              <v-chip size="small" color="primary" v-if="signalList[item.mac]"
                >TX: {{ formatSigal(signalList[item.mac]["Power Level"]) }} RX:
                {{ formatSigal(signalList[item.mac]["RSSI"]) }}</v-chip
              >
              <div class="d-flex flex-column ga-2">
                <v-btn
                  color="warning"
                  variant="tonal"
                  size="small"
                  rounded="xl"
                  class="ml-2 mt-2 mt-sm-0"
                  @click="checkOnuSignal(item)"
                  :loading="isLoadingSignal"
                  >Verificar Sinal</v-btn
                >
                <v-btn
                  color="orange"
                  variant="plain"
                  size="small"
                  rounded="xl"
                  :loading="isLoadingClientHistory"
                  prepend-icon="mdi-history"
                  v-if="!item.onuNumber"
                  @click="showClientSignalHistory(item)"
                  >histórico de sinal</v-btn
                >
              </div>
            </v-list-item-title>
          </v-list-item>
        </v-list-group>
      </template>
    </v-virtual-scroll>
  </v-list>
</template>
