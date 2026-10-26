<script setup lang="ts">
import AlertaErro from '@/components/AlertaErro.vue'
import BotaoTexto from '@/components/BotaoTexto.vue'
import AreaDeEnvio from './AreaDeEnvio.vue'
import ArquivoItem from './ArquivoItem.vue'

// Bloco "envio" do protótipo (2004:1709): escolher as planilhas, ver a lista e pedir a importação.
// Os problemas (falta Vendas, mês no nome...) vêm de separarPorMes e seguram o botão Importar.
const props = defineProps<{ escolhidas: File[]; problemas: string[]; podeImportar: boolean }>()

const emit = defineEmits<{ escolher: [arquivos: File[]]; remover: [nome: string]; importar: [] }>()
</script>

<template>
  <section class="flex flex-col gap-5 rounded-[10px] bg-black-bg2 p-5 md:p-[30px]">
    <AreaDeEnvio @escolher="emit('escolher', $event)" />

    <template v-if="props.escolhidas.length > 0">
      <p class="font-label text-[14px] text-gray-txt3-dark">Arquivos escolhidos ({{ props.escolhidas.length }})</p>
      <ul class="flex flex-col gap-5">
        <li v-for="arquivo in props.escolhidas" :key="arquivo.name">
          <ArquivoItem :nome="arquivo.name" :tamanho="arquivo.size" pode-remover @remover="emit('remover', arquivo.name)" />
        </li>
      </ul>
    </template>

    <AlertaErro v-if="props.problemas.length > 0">
      <ul class="flex flex-col gap-1">
        <li v-for="problema in props.problemas" :key="problema">{{ problema }}</li>
      </ul>
    </AlertaErro>

    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <p class="flex items-start gap-2 font-label text-[14px] text-gray-txt3-dark">
        <i class="bi bi-info-circle text-[16px] leading-4" aria-hidden="true"></i>
        RH e Vendas são obrigatórias em cada mês; a Comissão é opcional e também pode ir sozinha. Vários meses vão um
        depois do outro.
      </p>
      <BotaoTexto :disabled="!props.podeImportar" @click="emit('importar')">Importar</BotaoTexto>
    </div>
  </section>
</template>
