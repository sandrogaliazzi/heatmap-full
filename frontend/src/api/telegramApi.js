import axios from "axios";

const token = import.meta.env.VITE_TELEGRAM_API_TOKEN;

const token2 = import.meta.env.VITE_TELEGRAM_API_TOKEN2;

const BASE_URL = `https://api.telegram.org/bot${token}`;

const NEW_URL = `https://api.telegram.org/bot${token2}`;

const headersConfig = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

export const retiradasDeConectorBot = axios.create({
  baseURL: NEW_URL,
  headers: headersConfig,
});

const telegram = axios.create({
  baseURL: BASE_URL,
  headers: headersConfig,
});

export default telegram;
