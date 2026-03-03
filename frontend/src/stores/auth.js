import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const tokenExpired = ref(false);

  return { tokenExpired };
});
