import { defineStore } from "pinia";
import { ref } from "vue";

export const useHeatMapStore = defineStore("heatmap", () => {
  const isHeatMapVisible = ref(true);

  const toggleHeatMap = () => {
    isHeatMapVisible.value = !isHeatMapVisible.value;
  };

  return { isHeatMapVisible, toggleHeatMap };
});
