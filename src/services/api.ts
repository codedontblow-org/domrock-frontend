import axios from 'axios'

// Simular gera e executa código com a LLM: pode levar até ~1 min com nova tentativa.
const TIMEOUT_MS = 180_000

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || '/backend',
  timeout: TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
  },
})
