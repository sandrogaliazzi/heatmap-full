import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";

export const useUserStore = defineStore("user", () => {
  const user = ref(JSON.parse(localStorage.getItem("user")));
  const isAuthenticated = ref(false);

  const setUser = (userData) => {
    user.value = userData;

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token);
    const auth = useAuthStore();
    auth.updateAccessToken(userData.token);
    isAuthenticated.value = true;
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    isAuthenticated.value = false;
  };

  return { setUser, isAuthenticated, logout, user };
});
