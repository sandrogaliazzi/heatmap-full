<script setup>
import { toRefs, ref, watch, computed } from "vue";

import ctoIcon from "@/assets/ctoconect.png";
import personIcon from "@/assets/personIcon.png";

const props = defineProps([
  "isMapVisible",
  "center",
  "ctoPosition",
  "userLocation",
  "clients",
  "serviceLocation",
]);
const emit = defineEmits([
  "positionSelected",
  "clientPositionSelected",
  "clientRemoved",
]);

const { isMapVisible, center, ctoPosition, userLocation, clients } =
  toRefs(props);

const mapRef = ref(null);
const infoWindowId = ref(null);
const showAllInfoWindow = ref(true);
const positionClicked = ref(null);

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

const onMapClick = (position, drag) => {
  if (!drag) positionClicked.value = position;
  emit("positionSelected", position);
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
        <GMapMarker
          v-if="serviceLocation"
          :position="{
            lat: serviceLocation.latitude,
            lng: serviceLocation.longitude,
          }"
          :draggable="true"
          @dragend="(event) => onMapClick(event.latLng.toJSON(), true)"
        />
        <template v-if="hasLocatedClients">
          <GMapMarker
            v-for="client in locatedClients"
            :key="client.id"
            :position="client.position.value"
            :title="client.name"
            :icon="personIcon"
            @click="infoWindowId = client.id"
          >
            <GMapInfoWindow
              :opened="infoWindowId === client.id"
              :closeclick="true"
              @closeclick="infoWindowId = null"
            >
              <div>
                <span
                  class="text-grey-darken-3 font-weight-bold text-center"
                  style="font-size: 10px"
                  >{{ client.name }}</span
                >
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
