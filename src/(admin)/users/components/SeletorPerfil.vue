<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import type { Perfil } from '@/types/usuarios'
import { PERFIS } from '../perfis'

// Escolha de perfil do protótipo (campo 2020:1973 + opcao-perfil 2020:1992). Não é um <select>
// nativo porque cada opção traz uma descrição; o teclado segue o padrão de listbox: setas
// andam, Enter ou espaço escolhem, Esc fecha só a lista (o modal continua aberto).
const perfil = defineModel<Perfil | ''>({ required: true })

const aberto = ref(false)
const destacado = ref(0)
const id = useId()
const idDaLista = `${id}-lista`

const rotuloEscolhido = computed(() => PERFIS.find((p) => p.valor === perfil.value)?.rotulo ?? '')

function abrir() {
  destacado.value = Math.max(
    0,
    PERFIS.findIndex((p) => p.valor === perfil.value),
  )
  aberto.value = true
}

function escolher(valor: Perfil) {
  perfil.value = valor
  aberto.value = false
}

function mover(passo: number) {
  if (!aberto.value) return abrir()
  destacado.value = (destacado.value + passo + PERFIS.length) % PERFIS.length
}

function escolherDestacado() {
  const opcao = PERFIS[destacado.value]
  if (!aberto.value || !opcao) return abrir()
  escolher(opcao.valor)
}

function fecharLista(evento: KeyboardEvent) {
  if (!aberto.value) return
  evento.stopPropagation()
  aberto.value = false
}
</script>

<template>
  <div class="relative flex flex-col gap-1.5">
    <label :for="id" class="font-label text-[14px] text-gray-txt2-dark">Perfil</label>

    <div v-if="aberto" class="fixed inset-0 z-10" @click="aberto = false"></div>

    <button
      :id="id"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="aberto"
      :aria-controls="idDaLista"
      :aria-activedescendant="aberto ? `${id}-opcao-${destacado}` : undefined"
      class="relative z-20 flex w-full cursor-pointer items-center gap-2.5 rounded-[5px] border bg-black-bg1 px-[15px] py-2.5 text-left text-[16px] leading-5 outline-none transition-colors"
      :class="aberto ? 'border-blue' : 'border-transparent focus-visible:border-blue'"
      @click="aberto ? (aberto = false) : abrir()"
      @keydown.down.prevent="mover(1)"
      @keydown.up.prevent="mover(-1)"
      @keydown.enter.prevent="escolherDestacado"
      @keydown.space.prevent="escolherDestacado"
      @keydown.esc="fecharLista"
    >
      <span class="flex-1" :class="perfil === '' ? 'text-gray-txt3-dark' : 'text-white-txt1'">
        {{ perfil === '' ? 'Selecione um perfil' : rotuloEscolhido }}
      </span>
      <i
        class="bi bi-chevron-down text-[16px] text-gray-txt2-dark transition-transform duration-200"
        :class="{ 'rotate-180': aberto }"
        aria-hidden="true"
      ></i>
    </button>

    <ul
      v-if="aberto"
      :id="idDaLista"
      role="listbox"
      aria-label="Perfis"
      class="absolute top-full left-0 z-20 mt-2 w-full overflow-hidden rounded-[5px] border border-gray-txt3-dark/35 bg-black-bg1 py-1.5 shadow-2xl"
    >
      <li
        v-for="(opcao, indice) in PERFIS"
        :id="`${id}-opcao-${indice}`"
        :key="opcao.valor"
        role="option"
        :aria-selected="opcao.valor === perfil"
        class="flex cursor-pointer items-center gap-3 px-[15px] py-2.5"
        :class="{ 'bg-black-bg2': indice === destacado }"
        @mouseenter="destacado = indice"
        @click="escolher(opcao.valor)"
      >
        <i
          class="bi bi-check2 w-4 text-[16px] text-blue"
          :class="{ invisible: opcao.valor !== perfil }"
          aria-hidden="true"
        ></i>
        <span class="flex flex-col gap-0.5">
          <span
            class="text-[16px] leading-5"
            :class="opcao.valor === perfil ? 'text-blue' : 'text-white-txt1'"
          >
            {{ opcao.rotulo }}
          </span>
          <span class="font-label text-[12px] font-light text-gray-txt2-dark">{{
            opcao.descricao
          }}</span>
        </span>
      </li>
    </ul>
  </div>
</template>
