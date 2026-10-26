<script setup lang="ts">
import { computed } from 'vue'
import { formatarCelula } from '../formatacao'

// As linhas que o consultar_banco devolveu (no máximo 50, o LIMIT do guard da Lana): a fonte do número.
const props = defineProps<{
  linhas: Record<string, unknown>[]
}>()

const colunas = computed(() => Object.keys(props.linhas[0] ?? {}))
</script>

<template>
  <div class="max-h-48 overflow-auto rounded bg-black-bg2">
    <table class="w-full text-left font-source-code-pro text-label text-white-txt1">
      <thead class="sticky top-0 bg-black-bg2 text-gray-txt3-dark">
        <tr>
          <th v-for="coluna in colunas" :key="coluna" scope="col" class="px-2.5 py-1.5 font-normal whitespace-nowrap">
            {{ coluna }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(linha, indice) in linhas" :key="indice" class="border-t border-black-bg1">
          <td v-for="coluna in colunas" :key="coluna" class="px-2.5 py-1 whitespace-nowrap">
            {{ formatarCelula(linha[coluna]) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
