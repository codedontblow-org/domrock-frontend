<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  contagemPorFiltro, filtrarPendencias, filtroInicial, textoDaLinha, type FiltroPendencias,
} from '../relatorio'
import type { PendenciaImportacao } from '../types'
import SeveridadeTag from './SeveridadeTag.vue'

// Pendências do resultado (protótipo 2005:2000 a 2005:2056): filtro-chip por severidade, a tabela
// (pendencia-cabecalho e pendencia-row) e o rodapé "Mostrando X de Y". O slot `acao` fica à direita
// do rodapé (ex.: "Enviar novamente" quando nada foi gravado).
const props = defineProps<{ pendencias: PendenciaImportacao[] }>()

/** Um relatório real tem dezenas de avisos (26 em out/2025): o resto abre com "Mostrar todas". */
const LIMITE = 10
const FILTROS: Array<[FiltroPendencias, string]> = [['TODAS', 'Todas'], ['IMPEDITIVO', 'Impeditivo'], ['AVISO', 'Aviso']]

const filtro = ref<FiltroPendencias>(filtroInicial(props.pendencias))
const mostrarTodas = ref(false)

const contagem = computed(() => contagemPorFiltro(props.pendencias))
const filtradas = computed(() => filtrarPendencias(props.pendencias, filtro.value))
const visiveis = computed(() => (mostrarTodas.value ? filtradas.value : filtradas.value.slice(0, LIMITE)))
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h3 class="text-[18px] leading-5 font-medium!">Pendências</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="[valor, rotulo] in FILTROS"
          :key="valor"
          type="button"
          class="rounded-[5px] border px-[14px] py-1.5 font-label text-[14px] focus-visible:outline-2 focus-visible:outline-blue"
          :class="filtro === valor ? 'border-blue bg-black-bg1 text-white-txt1' : 'border-gray-txt3-dark/35 text-gray-txt2-dark hover:text-white-txt1'"
          :aria-pressed="filtro === valor"
          @click="filtro = valor"
        >
          {{ `${rotulo} · ${contagem[valor]}` }}
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[860px] border-collapse text-left">
        <thead class="font-label text-[14px] text-gray-txt3-dark">
          <tr class="border-b border-gray-txt3-dark/35">
            <th scope="col" class="w-[256px] py-2.5 pr-2 pl-5 font-normal">Origem</th>
            <th scope="col" class="w-[86px] px-2 py-2.5 font-normal">Linha</th>
            <th scope="col" class="w-[146px] px-2 py-2.5 font-normal">Campo</th>
            <th scope="col" class="px-2 py-2.5 font-normal">Motivo</th>
            <th scope="col" class="w-[150px] py-2.5 pr-5 pl-2 font-normal">Severidade</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(pendencia, indice) in visiveis"
            :key="indice"
            data-teste="pendencia"
            class="border-b border-gray-txt3-dark/35"
          >
            <td class="py-3 pr-2 pl-5 font-label text-[14px] text-gray-txt2-dark">{{ pendencia.origem }}</td>
            <td class="px-2 py-3 font-label text-[14px] text-gray-txt2-dark">{{ textoDaLinha(pendencia.linha) }}</td>
            <td class="px-2 py-3 font-label text-[14px] text-gray-txt2-dark">{{ pendencia.campo }}</td>
            <td class="px-2 py-3 text-[16px] leading-5">{{ pendencia.motivo }}</td>
            <td class="py-3 pr-5 pl-2"><SeveridadeTag :severidade="pendencia.severidade" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-4">
      <span class="font-label text-[14px] text-gray-txt3-dark">
        Mostrando {{ visiveis.length }} de {{ props.pendencias.length }}
      </span>
      <div class="flex items-center gap-4">
        <button
          v-if="!mostrarTodas && filtradas.length > LIMITE"
          type="button"
          class="font-label text-[14px] text-blue hover:underline focus-visible:outline-2 focus-visible:outline-blue"
          @click="mostrarTodas = true"
        >
          Mostrar todas
        </button>
        <slot name="acao" />
      </div>
    </div>
  </div>
</template>
