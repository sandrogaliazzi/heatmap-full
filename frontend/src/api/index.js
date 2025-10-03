import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const BASE_URL = "https://api.heatmap.conectnet.net/";
//const BASE_URL = "http://localhost:5005/";

const headersConfig = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "x-access-token": localStorage.getItem("token") || "",
};

const fetchApi = axios.create({
  baseURL: BASE_URL,
  headers: headersConfig,
});

fetchApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error) {
      const errorStatus = error.response.status;

      if (errorStatus === 403 || errorStatus === 401) {
        const auth = useAuthStore();
        auth.tokenExpired = true;
      }
    }
  }
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
  }
);

export default fetchApi;
