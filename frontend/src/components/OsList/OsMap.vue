<script setup>
import { inject, ref, onUnmounted } from "vue";
import fetchApi from "@/api";
import OsList from "../OsList/OsList.vue";
import Vehicle from "./Vehicle.vue";
import TechList from "./SideBar.vue";
import OsModal from "./OsModal.vue";
import OsFilter from "./OsFilter.vue";
import { useOsStore } from "@/stores/osStore";

const isLoadingVehicle = ref(true);

const vehicleList = ref([]);
const mapCenter = ref({
  lat: -29.67523007459448,
  lng: -50.87956603814547,
});

const osStore = useOsStore();
const isOsModalOpen = ref(false);
const selectedOs = ref({});

const mapZoom = ref(10);

const STORAGE_KEY = "vehicle_visibility";

const loadVisibility = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return false;
  }
};

const saveVisibility = (state) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

const visibleVehicles = ref(loadVisibility());

const getLastVehiclePosition = async (ref) => {
  try {
    const response = await fetchApi(`vehicles`);

    isLoadingVehicle.value = false;

    if (response.status === 200) {
      ref.value = response.data.sort((a, b) => {
        return a.ras_vei_veiculo - b.ras_vei_veiculo;
      });

      response.data.forEach((v) => {
        if (visibleVehicles.value[v.ras_vei_placa] === undefined) {
          visibleVehicles.value[v.ras_vei_placa] = true;
        }
      });

      saveVisibility(visibleVehicles.value);
    } else {
      console.error(response);
    }
  } catch (error) {
    alert("Não foi possível obter a localização dos veículos");
    throw new Error("Erro api fulltrack " + error);
  }
};

const toggleVehicleVisibility = (placa) => {
  visibleVehicles.value[placa] = !visibleVehicles.value[placa];
};

const setMapCenter = (vehicle) => {
  mapCenter.value = {
    lat: parseFloat(vehicle.ras_eve_latitude),
    lng: parseFloat(vehicle.ras_eve_longitude),
  };
  mapZoom.value = 24;
};

const updateVehiclePosition = setInterval(async () => {
  await getLastVehiclePosition(vehicleList);
}, 5000);

onUnmounted(() => {
  clearInterval(updateVehiclePosition);
  console.log("contador zerado");
});

const closeDialog = inject("closeDialog");
</script>
<template>
  <v-card :loading="isLoadingVehicle">
    <v-toolbar color="orange">
      <v-btn icon="mdi-close" @click="closeDialog"></v-btn>

      <v-toolbar-title>Mapa Veículos</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-toolbar-items>
        <v-btn text="Atualizar" variant="text"></v-btn>
      </v-toolbar-items>
    </v-toolbar>

    <OsFilter />

    <v-divider></v-divider>

    <OsModal v-model="isOsModalOpen" :os="selectedOs" />
    <GMapMap
      :center="mapCenter"
      :zoom="mapZoom"
      class="w-100 h-100"
      ref="mapRef"
    >
      <Vehicle :vehicleList="vehicleList" :visibleVehicles="visibleVehicles" />
      <OsList
        @open-os-modal="
          isOsModalOpen = true;
          selectedOs = $event;
        "
      />
    </GMapMap>

    <TechList
      :getVehicleList="getLastVehiclePosition"
      :visibleVehicles="visibleVehicles"
      @toggle-vehicle="toggleVehicleVisibility($event)"
      @set-map-center="setMapCenter($event)"
    />
  </v-card>
</template>
