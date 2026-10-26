<script setup lang="ts">
import { ref } from 'vue'

// area-de-envio do protótipo (2004:1710): clicar abre o seletor de arquivos; arrastar e soltar também
// escolhe. Aceita vários arquivos de uma vez (vários meses vão um depois do outro).
const emit = defineEmits<{ escolher: [arquivos: File[]] }>()

const arrastando = ref(false)

function aoEscolher(evento: Event): void {
  const entrada = evento.target as HTMLInputElement
  emit('escolher', Array.from(entrada.files ?? []))
  // Sem limpar, escolher de novo a mesma planilha (depois de corrigida) não dispara o change.
  entrada.value = ''
}

function aoSoltar(evento: DragEvent): void {
  arrastando.value = false
  emit('escolher', Array.from(evento.dataTransfer?.files ?? []))
}
</script>

<template>
  <label
    class="flex cursor-pointer flex-col items-center gap-2.5 rounded-[8px] border border-dashed bg-black-bg1 px-4 py-10 text-center transition-colors focus-within:outline-2 focus-within:outline-blue"
    :class="arrastando ? 'border-blue' : 'border-gray-txt3-dark'"
    @dragover.prevent="arrastando = true"
    @dragleave="arrastando = false"
    @drop.prevent="aoSoltar"
  >
    <i class="bi bi-cloud-arrow-up text-[36px] leading-9 text-blue" aria-hidden="true"></i>
    <span class="font-raleway text-[18px] leading-5 font-medium! text-white-txt1">
      Arraste as planilhas aqui ou clique para escolher
    </span>
    <span class="font-label text-[14px] text-gray-txt2-dark">
      Só .xlsx. O nome diz o tipo e o mês: BASE RH_OUT25.xlsx · BASE_VENDAS_OUT25.xlsx · BASE_COMMISS_OUT25.xlsx
    </span>
    <input type="file" multiple accept=".xlsx" class="sr-only" @change="aoEscolher" />
  </label>
</template>
