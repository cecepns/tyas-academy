import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api-inventory.isavralabel.com/tyasacademy/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tyas_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

