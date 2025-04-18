<script setup>
import { toRefs, ref, watch, computed } from "vue";

import ctoIcon from "@/assets/ctoconect.png";
import personIcon from "@/assets/personIcon.png";

const props = defineProps([
  "isMapVisible",
  "center",
  "openGmapTab",
  "ctoPosition",
  "slideNumber",
  "userLocation",
  "clients",
]);
const emit = defineEmits([
  "positionSelected",
  "clientPositionSelected",
  "clientRemoved",
]);

const {
  isMapVisible,
  center,
  openGmapTab,
  ctoPosition,
  slideNumber,
  userLocation,
  clients,
} = toRefs(props);

const mapRef = ref(null);
const infoWindowId = ref(null);
const showAllInfoWindow = ref(true);
const positionClicked = ref(null);
const isDraggable = ref(false);

const locatedClients = computed(() => {
  return clients.value.map((client) => ({
    id: client._id,
    name: client.name,
    position: { value: { lat: +client.lat, lng: +client.lng } },
  }));
});

const hasLocatedClients = computed(() => {
  return !locatedClients.value.length ? false : true;
});

const isClientMarkersVisible = computed(() =>
  slideNumber.value === 1 ? true : false
);

const onMapClick = (position) => {
  positionClicked.value = position;
  emit("positionSelected", position);
};

const handleMarkerDrop = (event, client) => {
  if (confirm("Confirmar Localização do cliente?")) {
    emit("clientPositionSelected", {
      client,
      position: event.latLng.toJSON(),
    });
  }
};

watch(mapRef, (googleMaps) => {
  if (googleMaps) {
    googleMaps.$mapPromise.then((mapInstance) => {
      mapInstance.addListener("click", (mapsMouseEvent) => {
        onMapClick(mapsMouseEvent.latLng.toJSON());
      });
    });
  }
});

watch(isMapVisible, () => (positionClicked.value = null));
</script>

<template>
  <v-expand-transition>
    <div class="mt-4 mapDiv px-5" v-if="isMapVisible">
      <GMapMap
        :center="center"
        :zoom="18"
        ref="mapRef"
        map-type-id="satellite"
        style="width: 100%; height: 16rem; border-radius: 20px"
      >
        <GMapMarker
          :position="ctoPosition"
          :icon="ctoIcon"
          :clickable="true"
          @click="showAllInfoWindow = !showAllInfoWindow"
        />
        <GMapMarker
          v-if="userLocation"
          :position="{
            lat: userLocation.latitude,
            lng: userLocation.longitude,
          }"
          :animation="1"
        />
        <template v-if="hasLocatedClients && isClientMarkersVisible">
          <GMapMarker
            v-for="client in locatedClients"
            :key="client.id"
            :position="client.position.value"
            :title="client.name"
            :icon="personIcon"
            :draggable="isDraggable"
            @dragend="handleMarkerDrop($event, client)"
            @click="infoWindowId = client.id"
          >
            <GMapInfoWindow
              :opened="infoWindowId === client.id"
              :closeclick="true"
              @closeclick="infoWindowId = null"
            >
              <div class="d-flex flex-column">
                <span
                  class="text-grey-darken-3 font-weight-bold text-center"
                  style="font-size: 10px"
                  >{{ client.name }}</span
                >

                <div class="d-flex justify-center my-1">
                  <v-btn
                    size="x-small"
                    icon
                    :color="isDraggable ? 'blue' : 'grey'"
                    class="mt-2 mr-2"
                    @click="isDraggable = !isDraggable"
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                    size="x-small"
                    icon
                    color="success"
                    class="mt-2"
                    @click="openGmapTab(client.position.value)"
                  >
                    <v-icon>mdi-google-maps</v-icon>
                  </v-btn>
                  <v-btn
                    size="x-small"
                    icon
                    color="red"
                    class="mt-2 ml-2"
                    @click="emit('clientRemoved', client.id)"
                  >
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
              </div>
            </GMapInfoWindow>
          </GMapMarker>
        </template>
        <template v-if="positionClicked">
          <GMapMarker :position="positionClicked" />
        </template>
      </GMapMap>
    </div>
  </v-expand-transition>
</template>
