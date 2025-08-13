<script setup>
import ctoIcon from "@/assets/ctoconect.png";

defineProps(["tomodat"]);
defineEmits(["handleMarkerDrop"]);
</script>

<template>
  <GMapMap
    style="width: 100%; height: 400px"
    v-if="tomodat.id"
    :center="{
      lat: Number.parseFloat(tomodat.dot.lat),
      lng: Number.parseFloat(tomodat.dot.lng),
    }"
    :zoom="18"
  >
    <GMapMarker
      :icon="ctoIcon"
      :position="{
        lat: Number.parseFloat(tomodat.dot.lat),
        lng: Number.parseFloat(tomodat.dot.lng),
      }"
      :title="tomodat.name"
    />
    <GMapMarker
      :title="tomodat.client"
      :position="{
        lat: Number.parseFloat(tomodat.latitude),
        lng: Number.parseFloat(tomodat.longitude),
      }"
      :draggable="true"
      @dragend="$emit('handleMarkerDrop', $event, tomodat)"
    />
  </GMapMap>
  <GMapMap
    v-else
    style="width: 100%; height: 400px"
    :center="{
      lat: Number.parseFloat(tomodat.coordenadas.latitude),
      lng: Number.parseFloat(tomodat.coordenadas.longitude),
    }"
    :zoom="12"
  >
    <GMapMarker
      :title="tomodat.client"
      :position="{
        lat: Number.parseFloat(tomodat.coordenadas.latitude),
        lng: Number.parseFloat(tomodat.coordenadas.longitude),
      }"
  /></GMapMap>
</template>
