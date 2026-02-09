<script setup>
import { ref, computed, defineExpose } from "vue";
import MapsControl from "./MapsControl.vue";
import { createApp } from "vue";

const path = ref([]);
const totalDistance = ref(0);

const options = {
  strokeColor: "#FF0000",
  strokeOpacity: 1.0,
  strokeWeight: 2,
};

function addPoint(latLng) {
  // latLng pode ser event.latLng (Google) ou { lat, lng }
  let newPoint;

  if (typeof latLng.lat === "function") {
    newPoint = {
      lat: latLng.lat(),
      lng: latLng.lng(),
    };
  } else {
    newPoint = latLng;
  }

  if (path.value.length > 0) {
    const last = path.value[path.value.length - 1];

    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(last.lat, last.lng),
      new google.maps.LatLng(newPoint.lat, newPoint.lng),
    );

    totalDistance.value += distance;
  }

  path.value.push(newPoint);
}

function onUndo() {
  if (path.value.length < 2) return;

  const last = path.value.pop();
  const prev = path.value[path.value.length - 1];

  const distance = google.maps.geometry.spherical.computeDistanceBetween(
    new google.maps.LatLng(prev.lat, prev.lng),
    new google.maps.LatLng(last.lat, last.lng),
  );

  totalDistance.value -= distance;
}

function onClear() {
  path.value = [];
  totalDistance.value = 0;
}

function setControls(map) {
  const centerControlDiv = document.createElement("div");
  const app = createApp(MapsControl, {
    onUndo,
    onClear,
    totalDistance,
  });
  app.mount(centerControlDiv);
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
}

const distanceKm = computed(() => (totalDistance.value / 1000).toFixed(2));

defineExpose({
  addPoint,
  onUndo,
  onClear,
  distanceKm,
  totalDistance,
  path,
  setControls,
});
</script>

<template>
  <GMapPolyline
    :path="path"
    :editable="true"
    :options="options"
    v-if="path.length > 0"
    :key="path.length"
  />
</template>
