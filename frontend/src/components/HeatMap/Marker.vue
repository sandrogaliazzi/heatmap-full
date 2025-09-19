<script setup>
import { defineProps, defineEmits } from "vue";
import { useTomodatStore } from "@/stores/tomodat";
import { getClientes } from "./util";

import ctoIcon from "@/assets/ctoconect.png";
import ctoFullIcon from "@/assets/ctofull.png";
import ceIcon from "@/assets/CE-2.png";

const tomodatStore = useTomodatStore();

const isMarkerVisible = (marker) => {
  const multiples = tomodatStore.queryCto.toUpperCase().split(",");

  if (multiples.length > 1) {
    return multiples.some((query) => marker.title.startsWith(query));
  } else {
    return marker.title.startsWith(tomodatStore.queryCto.toUpperCase());
  }
};

const props = defineProps({
  markers: Array, //Lista de Marcadores
});

const isICon = (ap) => {
  if (ap.category == 4)
    return { icon: ceIcon, scaledSize: { width: 35, height: 30 } };
  else {
    if (ap.percentage_free == 0)
      return { icon: ctoFullIcon, scaledSize: { width: 25, height: 30 } };
    else return { icon: ctoIcon, scaledSize: { width: 25, height: 30 } };
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
    :icon="{
      url: isICon(marker).icon,
      scaledSize: isICon(marker).scaledSize,
    }"
    :clickable="true"
    @click="handleMarkerClick($event, marker)"
    :visible="isMarkerVisible(marker)"
  />
</template>
