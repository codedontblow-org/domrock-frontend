<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BotaoTexto from '@/components/BotaoTexto.vue'
import ResultadoImportacao from '../components/ResultadoImportacao.vue'
import { alertaDoEnvio, metaDoEnvio, tituloDoEnvio } from '../relatorio'
import { useImportacaoStore } from '../stores/importacao'
import type { JobImportacao } from '../types'

// Resultado de um envio da base (A6-79): "concluída com avisos" (2005:1894) e "com impeditivo"
// (2005:2059). Abre pelo "Ver relatório" do histórico ou da fila, e no fim de um envio de um mês só.
const route = useRoute()
const router = useRouter()
const store = useImportacaoStore()

const job = ref<JobImportacao | null>(null)
const falhou = ref(false)

const alerta = computed(() => (job.value ? alertaDoEnvio(job.value.status) : null))
const podeEnviarDeNovo = computed(() => job.value?.status === 'PENDENTE' || job.value?.status === 'FALHA')

async function carregar(): Promise<void> {
  falhou.value = false
  try {
    await store.abrirRelatorio(Number(route.params.id), (atual) => (job.value = atual))
  } catch {
    falhou.value = true
  }
}

onMounted(carregar)
</script>

<template>
  <div class="mx-auto flex w-full flex-col gap-[30px] px-4 py-10 font-raleway text-white-txt1 lg:px-32 lg:py-20">
    <header class="flex flex-col gap-3">
      <RouterLink
        :to="{ name: 'importar' }"
        class="flex w-fit items-center gap-1.5 font-label text-[14px] text-blue hover:underline focus-visible:outline-2 focus-visible:outline-blue"
      >
        <i class="bi bi-chevron-left text-[14px] leading-none" aria-hidden="true"></i>
        Importar base do mês
      </RouterLink>
      <template v-if="job">
        <h1 class="font-forum text-[44px] leading-11">{{ tituloDoEnvio(job) }}</h1>
        <p class="text-[16px] leading-5 text-gray-txt2-dark">{{ metaDoEnvio(job) }}</p>
      </template>
    </header>

    <div v-if="falhou" role="alert" class="flex flex-col items-start gap-3">
      <p class="text-[16px] leading-5">Não foi possível abrir o relatório deste envio. Confira a conexão e tente de novo.</p>
      <BotaoTexto variante="vazado" @click="carregar">Tentar de novo</BotaoTexto>
    </div>
    <p v-else-if="!job" class="font-label text-[14px] text-gray-txt2-dark">Carregando...</p>

    <template v-else>
      <div v-if="alerta" role="alert" class="flex items-center gap-3 rounded-[3px] border border-red bg-black-bg2 px-4 py-3.5">
        <i class="bi bi-exclamation-triangle-fill text-[18px] leading-none text-red" aria-hidden="true"></i>
        <p class="flex-1 text-[16px] leading-5">{{ alerta }}</p>
      </div>

      <ResultadoImportacao :job="job">
        <template #acao>
          <BotaoTexto v-if="podeEnviarDeNovo" @click="router.push({ name: 'importar' })">Enviar novamente</BotaoTexto>
        </template>
      </ResultadoImportacao>
    </template>
  </div>
</template>
