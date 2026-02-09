<script setup>
import { useHeatMapStore } from "@/stores/heatmap";
const emit = defineEmits(["undo", "clear"]);
const props = defineProps({
  totalDistance: {
    type: Object,
    default: 0,
  },
});
const heatmapStore = useHeatMapStore();
</script>

<template>
  <div class="container" v-if="heatmapStore.isPolyLineDrawingMode">
    <div class="maps-control">
      <button @click="emit('undo')">Desfazer</button>
      <button @click="emit('clear')">Apagar tudo</button>
    </div>
    <div class="container-info">
      Distancia total: {{ props.totalDistance.value.toFixed(2) }} metros
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  color: #333;
  font-size: 16px;
  font-weight: bold;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.maps-control {
  display: flex;
  gap: 10px;
  padding: 10px;
}

.maps-control button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ccc;
}

.container-info {
  font-weight: bold;
  padding: 10px;
}
</style>
