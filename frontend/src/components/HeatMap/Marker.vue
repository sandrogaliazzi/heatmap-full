<script setup>
import { defineProps, defineEmits } from "vue";
import { useTomodatStore } from "@/stores/tomodat";
import { getClientes } from "./util";

import ctoIcon from "@/assets/ctoconect.png";
import ctoFullIcon from "@/assets/ctofull.png";
import ceIcon from "@/assets/ce.png";

const tomodatStore = useTomodatStore();

const isMarkerVisible = (marker) => {
  const multiples = tomodatStore.queryCto.toUpperCase().split(",");

  if (multiples.length > 1) {
    return multiples.some((query) => marker.title.includes(query));
  } else {
    return marker.title.includes(tomodatStore.queryCto.toUpperCase());
  }
};

const props = defineProps({
  markers: Array, //Lista de Marcadores
});

const isICon = (ap) => {
  if (ap.category == 4) return ceIcon;
  else {
    if (ap.percentage_free == 0) return ctoFullIcon;
    else return ctoIcon;
  }
};

const emit = defineEmits([
  "open:ctoDialog",
  "open:sideBar",
  "open:ceDialog",
  "open:viabilityDialog",
]);

const handleMarkerClick = async (event, marker) => {
  if (marker.category) {
    if (event.domEvent.altKey) {
      const clients = await getClientes(marker);
      marker.clients = clients;
      emit("open:sideBar", [marker]);
    } else emit("open:ctoDialog", marker);
    return;
  } else {
    emit("open:viabilityDialog", marker);
  }
};
</script>

<template>
  <GMapMarker
    v-for="(marker, index) in markers"
    :key="index"
    :title="marker.title"
    :position="marker.position"
    :icon="isICon(marker)"
    :clickable="true"
    @click="handleMarkerClick($event, marker)"
    :visible="isMarkerVisible(marker)"
  />
</template>
