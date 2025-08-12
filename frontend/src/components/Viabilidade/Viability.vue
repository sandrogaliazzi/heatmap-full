<script setup>
import { ref } from "vue";
import Dialog from "./Dialog.vue";
import fetchApi from "@/api";
import CtoMarkers from "./CtoMarkers.vue";
import CtoList from "./CtoList.vue";
import ControlSet from "./ControlSet.vue";

const mapRef = ref(null);
const isActive = ref(true);
const userLocation = ref(null);
const zoom = ref(10);
const centerMap = ref({ lat: -29.67523007459448, lng: -50.87956603814547 });
const ctoList = ref([]);
const loadingData = ref(false);
const drawer = ref(false);
const range = ref(300);

const setUserLocation = async (location) => {
  userLocation.value = location;
  centerMap.value = {
    lat: location.latitude,
    lng: location.longitude,
  };
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
  <CtoList v-model="drawer" :ctoList="ctoList" />
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
    <CtoMarkers :ctoList="ctoList" v-if="ctoList.length > 0" />
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
</template>
