<script setup lang="ts">
import { computed } from 'vue'
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

// A Comissão sozinha não ocupa competência: o aviso de "não pode enviar de novo" não vale para ela.
// Os % entram com a data do envio e a Lana usa sempre os da última importação (bases.py).
const soComissao = computed(() => props.lotes.length === 1 && props.lotes[0]!.competencia === null)
const aviso = computed(() =>
  soComissao.value
    ? 'Os percentuais desta planilha passam a valer nas próximas simulações. Se houver pendência impeditiva, nada é gravado.'
    : 'Depois de importada, a competência não pode ser enviada de novo. Se houver pendência impeditiva, nada é gravado.',
)
</script>

<template>
  <JanelaModal titulo="Confirmar importação" icone="bi-cloud-arrow-up" cor-do-icone="azul" @fechar="emit('voltar')">
    <template #descricao>
      <template v-if="soComissao">Confira se esta é a planilha de Comissão certa antes de enviar:</template>
      <template v-else-if="props.lotes.length === 1">Confira se estas são as planilhas do mês certo antes de enviar:</template>
      <template v-else>Confira os meses antes de enviar. Cada mês é um envio, um depois do outro:</template>
    </template>

    <div class="flex max-h-[40vh] flex-col gap-4 overflow-y-auto">
      <section v-for="lote in props.lotes" :key="lote.competencia ?? 'comissao'" class="flex flex-col gap-2.5">
        <h4 v-if="props.lotes.length > 1" class="font-label text-[14px] text-gray-txt3-dark">
          {{ formatarCompetencia(lote.competencia) }}
        </h4>
        <ArquivoItem v-for="arquivo in lote.arquivos" :key="arquivo.name" :nome="arquivo.name" :tamanho="arquivo.size" />
      </section>
    </div>

    <div class="flex flex-col gap-5">
      <AlertaErro :mensagem="aviso" />
      <div class="flex flex-col gap-[15px] sm:flex-row">
        <BotaoTexto variante="vazado" class="flex-1" @click="emit('voltar')">Voltar</BotaoTexto>
        <BotaoTexto class="flex-1" @click="emit('confirmar')">Importar</BotaoTexto>
      </div>
    </div>
  </JanelaModal>
</template>
