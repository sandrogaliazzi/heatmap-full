<script setup>
import { useHeatMapStore } from "@/stores/heatmap";
import { useTomodatStore } from "@/stores/tomodat";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { ref, watch } from "vue";

import SideNavList from "./SideNavList";
import ButtonGroup from "./ButtonGroup";

const isSearchBarVisible = ref(false);
const isCtoMarkerVisible = ref(false);
const drawer = ref(false);

const heatmapStore = useHeatMapStore();
const tomodatStore = useTomodatStore();
const userStore = useUserStore();

const router = useRouter();

const { selectedCto, selectedUserLocation, setPolygonDrawMode } =
  storeToRefs(tomodatStore);

const logout = () => {
  userStore.logout();
  router.push({ name: "Login" });
};

watch(selectedCto, () => (drawer.value = false));

const toggleCtoMarkers = () => {
  tomodatStore.toggleMarkers();
  isCtoMarkerVisible.value = !isCtoMarkerVisible.value;
};

const { isHeatMapVisible } = storeToRefs(heatmapStore);

const onAppBarIconClick = () => heatmapStore.toggleHeatMap();

const handleUserLocation = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (selectedUserLocation.value) selectedUserLocation.value = null;
      else selectedUserLocation.value = pos;
    },
    (error) => {
      console.log(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
};
</script>

<template>
  <v-app-bar>
    <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
    <v-app-bar-title>
      <v-btn variant="text" href="/heatmap">Heatmap teste</v-btn>
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <!-- SEARCHBAR -->
    <v-slide-x-reverse-transition>
      <v-responsive max-width="150px" class="mr-3" v-if="isSearchBarVisible">
        <v-text-field
          v-model="tomodatStore.queryCto"
          density="compact"
          variant="outlined"
          label="Buscar Cto"
          single-line
          hide-details
          max-width="150px"
        ></v-text-field>
      </v-responsive>
    </v-slide-x-reverse-transition>

    <v-btn icon @click="isSearchBarVisible = !isSearchBarVisible">
      <v-icon>mdi-magnify</v-icon>
    </v-btn>
    <v-btn icon @click="onAppBarIconClick">
      <v-icon :color="isHeatMapVisible ? 'orange' : ''">mdi-fire-circle</v-icon>
    </v-btn>
    <v-btn
      icon="mdi-map-marker-account"
      variant="text"
      @click="handleUserLocation"
      :color="selectedUserLocation ? 'red' : ''"
    >
    </v-btn>
  </v-app-bar>

  <!-- DRAWER -->
  <v-navigation-drawer v-model="drawer" temporary>
    <ButtonGroup
      :isCtoMarkerVisible="isCtoMarkerVisible"
      :setPolygonDrawMode="setPolygonDrawMode"
      @toggleMarkers="toggleCtoMarkers"
      @toggleDrawMode="() => (setPolygonDrawMode = !setPolygonDrawMode)"
    />
    <SideNavList @logout:user="logout" :user="userStore.user" />
  </v-navigation-drawer>
  <v-progress-linear
    v-if="tomodatStore.loadingData"
    color="primary"
    indeterminate
  ></v-progress-linear>
</template>
