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
const conectors = ref([]);
const apConnList = ref([]);

const slideNumber = ref(1);

const saveNote = async (note) => {
  try {
    const response = await fetchApi.post("/notes", note);

    const savedNote = response.data;
    return savedNote; // Optionally return the saved note data
  } catch (error) {
    console.error("Erro ao salvar nota:", error);
    throw error; // Re-throw the error for potential handling in calling code
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

const getMkRetiradasDeConector = async (cto) => {
  const response = await fetchApi(
    `/listar-os-retiradas-conector/${cto.name}/${cto.city}`
  );

  return response.data;
};

onMounted(async () => {
  conectors.value = await getMkRetiradasDeConector(cto);

  const response = await fetchApi("connections/" + cto.id);

  apConnList.value = response.data;

  await processAndSaveTomodatNotes(response.data);

  ctoNotes.value = await fetchNotes();
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

const getSplitterPortStatus = computed(() => {
  if (!cto || !cto.percentage_free) {
    return { status: { error: true }, msg: "Erro ao calcular informações!" };
  }

  const percentageFree = parseInt(cto.percentage_free);

  if (percentageFree === 100)
    return { status: { isEmpty: true }, msg: "CTO vazia" };

  const occupiedPortsPercentage = 100 - percentageFree;

  if (occupiedPortsPercentage === 100)
    return { status: { isFull: true }, msg: "CTO Lotada" };

  const totalClients = cto.clients.length ? cto.clients.length : 0;

  const totalPorts = Math.ceil((100 * totalClients) / occupiedPortsPercentage);
  const freePorts = totalPorts - totalClients;

  return { status: { hasFreePorts: true }, freePorts, totalPorts };
});

const handleSplliterStatus = computed(() => {
  const { status, msg, freePorts, totalPorts } = getSplitterPortStatus.value;

  const className =
    status.error || status.isFull ? "text-error" : "text-success";
  const statusMsg = status.hasFreePorts
    ? `Portas: ${totalPorts} Vagas: ${freePorts}`
    : msg;

  return { className, statusMsg };
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

const clientLocationExists = async (clientName) => {
  try {
    const response = await fetchApi.post("/ctoclientid", {
      cto_id: cto.id,
      name: clientName,
    });

    return response.status === 200 ? true : false;
  } catch (e) {
    return false;
  }
};

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

const setMapCenter = (position) => {
  mapCenter.value = position;
};

const createMarker = (client) => {
  if (client.position.value) {
    setMapCenter(client.position.value);
  } else {
    const { lat, lng } = cto.coord;
    cto.clients.find((c) => c === client).position.value = {
      lat: +lat,
      lng: +lng,
    };
  }
};

const deleteClientLocation = (id) => {
  try {
    return fetchApi.delete(`/deletectoclient/${id}`);
  } catch (e) {
    return false;
  }
};

const onClientRemoved = async (id) => {
  if (confirm("deseja remover a localização deste cliente?")) {
    const client = cto.clients.find((c) => c.id === id);

    const hasLocationId = client.position.value._id;

    if (hasLocationId /*TEM LOCALIZAÇÃO NO BANCO*/) {
      const isDeleted = await deleteClientLocation(hasLocationId);
      client.position.value = false;
      return isDeleted
        ? alert("deleteado com sucesso")
        : alert("erro ao deletar cliente");
    } else client.position.value = false;
  }
};

const setViewMode = () => {
  if (slideNumber.value === 1) slideNumber.value = 3;
  else slideNumber.value = 1;
};

const onClientPositionSelected = async ({ client, position }) => {
  if (!(await clientLocationExists(client.name))) {
    const locationSaved = await saveClientLocation(client, position);

    if (locationSaved.status === 201)
      alert("Localização adicionada com sucesso");
    else alert("erro ao adicionar localização");
  }
};
</script>

<template>
  <v-card class="rounded-md-lg">
    <v-card-title
      class="d-flex justify-space-between align-center border-b bg-orange"
    >
      <p style="cursor: pointer" @click="openNewGMapTab(cto.coord)">
        #{{ cto.name }}
      </p>
      <div>
        <v-btn
          icon="mdi-map-marker"
          :color="userLocation ? 'red' : ''"
          variant="text"
          @click="handleUserLocation"
        />
        <v-btn variant="text" @click="setViewMode">
          <v-badge color="error" :content="conectors.length" floating>
            <v-icon>mdi-connection</v-icon>
          </v-badge>
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
      <span :class="handleSplliterStatus.className">
        {{ handleSplliterStatus.statusMsg.toLocaleUpperCase() }}
      </span>
    </v-card-subtitle>

    <CtoMap
      :center="mapCenter"
      :ctoPosition="center"
      :clients="cto.clients"
      :userLocation="userLocation"
      :openGmapTab="openNewGMapTab"
      :slideNumber="slideNumber"
      :isMapVisible="isMapVisible || slideNumber == 2"
      @positionSelected="onPositionSelected"
      @clientPositionSelected="onClientPositionSelected"
      @clientRemoved="onClientRemoved"
    />

    <v-window v-model="slideNumber" class="overflow-auto">
      <v-window-item :value="1">
        <v-card-text class="pa-5" v-if="!showOnuCard">
          <CtoClientsList
            :clients="cto.clients"
            @adduser:location="(client) => createMarker(client)"
          />
          <CtoNotes
            :notes="ctoNotes"
            :ctoId="cto.id"
            @reload-notes="onNotesReload"
            :key="notesKey"
          />
        </v-card-text>
      </v-window-item>
      <v-window-item :value="2">
        <v-card-text>
          <AddClientForm
            :clientPosition="positionClicked"
            :cto="cto"
            :splitter="getSplitterPortStatus"
            @slide-back="slideNumber--"
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
        <CtoConectors
          :conector-os-list="conectors"
          :cto="cto.name"
          v-if="conectors.length > 0"
        />
        <v-card
          v-else
          class="py-5"
          title="NÃO HÁ RETIRADAS DE CONECTOR"
        ></v-card>
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
