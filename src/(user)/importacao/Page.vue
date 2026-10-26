<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { temRelatorio } from './andamento'
import AndamentoImportacao from './components/AndamentoImportacao.vue'
import EnvioPlanilhas from './components/EnvioPlanilhas.vue'
import ModalConfirmarImportacao from './components/ModalConfirmarImportacao.vue'
import TabelaEnvios from './components/TabelaEnvios.vue'
import { useImportacaoStore } from './stores/importacao'

// Tela "Importar base do mês" (A6-79, protótipo 2004:1628), só do Supervisor. Escolher, confirmar
// (2008:2145), acompanhar (2004:1793) e o histórico; o resultado de cada envio abre em /importar/{id}.
const store = useImportacaoStore()
const { escolhidas, separacao, podeImportar, fila, enviando, erroDaFila, historico, carregandoHistorico, falhaNoHistorico } =
  storeToRefs(store)
const router = useRouter()
const confirmando = ref(false)

onMounted(() => void store.carregarHistorico())

async function confirmar(): Promise<void> {
  confirmando.value = false
  await store.importar()
}

// Um mês só segue o protótipo: o andamento dá lugar ao resultado daquele envio. Com vários meses,
// o resultado fica na lista da fila, com um relatório por mês.
watch(enviando, (agora, antes) => {
  if (antes && !agora) abrirRelatorioDoMesUnico()
})

function abrirRelatorioDoMesUnico(): void {
  const [unico, ...outros] = fila.value
  if (!unico || outros.length > 0 || !temRelatorio(unico)) return
  store.fecharFila()
  void router.push({ name: 'importar-relatorio', params: { id: unico.jobId } })
}
</script>

<template>
  <div class="mx-auto flex w-full flex-col gap-[35px] px-4 py-10 font-raleway text-white-txt1 lg:px-32 lg:py-20">
    <header class="flex flex-col gap-3">
      <h1 class="font-forum text-[44px] leading-11">Importar base do mês</h1>
      <p class="text-[16px] leading-5 text-gray-txt2-dark">
        Envie as planilhas do mês para a base das simulações. Se houver pendência impeditiva, nada é gravado e você
        corrige a planilha e envia de novo.
      </p>
    </header>

    <AndamentoImportacao
      v-if="fila.length > 0"
      :fila="fila"
      :enviando="enviando"
      :erro="erroDaFila"
      @nova-importacao="store.fecharFila()"
    />
    <EnvioPlanilhas
      v-else
      :escolhidas="escolhidas"
      :problemas="separacao.problemas"
      :pode-importar="podeImportar"
      @escolher="store.escolher"
      @remover="store.remover"
      @importar="confirmando = true"
    />

    <section class="flex flex-col gap-5">
      <h2 class="text-[24px] leading-7 font-medium!">Histórico de envios</h2>
      <TabelaEnvios
        :envios="historico"
        :carregando="carregandoHistorico"
        :falhou="falhaNoHistorico"
        @tentar-de-novo="store.carregarHistorico()"
      />
    </section>

    <ModalConfirmarImportacao
      v-if="confirmando"
      :lotes="separacao.lotes"
      @voltar="confirmando = false"
      @confirmar="confirmar"
    />
  </div>
</template>
