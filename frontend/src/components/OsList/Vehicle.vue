<script setup>
import { ref } from "vue";
import vehicleOff from "@/assets/shield-car-custom-off.png";
import vehicleOn from "@/assets/shield-car-custom.png";
defineProps({
  vehicleList: {
    type: Array,
    required: true,
  },

  visibleVehicles: {
    type: Object,
    required: true,
  },
});
const markerId = ref(null);
</script>
<template>
  <GMapMarker
    v-for="(vehicle, index) in vehicleList"
    :key="vehicle.ras_vei_id"
    :icon="{
      url: vehicle.ras_eve_ignicao === '1' ? vehicleOn : vehicleOff,
      scaledSize: { width: 45, height: 45 },
    }"
    :position="{
      lat: parseFloat(vehicle.ras_eve_latitude),
      lng: parseFloat(vehicle.ras_eve_longitude),
    }"
    :visible="visibleVehicles[vehicle.ras_vei_placa]"
    :clickable="true"
    @click="markerId = index"
  >
    <GMapInfoWindow
      :closeclick="true"
      @closeclick="markerId = null"
      :opened="markerId === index"
    >
      <div class="d-flex flex-column align-center">
        <p class="text-black text-h6">
          {{ vehicle.ras_vei_veiculo }}
        </p>
        <p class="text-black">{{ vehicle.ras_vei_placa }}</p>
      </div>
    </GMapInfoWindow>
  </GMapMarker>
</template>
