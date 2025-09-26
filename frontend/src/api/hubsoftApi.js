import axios from "axios";

const BASE_URL = "https://api.conectnet.hubsoft.com.br/";
let token = null;

async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/oauth/token`, {
      client_id: "65",
      client_secret: import.meta.env.VITE_HUBSOFT_API_CLIENT_SECRET,
      username: "heatmap@conectnet.net",
      password: `#${import.meta.env.VITE_HUBSOFT_API_CLIENT_PASSWORD}`,
      grant_type: "password",
    });

    return response.data.access_token;
  } catch (error) {
    console.error("Erro ao obter token:", error);
    throw error;
  }
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    if (!token) {
      token = await getAuthToken();
    }

    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado. Tenta obter um novo
      token = await getAuthToken();

      // Reenvia a request original com o novo token
      error.config.headers.Authorization = `Bearer ${token}`;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);

export default api;
