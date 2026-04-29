<script setup>
import { ref, computed } from "vue";
import BottomSearch from "./BottomSearch.vue";
import { useHeatMapStore } from "@/stores/heatmap";
import { useWindowSize } from "vue-window-size";
import { useTomodatStore } from "@/stores/tomodat";
import { storeToRefs } from "pinia";

const tomodatStore = useTomodatStore();
const heatMapStore = useHeatMapStore();
const { setPolygonDrawMode } = storeToRefs(tomodatStore);

const { width } = useWindowSize();

const isDesktop = computed(() => width.value >= 1024);
const isMobile = computed(() => width.value < 600);

const isSearchOpen = ref(false);
const isOpen = ref(false);

const toggleCtoMarker = () => {
  tomodatStore.queryCto === "R"
    ? (tomodatStore.queryCto = "123456")
    : (tomodatStore.queryCto = "R");
};
</script>

<template>
  <BottomSearch v-model="isSearchOpen" :isDesktop="isDesktop" />
  <!-- <SpeedDial v-model="isOpen" /> -->
  <v-bottom-navigation v-if="isMobile">
    <v-btn
      value="ruler"
      @click="heatMapStore.togglePolyLineDrawingMode"
      :color="heatMapStore.isPolyLineDrawingMode ? 'orange' : ''"
    >
      <v-icon>mdi-ruler</v-icon>
    </v-btn>

    <v-btn
      value="cube"
      :color="tomodatStore.queryCto.startsWith('R') ? 'blue' : ''"
      @click="toggleCtoMarker"
    >
      <v-icon>mdi-cube</v-icon>
    </v-btn>

    <v-btn
      value="marker-path"
      @click="setPolygonDrawMode = !setPolygonDrawMode"
      :color="setPolygonDrawMode ? 'success' : ''"
    >
      <v-icon>mdi-map-marker-path</v-icon>
    </v-btn>

    <v-btn value="Pesquisar" @click="isSearchOpen = true">
      <v-icon>mdi-magnify</v-icon>
    </v-btn>
  </v-bottom-navigation>
</template>
