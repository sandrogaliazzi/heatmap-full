<script setup>
import { defineProps, defineEmits } from "vue";
import { useTomodatStore } from "@/stores/tomodat";

import ctoIcon from "@/assets/ctoconect.png";
import ctoFullIcon from "@/assets/ctofull.png";
import ctoWarning from "@/assets/ctowarning.png";
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
  else if(ap.color == "#ffff00") return ctoWarning;
  else {
    if (ap.percentage_free == 0) return ctoFullIcon;
    else return ctoIcon;
  }
};

const emit = defineEmits(["open:ctoDialog", "open:sideBar", "open:ceDialog"]);

const handleMarkerClick = (event, marker) => {
  if (marker.category == 4) {
    emit("open:ctoDialog", marker.id);
    return;
  }
  if (!event.domEvent.altKey) {
    emit("open:ctoDialog", marker.id);
  } else {
    emit("open:sideBar", [marker]);
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
