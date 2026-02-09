import { defineStore } from "pinia";
import { ref } from "vue";

export const useHeatMapStore = defineStore("heatmap", () => {
  const isHeatMapVisible = ref(true);

  const isPolyLineDrawingMode = ref(false);

  const toggleHeatMap = () => {
    isHeatMapVisible.value = !isHeatMapVisible.value;
  };

  const togglePolyLineDrawingMode = () => {
    isPolyLineDrawingMode.value = !isPolyLineDrawingMode.value;
  };

  return {
    isHeatMapVisible,
    toggleHeatMap,
    isPolyLineDrawingMode,
    togglePolyLineDrawingMode,
  };
});
