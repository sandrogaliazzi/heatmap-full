import { defineStore } from "pinia";
import { ref } from "vue";
import { jwtDecode } from "jwt-decode";
import { reactive } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const tokenExpired = ref(false);

  // Estado reativo para o token
  const tokenState = reactive({
    accessToken: localStorage.getItem("token") || null,
    tokenCheckInterval: null,
  });

  // Verificar se o token está expirado
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const { exp } = jwtDecode(token); // `exp` é o tempo de expiração em segundos
      return Date.now() >= exp * 1000;
    } catch (error) {
      tokenExpired.value = true;
    }
  };

  // Configurar a verificação periódica do token
  const startTokenMonitoring = () => {
    if (tokenState.tokenCheckInterval) return; // Evita múltiplos timers

    tokenState.tokenCheckInterval = setInterval(() => {
      const token = tokenState.accessToken;
      if (isTokenExpired(token)) {
        console.warn("Token expirado! Exibindo modal de login.");
        clearInterval(tokenState.tokenCheckInterval);
        tokenState.tokenCheckInterval = null;
        tokenExpired.value = true;
      }
    }, 10000); // 10 minutos (600.000 ms)
  };

  // Parar a verificação do token (se necessário)
  const stopTokenMonitoring = () => {
    if (tokenState.tokenCheckInterval) {
      clearInterval(tokenState.tokenCheckInterval);
      tokenState.tokenCheckInterval = null;
    }
  };

  // Atualizar token (após login ou renovação)
  const updateAccessToken = (newToken) => {
    tokenState.accessToken = newToken;
    localStorage.setItem("token", newToken);
    startTokenMonitoring();
  };

  return {
    tokenExpired,
    startTokenMonitoring,
    stopTokenMonitoring,
    updateAccessToken,
  };
});
