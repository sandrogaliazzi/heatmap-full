<script setup>
import { ref, onMounted } from "vue";
import TechItem from "./ControlView.vue";
import { useOsStore } from "@/stores/osStore";

const osStore = useOsStore();
const vehicleList = ref([]);

const open = ref(["Ordens", "Vehicles"]);
const emit = defineEmits(["toggleVehicle", "setMapCenter"]);

const { getVehicleList } = defineProps({
  getVehicleList: {
    type: Function,
    required: false,
    default: () => {},
  },
  visibleVehicles: {
    type: Object,
    required: true,
  },
});

onMounted(() => {
  getVehicleList(vehicleList);
});
</script>
<template>
  <v-navigation-drawer location="right" v-model="osStore.drawer" :width="400">
    <v-list v-model:opened="open">
      <v-list-group value="Ordens">
        <template #activator="{ props }">
          <v-list-item
            prepend-icon="mdi-flag-variant"
            v-bind="props"
            title="Ordens"
          ></v-list-item>
        </template>
        <v-list-item
          v-for="(tecnico, index) in osStore.osList"
          :key="index"
          :title="tecnico.tecnico"
        >
          <template #prepend>
            <data class="rounded-circle pa-2 me-2 bg-white">
              <v-icon :color="osStore.cores[tecnico.tecnico]"
                >mdi-flag-variant</v-icon
              >
            </data>
          </template>
          <template #append>
            <TechItem
              @toggle-visibility="osStore.toggleVisibility(tecnico.tecnico)"
              :isVisible="osStore.visibleOs[tecnico.tecnico]"
            />
          </template>
        </v-list-item>
      </v-list-group>
      <v-list-group value="Vehicles">
        <template #activator="{ props }">
          <v-list-item
            prepend-icon="mdi-shield-car"
            v-bind="props"
            title="Veículos"
          ></v-list-item>
        </template>
        <v-list-item
          v-for="vehicle in vehicleList"
          :key="vehicle.ras_vei_placa"
          :title="vehicle.ras_vei_veiculo"
          :subtitle="vehicle.ras_vei_placa"
        >
          <template #prepend>
            <v-btn
              icon="mdi-google-maps"
              variant="text"
              class="me-2"
              color="red"
              @click="emit('setMapCenter', vehicle)"
            ></v-btn>
          </template>
          <template #append>
            <TechItem
              @toggle-visibility="emit('toggleVehicle', vehicle.ras_vei_placa)"
              :isVisible="visibleVehicles[vehicle.ras_vei_placa]"
            />
          </template>
        </v-list-item>
      </v-list-group>
    </v-list>
  </v-navigation-drawer>
</template>
