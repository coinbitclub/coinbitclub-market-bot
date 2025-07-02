import axios from "axios";

// Usa variável de ambiente para a URL base do backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333", // Troque pelo seu backend!
  timeout: 10000,
});

export default api;
