<script setup>
import { ref, watch } from "vue";
import { useTomodatStore } from "@/stores/tomodat";

const { isCtoMarkerVisible, setPolygonDrawMode } = defineProps([
  "isCtoMarkerVisible",
  "setPolygonDrawMode",
]);
const emit = defineEmits(["toggleDrawMode"]);

const tomodatStore = useTomodatStore();

const cto = ref(false);
const ce = ref(false);
const markersVisibility = ref({ cto: false, ce: false });

const updateFilter = (filter) => (tomodatStore.queryCto = filter);

watch(markersVisibility, () => {
  const { ce, cto } = markersVisibility.value;
  if (!ce && !cto) updateFilter("123456"); //Número aleatório para não cair no filtro
  if (!ce && cto) updateFilter("R");
  if (ce && !cto) updateFilter("CE,CD");
  if (ce && cto) updateFilter("CE,CD,R");
});

const toggleMarkers = (marker) => {
  if (marker == "cto") {
    cto.value = !cto.value;
    markersVisibility.value = {
      cto: cto.value,
      ce: ce.value,
    };
  } else if (marker == "ce") {
    ce.value = !ce.value;
    markersVisibility.value = {
      cto: cto.value,
      ce: ce.value,
    };
  }
};
</script>
<template>
  <div class="d-flex justify-center my-5">
    <v-btn icon @click="emit('toggleDrawMode')">
      <v-icon :color="setPolygonDrawMode ? 'success' : ''"
        >mdi-map-marker-path</v-icon
      >
    </v-btn>
    <v-btn icon @click="toggleMarkers('cto')">
      <v-icon :color="cto ? 'blue' : ''">mdi-cube</v-icon>
    </v-btn>
    <v-btn icon @click="toggleMarkers('ce')">
      <v-icon :color="ce ? 'blue' : ''">mdi-chess-rook</v-icon>
    </v-btn>
    <v-btn icon>
      <v-icon
        :color="tomodatStore.isCableVisible ? 'blue' : ''"
        @click="tomodatStore.isCableVisible = !tomodatStore.isCableVisible"
        >mdi-cable-data</v-icon
      >
    </v-btn>
    <v-btn
      icon
      @click="
        tomodatStore.isEventMarkerVisible = !tomodatStore.isEventMarkerVisible
      "
    >
      <v-icon>{{
        tomodatStore.isEventMarkerVisible ? "mdi-alert" : "mdi-alert-outline"
      }}</v-icon>
    </v-btn>
  </div>
</template>
