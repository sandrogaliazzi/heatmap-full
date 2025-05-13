<script setup>
import { ref, watch, onMounted } from "vue";
import { useTomodatStore } from "@/stores/tomodat.js";
import { useHeatMapStore } from "@/stores/heatmap";
import { useUserStore } from "@/stores/user.js";
import { storeToRefs } from "pinia";
import { getNewRadius } from "./HeatMap.js";
import warningIcon from "@/assets/warning-icon.png";
import EventForm from "./EventForm.vue";
import fetchApi from "@/api";

import CtoCard from "../CtoModalDialog/CtoCard.vue";
import DialogBox from "@/components/Dialog/Dialog.vue";
import Marker from "./Marker.vue";
import EventMarker from "./eventMarker.vue";
import RightSideBar from "./RightSidebar.vue";
import Cables from "./Cables.vue";
import CtoViability from "../CtoModalDialog/CtoViability.vue";

const store = useTomodatStore();
const {
  getHeatMapData,
  getMarkersData,
  getSelectedCtoPosition,
  selectedUserLocation,
  getSelectedUserPosition,
  isEventMarkerVisible,
  setPolygonDrawMode,
  mapZoom,
  cableList,
} = storeToRefs(store);
const { getCto, getTomodatData } = store;

const heatmapStore = useHeatMapStore();
const { isHeatMapVisible } = storeToRefs(heatmapStore);

const userStore = useUserStore();

const { user } = storeToRefs(userStore);

const mapRef = ref(null);
const heatMapRadius = ref(5);
const cto = ref({});
const ce = ref([]);
const openModal = ref(false);

const openEventModal = ref(false);
const eventWindow = ref(false);
const eventWindowLocation = ref(null);
const eventAction = ref("");
const events = ref([]);
const selectedEvent = ref({});
//side bar
const sideBar = ref(false);
const sideBarCtoList = ref([]);
//area do poligono
const areaCoordinates = ref([]);
const nextPoint = ref(0);

const openClientSignalModal = ref(false);

const showSideBar = async (ctoList) => {
  sideBar.value = true;
  ctoList.forEach((item) => {
    const cto = getCto(item.id);

    if (!sideBarCtoList.value.includes(cto)) {
      sideBarCtoList.value.push(cto);
    }
  });
  if (!ctoList.length) sideBar.value = false;
};

const onCloseDialog = (value) => {
  openModal.value = value;
  openEventModal.value = value;
  openClientSignalModal.value = value;
  viabilityModal.value = value;
};

const ctoKey = ref(1);

const getCtoById = (ctoMarker) => {
  if (ctoMarker.category == null) return;
  cto.value = getCto(ctoMarker.id);
  openModal.value = true;
};

const viabilityModal = ref(false);
const dot = ref({});

const showViability = (val) => {
  dot.value = val;
  viabilityModal.value = true;
};

// const changeCto = (newCtoData) => {
//   const ctoData = JSON.parse(newCtoData);
//   cto.value = getCto(ctoData.id);
//   ctoKey.value++;
// };

const getCeById = async (id) => {
  const response = await fetchApi("connections/" + id);
  ce.value = response.data;
  console.log(response.data);
};

const onCloseMarker = () => {
  openEventModal.value = false;
  eventWindowLocation.value = null;
  selectedEvent.value = {};
  eventAction.value = "";
};

import { setupContainsLatLng } from "./is-point-within-polygon.js";
const polygonRef = ref(null);

watch(polygonRef, (polygon) => {
  if (polygon) {
    polygon.$polygonPromise.then((area) => {
      const isWithinPolygon = getMarkersData.value.filter((marker) => {
        const multiples = store.queryCto.toUpperCase().split(",");

        if (multiples.length > 1) {
          return (
            area.containsLatLng(marker.position.lat, marker.position.lng) &&
            multiples.some((query) => marker.title.includes(query))
          );
        } else {
          return (
            area.containsLatLng(marker.position.lat, marker.position.lng) &&
            marker.title.includes(store.queryCto.toUpperCase())
          );
        }
      });

      showSideBar(isWithinPolygon);
    });
  }
});

watch(setPolygonDrawMode, (mode) => {
  if (!mode) {
    areaCoordinates.value = [];
    sideBar.value = false;
    sideBarCtoList.value = [];
  }
});

const setPlace = (place) => {
  const isCoordinates = /^(-?\d+(\.\d+)?)(?:,\s*|\s+)(-?\d+(\.\d+)?)$/;

  if (selectedUserLocation.value === null) selectedUserLocation.value = {};
  selectedUserLocation.value.coords = isCoordinates.test(place.name)
    ? {
        latitude: Number.parseFloat(place.name.split(" ")[0]),
        longitude: Number.parseFloat(place.name.split(" ")[1]),
      }
    : {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      };

  mapZoom.value = 18;
};

const copyPosition = () => {
  const { latitude, longitude } = selectedUserLocation.value.coords;
  navigator.clipboard.writeText(`${latitude} ${longitude}`);
  alert("Copiado coordenadas!");
};

watch(mapRef, (googleMap) => {
  if (googleMap) {
    googleMap.$mapPromise.then((map) => {
      getTomodatData(user.value);

      setupContainsLatLng();

      map.addListener("zoom_changed", () => {
        const zoom = map.getZoom();
        mapZoom.value = zoom;
        const center = map.getCenter();

        heatMapRadius.value = getNewRadius(zoom, center);
      });

      if (user.value.category !== "convidado") {
        map.addListener("rightclick", (mapsMouseEvent) => {
          eventWindowLocation.value = mapsMouseEvent.latLng.toJSON();
          eventWindow.value = true;
        });
      }

      map.addListener("click", (mapsMouseEvent) => {
        if (setPolygonDrawMode.value) {
          areaCoordinates.value.push(mapsMouseEvent.latLng.toJSON());
          nextPoint.value++;
        }
      });
    });
  }
});

//eventos
const onUpdateEvent = (event) => {
  selectedEvent.value = event.info;
  openEventModal.value = true;
  eventAction.value = event.action;
};

const loadEvents = async () => {
  try {
    const response = await fetchApi("/listevents");

    events.value = response.data;
  } catch (error) {
    throw error;
  }
};

const onReloadEvent = () => {
  loadEvents();
};

onMounted(async () => {
  setInterval(() => {
    loadEvents();
  }, 10000);
});
</script>

<template>
  <DialogBox :isOpen="openModal" @update:modalValue="onCloseDialog">
    <CtoCard
      :cto="cto"
      @set-cto-from-child="(cto) => changeCto(cto)"
      :key="ctoKey"
    />
  </DialogBox>

  <DialogBox :isOpen="viabilityModal" @update:modalValue="onCloseDialog">
    <CtoViability :dot="dot" />
  </DialogBox>

  <DialogBox :isOpen="openEventModal" @update:modalValue="onCloseDialog">
    <EventForm
      :event-locale="eventWindowLocation"
      :event="selectedEvent"
      :event-action="eventAction"
      @reload-events="onReloadEvent"
      @close-marker="onCloseMarker"
    />
  </DialogBox>

  <RightSideBar
    :side-bar="sideBar"
    :side-bar-cto-list="sideBarCtoList"
    v-model="sideBar"
    @clear-cto-list="sideBarCtoList = []"
  />
  <GMapAutocomplete
    style="width: 100%; padding: 10px; background-color: #212121"
    placeholder="Buscar Endereço"
    @place_changed="setPlace"
  >
  </GMapAutocomplete>

  <GMapMap
    :center="getSelectedUserPosition || getSelectedCtoPosition"
    :zoom="mapZoom"
    class="w-100"
    style="height: 90vh"
    ref="mapRef"
  >
    <GMapMarker
      v-if="getSelectedUserPosition"
      :animation="2"
      title="Você está aqui"
      @click="copyPosition"
      :clickable="true"
      :position="getSelectedUserPosition"
    ></GMapMarker>

    <GMapMarker
      v-if="eventWindowLocation"
      title="Adicionar Evento aqui"
      :icon="warningIcon"
      :position="eventWindowLocation"
      @click="eventWindow = !eventWindow"
    >
      <GMapInfoWindow :opened="eventWindow">
        <div class="d-flex flex-column ga-2">
          <v-btn @click="openEventModal = true">Criar evento</v-btn>
          <v-btn @click="eventWindowLocation = null">Cancelar</v-btn>
        </div>
      </GMapInfoWindow>
    </GMapMarker>

    <EventMarker
      v-if="events.length && user.category !== 'convidado'"
      :visible="isEventMarkerVisible"
      :event-markers="events"
      @update-event="(event) => onUpdateEvent(event)"
    />

    <Marker
      :markers="getMarkersData"
      @open:cto-dialog="getCtoById"
      @open:side-bar="(cto) => showSideBar(cto)"
      @open:ce-dialog="(id) => getCeById(id)"
      @open:viability-dialog="(cto) => showViability(cto)"
    />

    <Cables
      v-if="cableList.length > 0 && store.isCableVisible"
      :cables="cableList"
    />

    <GMapPolygon
      ref="polygonRef"
      :paths="areaCoordinates"
      :key="nextPoint"
    ></GMapPolygon>

    <div v-if="isHeatMapVisible">
      <GMapHeatmap
        :data="getHeatMapData"
        :options="{
          radius: heatMapRadius,
        }"
      />
    </div>
  </GMapMap>
</template>

<style scoped></style>
