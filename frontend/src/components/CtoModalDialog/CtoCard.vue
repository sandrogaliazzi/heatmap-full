<script setup>
import { ref, computed, watch, inject, onMounted } from "vue";

import CtoMap from "./CtoMap.vue";
import CtoCardHeader from "./CtoCardHeader.vue";
import CtoCardSummary from "./CtoCardSummary.vue";
import CtoDiagramDialog from "./CtoDiagramDialog.vue";
import CtoCardWindow from "./CtoCardWindow.vue";
import ClientesOnuCard from "../ClientesOnuModalDialog/ClientesOnuCard.vue";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";

const notification = useNotificationStore();

const { cto } = defineProps(["cto"]);
defineEmits(["setCtoFromChild"]);

const apConnList = ref([]);
const clientsWithLocation = ref([]);
const loading = ref({
  connections: true,
  locations: true,
  freePorts: true,
});
const loadRequestId = ref(0);
const slideNumber = ref(1);
const showDiagram = ref(false);

const isCurrentLoad = (requestId) => requestId === loadRequestId.value;

const clients = ref([]);

const mapClients = (connections) => {
  return connections
    .filter((conn) => conn.client)
    .map((client) => {
      return {
        id: client.client.id,
        name: client.client.name,
      };
    });
};

const mapKey = ref(1);
const freePorts = ref({ totalPorts: null, freePorts: null });

const calcFreePorts = async () => {
  const { lat, lng } = cto.coord;

  try {
    const response = await fetchApi.get(`/viability/${lat}/${lng}/10`);
    if (response.data.length > 0) {
      const { total_ports, free_ports_number } =
        response.data[0]?.splitters.reduce(
          (acc, val) => {
            return {
              total_ports: acc.total_ports + val.total_ports,
              free_ports_number: acc.free_ports_number + val.free_ports_number,
            };
          },
          { total_ports: 0, free_ports_number: 0 },
        ) ?? { total_ports: 0, free_ports_number: 0 };
      return { totalPorts: total_ports, freePorts: free_ports_number };
    } else {
      notification.setNotification({
        msg: "Nenhuma informação de viabilidade encontrada para este CTO",
        status: "red",
      });
      return { totalPorts: 0, freePorts: 0 };
    }
  } catch (e) {
    console.error("Erro ao buscar viabilidade" + e.message);
    return { totalPorts: 0, freePorts: 0 };
  }
};

const loadConnections = async (requestId) => {
  loading.value.connections = true;
  try {
    const response = await fetchApi("connections/" + cto.id);
    if (!isCurrentLoad(requestId)) return;

    clients.value = mapClients(response.data);
    apConnList.value = response.data;
  } catch (error) {
    console.error("Erro ao buscar conexoes:", error);
    if (isCurrentLoad(requestId)) {
      clients.value = [];
      apConnList.value = [];
    }
  } finally {
    if (isCurrentLoad(requestId)) loading.value.connections = false;
  }
};

const loadClientsWithLocation = async (requestId) => {
  loading.value.locations = true;
  try {
    const locations = await getClientsWithLocation();
    if (!isCurrentLoad(requestId)) return;

    clientsWithLocation.value = locations;
  } catch (error) {
    console.error("Erro ao buscar localizacoes de clientes:", error);
    if (isCurrentLoad(requestId)) clientsWithLocation.value = [];
  } finally {
    if (isCurrentLoad(requestId)) loading.value.locations = false;
  }
};

const loadFreePorts = async (requestId) => {
  loading.value.freePorts = true;
  try {
    const ports = await calcFreePorts();
    if (!isCurrentLoad(requestId)) return;

    freePorts.value = ports;
  } finally {
    if (isCurrentLoad(requestId)) loading.value.freePorts = false;
  }
};

const loadCtoData = ({ goBackAfterLoad = false } = {}) => {
  const requestId = loadRequestId.value + 1;
  loadRequestId.value = requestId;

  if (goBackAfterLoad) {
    slideNumber.value--;
    mapKey.value++;
  }

  return Promise.allSettled([
    loadConnections(requestId),
    loadClientsWithLocation(requestId),
    loadFreePorts(requestId),
  ]);
};

onMounted(() => {
  loadCtoData();
});

const closeDialog = inject("closeDialog");

const isMapVisible = ref(false);
const positionClicked = ref({ lat: "", lng: "" });
const userLocation = ref(null);
const showOnuCard = ref(false);

const center = computed(() => {
  return {
    lat: parseFloat(cto.coord.lat),
    lng: parseFloat(cto.coord.lng),
  };
});

const clientLocation = ref(null);
const openNewGMapTab = (position) => {
  clientLocation.value = position;
  slideNumber.value = 4;
};

const resetPosition = () => (positionClicked.value = { lat: "", lng: "" });

watch(slideNumber, () => {
  if (slideNumber.value === 1) resetPosition();
});

const handleUserLocation = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (!userLocation.value) {
        userLocation.value = pos.coords;
      } else {
        userLocation.value = null;
      }
    },
    (error) => {
      console.log(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    },
  );
};

const onPositionSelected = (position) => (positionClicked.value = position);

const saveClientLocation = async (client, position) => {
  const bodyRequest = {
    name: client.name,
    lat: position.lat,
    lng: position.lng,
    cto_id: cto.id,
    user: "SANDRO",
    cto_name: cto.name,
    date_time: new Date().toLocaleString("pt-BR", { timeZone: "UTC" }),
  };

  const response = await fetchApi.post("/ctoclient", bodyRequest);

  return response;
};

const mapCenter = ref({ lat: +cto.coord.lat, lng: +cto.coord.lng });

const addUserLocation = async (client) => {
  try {
    const locationSaved = await saveClientLocation(client, cto.coord);

    if (locationSaved.status === 201) {
      notification.setNotification({
        status: "success",
        msg: "Localizacao salva com sucesso",
      });
      loadCtoData();
      clientLocation.value = locationSaved.data;
      slideNumber.value = 4;
    }
  } catch (e) {
    console.error(`Erro ao adicionar localizacao ${e.message}`);
  }
};

const getClientsWithLocation = async () => {
  try {
    const response = await fetchApi(`/ctoclient/${cto.id}`);

    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const setViewMode = () => {
  if (slideNumber.value === 1) slideNumber.value = 3;
  else slideNumber.value = 1;
};

const serviceLocation = ref("teste");
</script>

<template>
  <v-card>
    <CtoCardHeader
      :cto="cto"
      :slide-number="slideNumber"
      :is-map-visible="isMapVisible"
      :user-location="userLocation"
      @open-location="openNewGMapTab"
      @open-diagram="showDiagram = true"
      @toggle-user-location="handleUserLocation"
      @toggle-history="setViewMode"
      @go-add-client="slideNumber++"
      @go-back="slideNumber = 1"
      @toggle-map="isMapVisible = !isMapVisible"
      @close="closeDialog"
    />
    <CtoCardSummary
      :cto="cto"
      :free-ports="freePorts"
      :loading="loading"
      :connections="apConnList"
    />
    <!-- mini mapa cto -->
    <CtoMap
      :center="mapCenter"
      :key="mapKey"
      :ctoPosition="center"
      :serviceLocation="serviceLocation"
      :clients="clientsWithLocation"
      :userLocation="userLocation"
      :isMapVisible="isMapVisible || slideNumber == 2"
      @positionSelected="onPositionSelected"
      @clientRemoved="loadCtoData"
    />
    <!-- digrana de fusoes -->
    <CtoDiagramDialog
      v-model="showDiagram"
      :cto-name="cto.name"
      :loading-connections="loading.connections"
      :connections="apConnList"
    />

    <CtoCardWindow
      v-model:slide-number="slideNumber"
      :loading="loading"
      :clients="clients"
      :cto="cto"
      :clients-with-location="clientsWithLocation"
      :position-clicked="positionClicked"
      :client-location="clientLocation"
      :show-onu-card="showOnuCard"
      @add-user-location="addUserLocation"
      @delete-user="loadCtoData"
      @open-location="openNewGMapTab"
      @reload-cto="loadCtoData"
      @reload-cto-and-go-back="loadCtoData({ goBackAfterLoad: true })"
      @update-service-location="serviceLocation = $event"
      @delete-client-location="
        loadCtoData();
        slideNumber = 1;
      "
    />

    <!-- card verificar sinal -->
    <v-card-text>
      <ClientesOnuCard v-if="showOnuCard" :clients="clients" :city="cto.city">
        <template #header>
          <span class="d-none"></span>
        </template>
        <template #search>
          <span class="d-none"></span>
        </template>
      </ClientesOnuCard>
    </v-card-text>
    <v-card-actions style="margin-top: auto" v-if="slideNumber == 1">
      <v-btn
        block
        variant="tonal"
        :color="showOnuCard ? 'error' : 'primary'"
        @click="showOnuCard = !showOnuCard"
      >
        {{ showOnuCard ? "Fechar" : "verificar sinal" }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.fixed-action {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
}
</style>
