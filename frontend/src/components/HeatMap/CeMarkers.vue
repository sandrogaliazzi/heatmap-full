<script setup>
import fetchApi from "@/api";

const props = defineProps({
  markers: Array, //Lista de Marcadores
});

const getCon = async (id) => {
  const response = await fetchApi("connections/" + id);
  console.log(response.data);
};
const emit = defineEmits(["open:ceDialog"]);

import ceIcon from "@/assets/ce.png";

// const handleMarkerClick = (event, marker) => {
//   if (!event.domEvent.altKey) {
//     emit("open:ctoDialog", marker.id);
//   } else {
//     emit("open:sideBar", [marker]);
//   }
// };
</script>

<template>
  <GMapMarker
    v-for="(marker, index) in markers"
    :key="index"
    :title="marker.title"
    :position="marker.position"
    :icon="ceIcon"
    :clickable="true"
    @click="emit('open:ceDialog', marker.id)"
  />
</template>
