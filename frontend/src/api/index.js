import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const BASE_URL = import.meta.env.VITE_API_URL;

const headersConfig = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

const fetchApi = axios.create({
  baseURL: BASE_URL,
  headers: headersConfig,
  withCredentials: true,
  timeout: 20000,
});

const getTokenWithRefreshToken = async () => {
  try {
    const response = await fetchApi.get("/refresh-token", {
      _isRefreshTokenRequest: true,
    });

    if (response.status !== 200) {
      return null;
    }
    const { token } = response.data;
    const user = JSON.parse(localStorage.getItem("user"));
    user.token = token;
    localStorage.setItem("user", JSON.stringify(user));
    return token;
  } catch (error) {
    console.error("Error refreshing token:", error);
  }
};

fetchApi.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (originalRequest?._isRefreshTokenRequest) {
      const auth = useAuthStore();
      auth.tokenExpired = true;
      return Promise.reject(error);
    }

    if (originalRequest.url === "/login") {
      return Promise.reject(error);
    }

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await getTokenWithRefreshToken();

        if (!newToken) {
          const auth = useAuthStore();
          auth.tokenExpired = true;
          return Promise.reject(
            new Error("Token expirado. Faça login novamente."),
          );
        }

        fetchApi.defaults.headers.common["x-access-token"] = newToken;
        originalRequest.headers["x-access-token"] = newToken;

        return fetchApi(originalRequest);
      } catch (refreshError) {
        const auth = useAuthStore();
        auth.tokenExpired = true;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

fetchApi.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      config.headers["x-access-token"] = user.token;
    }

    return config;
  },
  (error) => {
    if (error) {
      return Promise.reject(error);
    }
  },
);

export default fetchApi;
