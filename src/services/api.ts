import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || '/backend',
  timeout: 30000,
  headers: {
    Accept: 'application/json',
  },
})
