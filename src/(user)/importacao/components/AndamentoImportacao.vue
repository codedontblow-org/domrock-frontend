<script setup lang="ts">
import { computed } from 'vue'
import AlertaErro from '@/components/AlertaErro.vue'
import BotaoTexto from '@/components/BotaoTexto.vue'
import { resumoDaFila, temRelatorio } from '../andamento'
import { formatarCompetencia } from '../formatacao'
import type { MesDaFila } from '../stores/importacao'
import ArquivoItem from './ArquivoItem.vue'
import BarraDeProgresso from './BarraDeProgresso.vue'
import SituacaoImportacao from './SituacaoImportacao.vue'

// Bloco "andamento" do protótipo (2004:1869). A fila de vários meses não está no protótipo: cada mês
// vira uma linha com a situação e o link do relatório, no estilo do histórico de envios.
const props = defineProps<{ fila: MesDaFila[]; enviando: boolean; erro: string | null }>()

const emit = defineEmits<{ novaImportacao: [] }>()

const umMes = computed(() => props.fila.length === 1)
const resumo = computed(() => resumoDaFila(props.fila, props.enviando))
// Com um mês o job segue no backend; com vários, quem manda o próximo mês é esta aba.
const dicaDeSaida = computed(() =>
  umMes.value
    ? 'Pode sair desta tela: a importação continua e o resultado aparece no histórico. Enquanto ela roda, não dá para enviar outra.'
    : 'Pode navegar pelo Camplana: os meses seguem um depois do outro. Se fechar a aba, só o mês que está indo termina.',
)

function planilhas(mes: MesDaFila): string {
  return `${mes.arquivos.length} ${mes.arquivos.length === 1 ? 'planilha' : 'planilhas'}`
}
</script>

<template>
  <section class="flex flex-col gap-5 rounded-[10px] bg-black-bg2 p-5 md:p-[30px]">
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-[24px] leading-7 font-medium!">
        {{ props.enviando ? 'Importação em andamento' : 'Importação terminada' }}
      </h2>
      <SituacaoImportacao v-if="props.enviando" situacao="PROCESSANDO" />
    </div>
    <p class="font-label text-[14px] text-gray-txt3-dark">{{ resumo }}</p>
    <BarraDeProgresso v-if="props.enviando" />

    <ul v-if="umMes" class="flex flex-col gap-2.5">
      <li v-for="arquivo in props.fila[0]!.arquivos" :key="arquivo.nome">
        <ArquivoItem :nome="arquivo.nome" :tamanho="arquivo.tamanho" />
      </li>
    </ul>
    <ul v-else class="flex flex-col">
      <li
        v-for="mes in props.fila"
        :key="mes.competencia ?? mes.jobId ?? ''"
        data-teste="mes-da-fila"
        class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-txt3-dark/35 px-1 py-3"
      >
        <span class="w-[150px] text-[16px] leading-5">{{ formatarCompetencia(mes.competencia) }}</span>
        <span v-if="mes.arquivos.length" class="w-[120px] font-label text-[14px] text-gray-txt2-dark">{{ planilhas(mes) }}</span>
        <SituacaoImportacao :situacao="mes.situacao" class="w-[170px]" />
        <!-- flex-1 e não ml-auto: o reset do base.css (* { margin: 0 }) vence as margens do Tailwind. -->
        <span class="flex-1 text-right">
          <RouterLink
            v-if="temRelatorio(mes)"
            :to="{ name: 'importar-relatorio', params: { id: mes.jobId } }"
            class="font-label text-[14px] text-blue hover:underline focus-visible:outline-2 focus-visible:outline-blue"
          >
            Ver relatório
          </RouterLink>
        </span>
      </li>
    </ul>

    <AlertaErro v-if="props.erro" :mensagem="props.erro" />

    <p v-if="props.enviando" class="flex items-start gap-2 font-label text-[14px] text-gray-txt2-dark">
      <i class="bi bi-info-circle text-[16px] leading-4" aria-hidden="true"></i>
      {{ dicaDeSaida }}
    </p>
    <BotaoTexto v-else variante="vazado" class="self-start" @click="emit('novaImportacao')">Nova importação</BotaoTexto>
  </section>
</template>
