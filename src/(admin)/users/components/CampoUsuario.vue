<script setup lang="ts">
import { useId } from 'vue'

// campo-usuario do protótipo (2020:1979): rótulo em Inconsolata, caixa em Background1 sobre o
// modal e, com erro, borda e mensagem em Vermelho logo abaixo do campo.
withDefaults(
  defineProps<{
    rotulo: string
    tipo?: 'text' | 'email' | 'password'
    erro?: string
    placeholder?: string
  }>(),
  { tipo: 'text', erro: '', placeholder: '' },
)

const valor = defineModel<string>({ required: true })
const emit = defineEmits<{ sair: [] }>()

const id = useId()
const idDoErro = `${id}-erro`
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="font-label text-[14px] text-gray-txt2-dark">{{ rotulo }}</label>
    <input
      :id="id"
      v-model="valor"
      :type="tipo"
      :placeholder="placeholder"
      :aria-invalid="erro !== ''"
      :aria-describedby="erro ? idDoErro : undefined"
      class="w-full rounded-[5px] border bg-black-bg1 px-[15px] py-2.5 text-[16px] leading-5 text-white-txt1 outline-none transition-colors placeholder:text-gray-txt3-dark"
      :class="erro ? 'border-red' : 'border-transparent focus:border-blue'"
      @blur="emit('sair')"
    />
    <p v-if="erro" :id="idDoErro" class="flex items-center gap-1.5 font-label text-[14px] text-red">
      <i class="bi bi-exclamation-circle text-[14px]" aria-hidden="true"></i>
      {{ erro }}
    </p>
  </div>
</template>
