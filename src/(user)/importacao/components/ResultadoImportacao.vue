<script setup lang="ts">
import { computed } from 'vue'
import { numerosDoResultado } from '../relatorio'
import type { JobImportacao, SituacaoJob } from '../types'
import BarraDeProgresso from './BarraDeProgresso.vue'
import SituacaoImportacao from './SituacaoImportacao.vue'
import TabelaPendencias from './TabelaPendencias.vue'

// Bloco "resultado" do protótipo (2005:1974 concluída e 2005:2143 com impeditivo): título com ícone,
// os números do envio e as pendências. O slot `acao` vai para o rodapé das pendências.
const props = defineProps<{ job: JobImportacao }>()

const TOPO: Record<SituacaoJob, { titulo: string; icone: string | null }> = {
  PROCESSANDO: { titulo: 'Importação em andamento', icone: null },
  CONCLUIDO: { titulo: 'Importação concluída', icone: 'bi-check-circle-fill text-green' },
  PENDENTE: { titulo: 'Importação não concluída', icone: 'bi-x-circle-fill text-red' },
  FALHA: { titulo: 'Importação não concluída', icone: 'bi-x-circle-fill text-red' },
}

const topo = computed(() => TOPO[props.job.status])
const numeros = computed(() => numerosDoResultado(props.job))
const pendencias = computed(() => props.job.pendencias ?? [])
</script>

<template>
  <section class="flex flex-col gap-6 rounded-[10px] bg-black-bg2 p-5 md:p-[30px]">
    <div class="flex items-center justify-between gap-4">
      <h2 class="flex items-center gap-2.5 text-[24px] leading-7 font-medium!">
        <i v-if="topo.icone" class="bi text-[22px] leading-none" :class="topo.icone" aria-hidden="true"></i>
        {{ topo.titulo }}
      </h2>
      <SituacaoImportacao :situacao="props.job.status" />
    </div>

    <BarraDeProgresso v-if="props.job.status === 'PROCESSANDO'" />
    <template v-else>
      <dl data-teste="numeros" class="flex flex-wrap gap-x-12 gap-y-4">
        <div v-for="numero in numeros" :key="numero.rotulo" class="flex flex-col gap-1.5">
          <dt class="font-label text-[14px] text-gray-txt3-dark">{{ numero.rotulo }}</dt>
          <dd class="font-label text-[20px] leading-[22px] font-bold!">{{ numero.valor }}</dd>
        </div>
      </dl>

      <div class="h-px w-full bg-gray-txt3-dark" aria-hidden="true"></div>

      <TabelaPendencias v-if="pendencias.length > 0" :pendencias="pendencias">
        <template #acao><slot name="acao" /></template>
      </TabelaPendencias>
      <div v-else class="flex flex-wrap items-center justify-between gap-4">
        <p class="text-[16px] leading-5 text-gray-txt2-dark">Nenhuma pendência: todas as linhas foram gravadas.</p>
        <slot name="acao" />
      </div>
    </template>
  </section>
</template>
