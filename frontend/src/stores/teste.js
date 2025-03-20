import { defineStore } from "pinia";

import { ref, computed } from "vue";

export const useTestStore = defineStore("teste", () => {
  const names = ref(["sandro", "vinicius", "guilherme", "leonardo", "david"]);
  const query = ref("");

  const getFilterName = computed(() => {
    if (query.value) {
      return names.value.filter((name) => name.indexOf(query.value) > -1);
    }

    return names.value;
  });

  const getNamesToUpperCase = computed(() => {
    if (query.value)
      return getFilterName.value.map((name) => name.toUpperCase());
  });

  return { getFilterName, query, getNamesToUpperCase };
});
