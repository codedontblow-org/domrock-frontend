import axios from 'axios'
import { encerrarSessao } from './auth'

// Simular gera e executa código com a LLM: pode levar até ~1 min com nova tentativa.
const TIMEOUT_MS = 180_000

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || '/backend',
  timeout: TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => { return response },
  (error) => {
    // Sem resposta (backend fora do ar, timeout) não há status: o erro original do axios segue
    // adiante, para a tela dizer "Sem resposta do servidor" em vez de cair num TypeError.
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const isLoginRequest = /\/auth\/login(?:\?|$)/.test(url)
    if (status === 401 && !isLoginRequest) {
      encerrarSessao()
    }

    return Promise.reject(error)
  }
)