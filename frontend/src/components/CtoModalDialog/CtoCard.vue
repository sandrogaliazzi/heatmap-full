<script setup>
import { ref, computed, watch, inject, onMounted } from "vue";

import CtoMap from "./CtoMap.vue";
import CtoClientsList from "./CtoClientsList.vue";
import AddClientForm from "./AddClientForm.vue";
import ClientesOnuCard from "../ClientesOnuModalDialog/ClientesOnuCard.vue";
import fetchApi from "@/api";
import CeCard from "@/components/CeModalDialog/CeCard.vue";
import CtoNotes from "./CtoNotes.vue";
import CtoConectors from "./CtoConectors.vue";

const { cto, tomodatView } = defineProps(["cto", "tomodatView"]);
const emit = defineEmits(["setCtoFromChild"]);

const ctoNotes = ref(false);
const apConnList = ref([]);
const clientsWithLocation = ref([]);
const isDataLoading = ref(true);
const slideNumber = ref(1);

const saveNote = async (note) => {
  try {
    const response = await fetchApi.post("/notes", note);

    const savedNote = response.data;
    return savedNote;
  } catch (error) {
    console.error("Erro ao salvar nota:", error);
    throw error;
  }
};

const processAndSaveTomodatNotes = async (tomodatData) => {
  const notes = tomodatData
    .map((d) => d.connection_slot_notes)
    .filter((note) => note.length > 0);

  if (notes.length > 0) {
    const documents = notes.flat().map((n) => {
      const { id, note, slot_number } = n;
      return {
        id,
        note,
        slot_number,
        access_point_id: cto.id,
      };
    });

    await Promise.all(
      documents.map((note) => {
        return saveNote(note);
      })
    );
  }
};

const fetchNotes = async () => {
  try {
    const notes = await fetchApi("notes/access-point/" + cto.id);

    return notes.data.length > 0 ? notes.data : false;
  } catch (error) {
    console.error("Erro ao buscar notas");
  }
};

const notesKey = ref(1);

const onNotesReload = async () => {
  ctoNotes.value = await fetchNotes();

  notesKey.value++;
};

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
const freePorts = ref({});

const calcFreePorts = (accessPoint) => {
  const totalPorts = accessPoint
    .filter((c) => c.splitter)
    .filter((c) => c.splitter.name.startsWith(cto.name))
    .map((c) => c.splitter)
    .reduce((acc, cur) => acc + cur.ports_number, 0);

  const totalClients = mapClients(accessPoint).length;

  freePorts.value = totalPorts - totalClients;

  return { totalPorts, freePorts: freePorts.value };
};

const loadCtoData = async (slide) => {
  clientsWithLocation.value = await getClientsWithLocation();

  const response = await fetchApi("connections/" + cto.id);

  clients.value = mapClients(response.data);

  freePorts.value = calcFreePorts(response.data);

  apConnList.value = response.data;

  await processAndSaveTomodatNotes(response.data);

  ctoNotes.value = await fetchNotes();

  isDataLoading.value = false;

  if (slide) {
    slideNumber.value--;
    mapKey.value++;
  }
};

onMounted(async () => {
  await loadCtoData();
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

const openNewGMapTab = (position) => {
  let url = "";
  if (confirm("deseja abrir este link no waze?")) {
    url = `https://www.waze.com/ul?ll=${position.lat}%2C${position.lng}&navigate=yes&zoom=17`;
  } else {
    url = `https://www.google.com/maps/search/?api=1&query=${position.lat},${position.lng}`;
  }
  const win = window.open(url, "_blank");
  win.focus();
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
    }
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
      alert("Localizacao adicionada com sucesso");
      await loadCtoData();
      isMapVisible.value = true;
      //mapKey.value++;
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

const onClientLocationRemoved = async (id) => {
  if (confirm("deseja remover a localizacao deste cliente?")) {
    try {
      const response = await fetchApi.delete(`/deletectoclient/${id}`);
      if (response.status === 201) {
        alert("Localização removida com sucesso");
        await loadCtoData();
        mapKey.value++;
      }
    } catch (error) {
      console.error(error);
    }
  }
};

const setViewMode = () => {
  if (slideNumber.value === 1) slideNumber.value = 3;
  else slideNumber.value = 1;
};

const onClientLocationUpdated = async ({ client, position }) => {
  try {
    const response = await fetchApi.post("/updatectoclient", {
      _id: client.id,
      data: {
        lat: position.lat,
        lng: position.lng,
      },
    });

    if (response.status === 200) {
      alert("Localizacao atualizada com sucesso");
      await loadCtoData();
    }
  } catch (error) {
    console.error(error);
    alert("Ocorreu um erro ao atualizar a localizacao");
  }
};
</script>

<template>
  <v-card class="rounded-md-lg">
    <v-card-title
      class="d-flex justify-space-between align-center border-b"
      :class="cto.color === '#00ff00' ? 'bg-green' : 'bg-orange'"
    >
      <p style="cursor: pointer" @click="openNewGMapTab(cto.coord)">
        {{ cto.color === "#00ff00" ? "$" : "#" }}{{ cto.name }}
      </p>
      <div>
        <v-btn
          icon="mdi-map-marker"
          :color="userLocation ? 'red' : ''"
          variant="text"
          @click="handleUserLocation"
        />
        <v-btn variant="text" :disabled="true" @click="setViewMode">
          <v-icon>mdi-connection</v-icon>
        </v-btn>
        <v-btn
          v-if="slideNumber < 2"
          icon="mdi-account-plus"
          variant="plain"
          @click="slideNumber++"
        />
        <v-btn
          v-else
          icon="mdi-chevron-left"
          variant="plain"
          @click="slideNumber--"
        />
        <v-btn
          v-if="slideNumber < 2"
          variant="plain"
          :icon="`${isMapVisible ? 'mdi-eye' : 'mdi-eye-off'}`"
          @click="isMapVisible = !isMapVisible"
        />
        <v-btn variant="plain" icon="mdi-close" @click="closeDialog" />
      </div>
    </v-card-title>
    <v-card-subtitle class="mt-3 font-weight-bold"
      >{{ cto.city == "ZCLIENTES NÃO VERIFICADOS" ? "ARARICA" : cto.city }}
      |
      <span :class="freePorts.freePorts <= 0 ? 'text-error' : 'text-success'">
        PORTAS {{ freePorts.totalPorts }} VAGAS
        {{ freePorts.freePorts < 0 ? 0 : freePorts.freePorts }}
      </span>
    </v-card-subtitle>

    <CtoMap
      :center="mapCenter"
      :key="mapKey"
      :ctoPosition="center"
      :clients="clientsWithLocation"
      :userLocation="userLocation"
      :openGmapTab="openNewGMapTab"
      :slideNumber="slideNumber"
      :isMapVisible="isMapVisible || slideNumber == 2"
      @positionSelected="onPositionSelected"
      @clientPositionSelected="onClientLocationUpdated"
      @clientRemoved="onClientLocationRemoved"
    />

    <v-window v-model="slideNumber" class="overflow-auto">
      <v-window-item :value="1">
        <v-card-text class="pa-5">
          <template v-if="!isDataLoading">
            <template v-if="!showOnuCard">
              <CtoClientsList
                v-if="clients.length > 0"
                :clients="clients"
                :cto="cto.id"
                :clients-with-location="clientsWithLocation"
                @adduser:location="(client) => addUserLocation(client)"
                @delete-user="loadCtoData"
                @open:location="(location) => openNewGMapTab(location)"
              />
              <v-sheet
                :height="400"
                v-else
                class="d-flex flex-column justify-center align-center"
              >
                <v-icon size="200px">mdi-account-group</v-icon>
                <p class="text-button">Nenhum cliente cadastrado</p>
              </v-sheet>
              <CtoNotes
                :notes="ctoNotes"
                :ctoId="cto.id"
                @reload-notes="onNotesReload"
                :key="notesKey"
              />
            </template>
          </template>
          <v-sheet
            v-else
            :height="400"
            class="d-flex justify-center align-center"
          >
            <v-progress-circular
              color="orange"
              indeterminate
              :size="128"
              :width="6"
            ></v-progress-circular>
          </v-sheet>
        </v-card-text>
      </v-window-item>
      <v-window-item :value="2">
        <v-card-text>
          <AddClientForm
            :clientPosition="positionClicked"
            :cto="cto"
            :splitter="getSplitterPortStatus"
            @update-cto-clietns="loadCtoData({ slide: true })"
          />
        </v-card-text>

        <v-card-actions class="d-flex justify-space-between mt-4 px-6">
          <v-btn
            color="blue"
            prepend-icon="mdi-chevron-left"
            variant="tonal"
            class="mb-2"
            @click="slideNumber--"
            >Voltar</v-btn
          >
        </v-card-actions>
      </v-window-item>
      <v-window-item :value="3">
        <CtoConectors :cto="cto" />
      </v-window-item>
      <v-window-item :value="4" v-if="apConnList.length > 0">
        <CeCard
          :ce="apConnList"
          @new-cto-selected="(ctoData) => emit('setCtoFromChild', ctoData)"
        ></CeCard>
      </v-window-item>
    </v-window>
    <v-card-actions v-if="slideNumber == 1">
      <v-btn
        block
        variant="tonal"
        color="primary"
        @click="showOnuCard = !showOnuCard"
      >
        verfificar sinal
      </v-btn>
    </v-card-actions>
    <ClientesOnuCard
      v-if="showOnuCard"
      :clients="cto.clients"
      @exit="showOnuCard = false"
    >
      <template #header>
        <span class="d-none"></span>
      </template>
    </ClientesOnuCard>
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
