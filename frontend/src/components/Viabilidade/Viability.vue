<script setup>
import { ref, computed, watch } from "vue";
import Dialog from "./Dialog.vue";
import DialogBox from "../Dialog/Dialog.vue";
import fetchApi from "@/api";
import CtoMarkers from "./CtoMarkers.vue";
import CtoList from "./CtoList.vue";
import ControlSet from "./ControlSet.vue";
import ClientForm from "./ClientForm.vue";
import ReservadosList from "../Reservados/ReservadosList.vue";
import SearchCard from "../AppBar/SearchCard.vue";
import { useUserStore } from "@/stores/user";
import { useTomodatStore } from "@/stores/tomodat.js";
import { storeToRefs } from "pinia";

const mapRef = ref(null);
const isActive = ref(true);
const userLocation = ref(null);
const zoom = ref(10);
const centerMap = ref({ lat: -29.67523007459448, lng: -50.87956603814547 });
const ctoList = ref([]);
const loadingData = ref(false);
const drawer = ref(false);
const range = ref(300);
const selectedCto = ref(null);
const userStore = useUserStore();
const openUserReservados = ref(false);
const openSearch = ref(false);
const store = useTomodatStore();

const { getTomodatData } = store;
const { user } = storeToRefs(userStore);

const openClientForm = computed(() => {
  return selectedCto.value !== null;
});

const setUserLocation = async (location) => {
  userLocation.value = location;
  centerMap.value = {
    lat: location.latitude,
    lng: location.longitude,
  };
};

const handleRangeUpdate = (expand) => {
  range.value = expand ? (range.value += 100) : (range.value -= 100);
  handleLocationUpdate(userLocation.value, false);
};

const sortCtoListByDistance = (ctoList, userLocation) => {
  if (!google || !google.maps || !google.maps.geometry) {
    throw new Error(
      "Biblioteca 'geometry' do Google Maps não carregada. Ative com &libraries=geometry."
    );
  }
  const center = new google.maps.LatLng(
    userLocation.value.latitude,
    userLocation.value.longitude
  );

  return ctoList
    .map((cto) => ({
      ...cto,
      distance: google.maps.geometry.spherical.computeDistanceBetween(
        center,
        new google.maps.LatLng(+cto.dot.lat, +cto.dot.lng)
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
};

const handleLocationUpdate = async (location, markerUpdate) => {
  let latitude, longitude;
  if (markerUpdate) {
    latitude = location.latLng.lat();
    longitude = location.latLng.lng();
  } else {
    latitude = location.latitude;
    longitude = location.longitude;
  }
  isActive.value = false;
  loadingData.value = true;
  range.value = location.range || range.value;
  setUserLocation({ latitude, longitude });
  await getCtosWithFreePorts(latitude, longitude, range.value);
  zoom.value = 16;
  loadingData.value = false;
};

const filterFreePorts = (ctoList) => {
  return ctoList.filter((cto) => {
    return (
      cto.splitters.reduce((acc, cur) => acc + cur.free_ports_number, 0) > 0
    );
  });
};

const copyCoords = (coords) => {
  navigator.clipboard.writeText(coords.latitude + ", " + coords.longitude);
  alert("Coordenadas copiadas com sucesso!");
};

const getCtosWithFreePorts = async (latitude, longitude, range) => {
  try {
    const response = await fetchApi.get(
      `/viability/${latitude}/${longitude}/${range}`
    );
    if (response.data.length > 0) {
      ctoList.value = sortCtoListByDistance(
        filterFreePorts(response.data),
        userLocation
      );
      drawer.value = true;
    }
  } catch (error) {
    console.error(error);
  }
};

const loadingTomodat = ref(true);

watch(mapRef, (googleMap) => {
  if (googleMap) {
    googleMap.$mapPromise.then(async (map) => {
      console.log(user.value);
      await getTomodatData(user.value);
      loadingTomodat.value = false;
      map.addListener("click", (mapsMouseEvent) => {
        handleLocationUpdate(mapsMouseEvent, true);
      });
    });
  }
});
</script>

<template>
  <v-dialog v-model="loadingData">
    <div
      style="height: 100vh"
      class="d-flex flex-column ga-3 justify-center align-center"
    >
      <v-progress-circular
        color="orange"
        indeterminate
        :size="128"
        :width="6"
      ></v-progress-circular>
      <v-chip color="orange" variant="flat">Carregando dados...</v-chip>
    </div>
  </v-dialog>
  <v-dialog v-model="openClientForm" max-width="600">
    <ClientForm
      v-model="selectedCto"
      :location="userLocation"
      @update:cto-list="handleLocationUpdate(userLocation, false)"
    />
  </v-dialog>
  <CtoList
    v-model="drawer"
    :ctoList="ctoList"
    @select-cto="selectedCto = $event"
  />
  <v-toolbar color="orange">
    <v-toolbar-title>
      <div class="d-flex align-center ga-2">
        <span>Consulta de Viabilidade</span>
        <v-icon>mdi-account-question</v-icon>
      </div>
    </v-toolbar-title>
  </v-toolbar>
  <ControlSet
    @edit-location="isActive = true"
    @toggle-drawer="drawer = !drawer"
    @update:range="handleRangeUpdate"
    @update:list="handleLocationUpdate(userLocation, false)"
    @open:reservados-dialog="openUserReservados = true"
    @open:search="openSearch = true"
  />
  <GMapMap
    :center="centerMap"
    :zoom="zoom"
    ref="mapRef"
    style="height: 90vh; width: 100%"
  >
    <GMapMarker
      v-if="userLocation"
      :position="{
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      }"
      @click="copyCoords(userLocation)"
      :draggable="true"
      @dragend="handleLocationUpdate($event, true)"
    />
    <CtoMarkers
      :ctoList="ctoList"
      v-if="ctoList.length > 0"
      @select-cto="selectedCto = $event"
    />
    <GMapCircle
      v-if="userLocation"
      :radius="Number.parseInt(range)"
      :center="{
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      }"
    />
  </GMapMap>

  <Dialog
    v-model="isActive"
    width="600"
    @update:user-location="handleLocationUpdate"
  ></Dialog>
  <DialogBox
    :isOpen="openUserReservados"
    @update:modalValue="openUserReservados = $event"
  >
    <ReservadosList v-if="user" :user="user" />
  </DialogBox>
  <DialogBox :isOpen="openSearch" @update:modalValue="openSearch = $event">
    <SearchCard v-if="!loadingTomodat" />
    <v-card v-else>
      <v-card-title>Carregando dados, aguarde...</v-card-title>
      <v-card-text class="d-flex justify-center align-center">
        <v-progress-circular
          size="48"
          color="orange"
          indeterminate
        ></v-progress-circular>
      </v-card-text>
    </v-card>
  </DialogBox>
</template>
