<script setup lang="ts">
import AlertaErro from '@/components/AlertaErro.vue'
import BotaoTexto from '@/components/BotaoTexto.vue'
import JanelaModal from '@/components/JanelaModal.vue'
import { formatarCompetencia } from '../formatacao'
import type { LoteDoMes } from '../planilhas'
import ArquivoItem from './ArquivoItem.vue'

// "Confirmar envio (double check)" do protótipo (2008:2145). Com vários meses, as planilhas aparecem
// agrupadas pelo mês, na ordem em que vão ser enviadas.
const props = defineProps<{ lotes: LoteDoMes<File>[] }>()

const emit = defineEmits<{ voltar: []; confirmar: [] }>()
</script>

<template>
  <JanelaModal titulo="Confirmar importação" icone="bi-cloud-arrow-up" cor-do-icone="azul" @fechar="emit('voltar')">
    <template #descricao>
      <template v-if="props.lotes.length === 1">Confira se estas são as planilhas do mês certo antes de enviar:</template>
      <template v-else>Confira os meses antes de enviar. Cada mês é um envio, um depois do outro:</template>
    </template>

    <div class="flex max-h-[40vh] flex-col gap-4 overflow-y-auto">
      <section v-for="lote in props.lotes" :key="lote.competencia" class="flex flex-col gap-2.5">
        <h4 v-if="props.lotes.length > 1" class="font-label text-[14px] text-gray-txt3-dark">
          {{ formatarCompetencia(lote.competencia) }}
        </h4>
        <ArquivoItem v-for="arquivo in lote.arquivos" :key="arquivo.name" :nome="arquivo.name" :tamanho="arquivo.size" />
      </section>
    </div>

    <div class="flex flex-col gap-5">
      <AlertaErro
        mensagem="Depois de importada, a competência não pode ser enviada de novo. Se houver pendência impeditiva, nada é gravado."
      />
      <div class="flex flex-col gap-[15px] sm:flex-row">
        <BotaoTexto variante="vazado" class="flex-1" @click="emit('voltar')">Voltar</BotaoTexto>
        <BotaoTexto class="flex-1" @click="emit('confirmar')">Importar</BotaoTexto>
      </div>
    </div>
  </JanelaModal>
</template>
