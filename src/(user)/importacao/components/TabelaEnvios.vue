<script setup lang="ts">
import BotaoTexto from '@/components/BotaoTexto.vue'
import { formatarCompetencia, formatarDataHora, linhasGravadas } from '../formatacao'
import type { EnvioImportacao } from '../types'
import SituacaoImportacao from './SituacaoImportacao.vue'

// "Histórico de envios" do protótipo (2004:1743): envio-cabecalho e envio-row, com as larguras de
// coluna do Figma. O relatório só existe depois que o job sai de PROCESSANDO.
const props = defineProps<{ envios: EnvioImportacao[]; carregando: boolean; falhou: boolean }>()

const emit = defineEmits<{ tentarDeNovo: [] }>()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[960px] border-collapse text-left">
      <thead class="font-label text-[14px] text-gray-txt3-dark">
        <tr class="border-b border-gray-txt3-dark/35">
          <th scope="col" class="w-[166px] py-2.5 pr-2 pl-5 font-normal">Competência</th>
          <th scope="col" class="w-[206px] px-2 py-2.5 font-normal">Enviada em</th>
          <th scope="col" class="w-[156px] px-2 py-2.5 font-normal">Por</th>
          <th scope="col" class="w-[186px] px-2 py-2.5 font-normal">Situação</th>
          <th scope="col" class="w-[236px] px-2 py-2.5 font-normal">Linhas gravadas</th>
          <th scope="col" class="py-2.5 pr-5 pl-2 font-normal"><span class="sr-only">Relatório</span></th>
        </tr>
      </thead>

      <tbody v-if="props.falhou">
        <tr>
          <td colspan="6" class="px-5 py-10">
            <div role="alert" class="flex flex-col items-center gap-2 text-center">
              <p class="text-[16px] leading-5">Não foi possível carregar o histórico de envios</p>
              <BotaoTexto variante="vazado" @click="emit('tentarDeNovo')">Tentar de novo</BotaoTexto>
            </div>
          </td>
        </tr>
      </tbody>

      <tbody v-else-if="props.envios.length === 0">
        <tr>
          <td colspan="6" class="px-5 py-10 text-center font-label text-[14px] text-gray-txt2-dark">
            {{ props.carregando ? 'Carregando...' : 'Nenhum envio ainda: as planilhas importadas aparecem aqui.' }}
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr v-for="envio in props.envios" :key="envio.id" data-teste="envio" class="border-b border-gray-txt3-dark/35">
          <td class="py-3.5 pr-2 pl-5 text-[16px] leading-5">{{ formatarCompetencia(envio.competencia) }}</td>
          <td class="px-2 py-3.5 font-label text-[14px] text-gray-txt2-dark">{{ formatarDataHora(envio.criada_em) }}</td>
          <td class="px-2 py-3.5 text-[16px] leading-5">{{ envio.usuario ?? '—' }}</td>
          <td class="px-2 py-3.5"><SituacaoImportacao :situacao="envio.status" /></td>
          <td class="px-2 py-3.5 font-label text-[14px] text-gray-txt2-dark">{{ linhasGravadas(envio) }}</td>
          <td class="py-3.5 pr-5 pl-2 text-right">
            <RouterLink
              v-if="envio.status !== 'PROCESSANDO'"
              :to="{ name: 'importar-relatorio', params: { id: envio.id } }"
              class="font-label text-[14px] text-blue hover:underline focus-visible:outline-2 focus-visible:outline-blue"
            >
              Ver relatório
            </RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
