<script setup lang="ts">
import { onBeforeUnmount, onMounted, useId } from 'vue'

// Moldura dos modais (protótipo 2022:3283; usuários e confirmação da importação): 650px, Background2,
// borda Texto3 a 35% e título com ícone. Esc e o clique fora fecham, como o Cancelar.
const props = defineProps<{
  titulo: string
  icone: string
  corDoIcone: 'azul' | 'vermelho' | 'verde'
}>()

const emit = defineEmits<{ fechar: [] }>()

const CLASSE_DA_COR = { azul: 'text-blue', vermelho: 'text-red', verde: 'text-green' } as const
const idDoTitulo = useId()

function fecharComEsc(evento: KeyboardEvent) {
  if (evento.key === 'Escape') emit('fechar')
}

onMounted(() => window.addEventListener('keydown', fecharComEsc))
onBeforeUnmount(() => window.removeEventListener('keydown', fecharComEsc))
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black-bg1/85" @click="emit('fechar')"></div>

    <section
      role="dialog"
      aria-modal="true"
      :aria-labelledby="idDoTitulo"
      class="relative flex w-full max-w-[650px] flex-col gap-[30px] rounded-[10px] border border-gray-txt3-dark/35 bg-black-bg2 p-6 font-raleway md:p-[50px]"
    >
      <header class="flex flex-col gap-3">
        <h3
          :id="idDoTitulo"
          class="flex items-center gap-2.5 text-[24px] leading-7 font-medium text-white-txt1"
        >
          <i
            class="bi text-[22px]"
            :class="[props.icone, CLASSE_DA_COR[props.corDoIcone]]"
            aria-hidden="true"
          ></i>
          {{ props.titulo }}
        </h3>
        <p class="text-[16px] leading-5 text-gray-txt2-dark"><slot name="descricao" /></p>
      </header>

      <slot />
    </section>
  </div>
</template>
