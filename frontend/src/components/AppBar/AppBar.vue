<script setup>
import { useHeatMapStore } from "@/stores/heatmap";
import { useTomodatStore } from "@/stores/tomodat";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { ref, computed } from "vue";

import SideNavList from "./SideNavList";
import ButtonGroup from "./ButtonGroup";
import { useWindowSize } from "vue-window-size";

const isSearchBarVisible = ref(false);
const isCtoMarkerVisible = ref(false);
const drawer = ref(false);
const logoutDialog = ref(false);

const heatmapStore = useHeatMapStore();
const tomodatStore = useTomodatStore();
const userStore = useUserStore();
const { width } = useWindowSize();

const router = useRouter();

const { selectedCto, selectedUserLocation, setPolygonDrawMode } =
  storeToRefs(tomodatStore);

const isMobile = computed(() => width.value <= 600);

const logout = () => {
  userStore.logout();
  router.push({ name: "Login" });
};

//watch(selectedCto, () => (drawer.value = false));

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
  <!-- Logout dialog -->

  <v-dialog v-model="logoutDialog">
    <v-card title="encerrar sessão?" width="400" class="mx-auto">
      <v-card-actions>
        <v-btn variant="text" color="error" @click="logout">Sim</v-btn>
        <v-btn variant="text" @click="logoutDialog = false">cancelar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-app-bar>
    <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
    <v-app-bar-title>
      <v-btn variant="text" href="/heatmap">HeatMap</v-btn>
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
  <v-navigation-drawer
    :expand-on-hover="!isMobile"
    :rail="!isMobile"
    :permanent="!isMobile"
    v-model="drawer"
  >
    <ButtonGroup
      :isCtoMarkerVisible="isCtoMarkerVisible"
      :setPolygonDrawMode="setPolygonDrawMode"
      @toggleMarkers="toggleCtoMarkers"
      @toggleDrawMode="() => (setPolygonDrawMode = !setPolygonDrawMode)"
      v-role="['adm', 'tecnico', 'vendas']"
    />
    <SideNavList @logout:user="logoutDialog = true" :user="userStore.user" />
  </v-navigation-drawer>
</template>
