
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EventoAgente } from '../types'
import TabelaDados from './TabelaDados.vue'

defineProps<{
  events: EventoAgente[]
}>()

const aberto = ref(false)
const ferramentasAbertas = ref<Record<number, boolean>>({})

const isSupervisor = computed(() => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('perfil') === 'SUPERVISOR'
})

function alternarFerramenta(index: number): void {
  ferramentasAbertas.value[index] = !ferramentasAbertas.value[index]
}

function obterIcone(ferramenta: string): string {
  if (ferramenta === 'consultar_banco') return 'bi-database-fill'
  if (ferramenta === 'registrar_parametro_regra') return 'bi-sliders2'
  return 'bi-tools'
}

function temErro(event: EventoAgente): boolean {
  if (!event.situacao) return false
  const s = event.situacao.toLowerCase()
  return s.includes('erro') || s.includes('error') || s.includes('falha')
}

function formatarTempo(tempoMs?: number | null): string {
  if (tempoMs == null || isNaN(tempoMs)) return '0.0s'
  const segundos = Math.max(0, tempoMs) / 1000
  return `${segundos.toFixed(1)}s`
}

// Linhas que a consulta devolveu (no máximo 50, o LIMIT do guard da Lana): a fonte do número.
function dadosRetornados(event: EventoAgente): Record<string, unknown>[] {
  if (typeof event.result !== 'object' || event.result === null || !('dados' in event.result)) return []
  return Array.isArray(event.result.dados) ? event.result.dados : []
}

function formatarJson(dado: unknown): string {
  if (dado === null || dado === undefined) return ''
  if (typeof dado === 'string') return dado
  try {
    return JSON.stringify(dado, null, 2)
  } catch {
    return String(dado)
  }
}
</script>

<template>
  <div v-if="events && events.length > 0" class="w-full self-start my-1 font-raleway">
    <!-- Dropdown principal de ferramentas usadas pelo agente -->
    <button
      type="button"
      class="flex items-center gap-2 max-w-[750px] py-2 rounded-lg text-gray-txt3-dark hover:text-white-txt1 transition-colors cursor-pointer text-label select-none group"
      :aria-expanded="aberto"
      @click="aberto = !aberto"
    >
      <span class="font-medium text-gray-txt2-dark group-hover:text-white-txt1 group-hover:underline transition-colors">
        Usou {{ events.length }} {{ events.length === 1 ? 'ferramenta' : 'ferramentas' }}
      </span>
      <i
        class="bi bi-chevron-down text-[12px] text-gray-txt3-dark group-hover:text-white-txt1 transition-transform duration-200"
        :class="{ 'rotate-180': aberto }"
        aria-hidden="true"
      ></i>
    </button>

    <!-- Lista de ferramentas quando o dropdown principal estiver aberto -->
    <div
      v-if="aberto"
      class="mt-2 flex flex-col max-w-[750px] rounded-lg border border-black-bg2 border-2"
    >
      <div
        v-for="(event, index) in events"
        :key="index"
        class="flex flex-col overflow-hidden border-b-2 border-black-bg2"
      >
        <!-- Item da ferramenta com ícone, texto legível, chevron e tempo de execução -->
        <button
          type="button"
          class="flex items-center justify-between gap-3 w-full px-3 py-2 text-left hover:bg-black-bg1/70 transition-colors cursor-pointer group/tool"
          :aria-expanded="!!ferramentasAbertas[index]"
          @click="alternarFerramenta(index)"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <i
              class="bi text-[16px] shrink-0"
              :class="[obterIcone(event.ferramenta), temErro(event) ? 'text-red' : 'text-blue']"
              aria-hidden="true"
            ></i>
            <span
              class="text-label text-white-txt1 truncate transition-colors"
              :class="temErro(event) ? 'group-hover/tool:text-red' : 'group-hover/tool:text-blue'"
            >
              {{ event.descricao_legivel || event.ferramenta }}
            </span>
            <i
              class="bi bi-chevron-down text-[12px] text-gray-txt3-dark shrink-0 transition-transform duration-200"
              :class="[
                { 'rotate-180': ferramentasAbertas[index] },
                temErro(event) ? 'group-hover/tool:text-red' : 'group-hover/tool:text-white-txt1'
              ]"
              aria-hidden="true"
            ></i>
          </div>

          <span class="text-metadata font-inconsolata text-gray-txt3-dark shrink-0 ml-2">
            {{ formatarTempo(event.tempo) }}
          </span>
        </button>

        <!-- Informações detalhadas da execução da ferramenta -->
        <div
          v-if="ferramentasAbertas[index]"
          class="flex flex-col gap-3 px-5 py-5 bg-black-bg1/60 text-metadata"
        >
          <!-- Status exibido APENAS quando houver erro -->
          <div
            v-if="temErro(event)"
            class="flex items-center gap-2 bg-black-bg2 px-3 py-2 rounded border-l-3 border-red"
          >
            <i class="bi bi-exclamation-triangle-fill text-red shrink-0" aria-hidden="true"></i>
            <p class="text-white text-label">{{ event.situacao }}</p>
          </div>

          <!-- Nome da ferramenta: visível SOMENTE para perfil SUPERVISOR -->
          <div v-if="isSupervisor" class="flex items-center gap-2">
            <p class="text-label text-gray-txt3-dark">Nome da ferramenta:</p>
            <code class="px-1.5 py-0.5 rounded bg-black-bg2 text-white-txt1 font-source-code-pro text-code">
              {{ event.ferramenta }}
            </code>
          </div>

          <!-- Competências: visível para todos -->
          <div v-if="event.competencias?.length" class="flex flex-col gap-1.5">
            <span class="text-label text-gray-txt3-dark">Competências:</span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span
                v-for="comp in event.competencias"
                :key="comp"
                class="px-2 py-0.5 rounded bg-black-bg2 font-source-code-pro text-white-txt1 text-label"
              >
                {{ comp }}
              </span>
            </div>
          </div>

          <!-- Registros consultados: visível para todos -->
          <div v-if="event.registros !== null && event.registros !== undefined" class="flex items-center gap-2">
            <span class="text-label text-gray-txt3-dark">Registros consultados:</span>
            <span class="text-white-txt1 font-inconsolata text-label ml-1">{{ event.registros }}</span>
          </div>

          <!-- SQL Gerado: visível SOMENTE para perfil SUPERVISOR -->
          <div v-if="isSupervisor && event.sql" class="flex flex-col gap-1">
            <span class="text-label text-gray-txt3-dark">SQL gerado:</span>
            <pre class="p-2.5 rounded bg-black-bg2 font-source-code-pro text-code text-white-txt1 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto"><code>{{ event.sql }}</code></pre>
          </div>

          <!-- Filtros aplicados: visível para todos -->
          <div v-if="event.filtros && (typeof event.filtros === 'object' ? Object.keys(event.filtros).length : true)" class="flex flex-col gap-1">
            <span class="text-label text-gray-txt3-dark">Filtros aplicados:</span>
            <pre class="p-2 rounded bg-black-bg2 font-source-code-pro text-label text-gray-txt2-dark overflow-x-auto whitespace-pre-wrap max-h-36 overflow-y-auto"><code>{{ formatarJson(event.filtros) }}</code></pre>
          </div>

          <!-- Dados retornados: visível para todos -->
          <div v-if="dadosRetornados(event).length" class="flex flex-col gap-1">
            <span class="text-label text-gray-txt3-dark">Dados retornados:</span>
            <TabelaDados :linhas="dadosRetornados(event)" />
          </div>

          <!-- Parâmetros / Argumentos: visível para todos -->
          <div v-if="event.args && Object.keys(event.args).length" class="flex flex-col gap-1">
            <span class="text-label text-gray-txt3-dark">Parâmetros / Argumentos:</span>
            <pre class="p-2 rounded bg-black-bg2 font-source-code-pro text-label text-gray-txt2-dark overflow-x-auto whitespace-pre-wrap max-h-36 overflow-y-auto"><code>{{ formatarJson(event.args) }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
