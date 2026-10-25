<script setup lang="ts">
import { computed } from 'vue'
import type { Usuario } from '@/types/usuarios'
import { rotuloDoPerfil } from '../perfis'

// user-row do protótipo (645:958): o desativado fica todo em Texto3 e a própria conta não
// se desativa (critério 3 do A6-63; o backend também barra com 400 e esta mesma frase).
const props = defineProps<{ usuario: Usuario; ehVoce: boolean }>()
const emit = defineEmits<{ editar: []; alterarSituacao: [] }>()

const DICA_DA_PROPRIA_CONTA = 'Você não pode desativar a própria conta'

const nomeDaAcao = computed(() => {
  if (props.ehVoce) return DICA_DA_PROPRIA_CONTA
  return `${props.usuario.ativo ? 'Desativar' : 'Reativar'} ${props.usuario.nome}`
})

const corDoTextoSecundario = computed(() =>
  props.usuario.ativo ? 'text-gray-txt2-dark' : 'text-gray-txt3-dark',
)
</script>

<template>
  <tr
    class="border-b border-gray-txt3-dark/35 transition-colors last:border-b-0 hover:bg-white-txt1/[0.03]"
    :class="usuario.ativo ? 'text-white-txt1' : 'text-gray-txt3-dark'"
  >
    <td class="py-3.5 pr-2 pl-5 text-[16px] leading-5">
      <span class="flex items-center gap-2">
        {{ usuario.nome }}
        <span v-if="ehVoce" class="font-label text-[12px] font-light text-gray-txt3-dark"
          >(você)</span
        >
      </span>
    </td>
    <td class="px-2 py-3.5 font-label text-[14px]" :class="corDoTextoSecundario">
      {{ usuario.email }}
    </td>
    <td class="px-2 py-3.5 text-[16px] leading-5">{{ rotuloDoPerfil(usuario.perfil) }}</td>
    <td class="px-2 py-3.5 font-label text-[14px]" :class="corDoTextoSecundario">
      <span class="flex items-center gap-2">
        <span
          class="size-2 rounded-full"
          :class="usuario.ativo ? 'bg-green' : 'bg-gray-txt3-dark'"
        ></span>
        {{ usuario.ativo ? 'Ativo' : 'Desativado' }}
      </span>
    </td>
    <td class="py-3.5 pr-5 pl-2">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex size-6 cursor-pointer items-center justify-center rounded-[5px] bg-orange text-[16px] text-white-txt1 transition hover:brightness-110"
          :aria-label="`Editar ${usuario.nome}`"
          :title="`Editar ${usuario.nome}`"
          @click="emit('editar')"
        >
          <i class="bi bi-pencil-fill" aria-hidden="true"></i>
        </button>

        <span class="group/situacao relative flex">
          <button
            type="button"
            :disabled="ehVoce"
            :aria-label="nomeDaAcao"
            :title="ehVoce ? undefined : nomeDaAcao"
            class="flex size-6 cursor-pointer items-center justify-center rounded-[5px] text-[16px] text-white-txt1 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:brightness-100"
            :class="usuario.ativo ? 'bg-red' : 'bg-green'"
            @click="emit('alterarSituacao')"
          >
            <i
              class="bi"
              :class="usuario.ativo ? 'bi-person-dash-fill' : 'bi-person-check-fill'"
              aria-hidden="true"
            ></i>
          </button>
          <span
            v-if="ehVoce"
            role="tooltip"
            class="pointer-events-none absolute top-[calc(100%+6px)] right-0 z-10 hidden rounded-[5px] border border-gray-txt3-dark bg-black-bg1 px-2.5 py-1.5 font-label text-[12px] font-light whitespace-nowrap text-white-txt1 group-hover/situacao:block"
          >
            {{ DICA_DA_PROPRIA_CONTA }}
          </span>
        </span>
      </div>
    </td>
  </tr>
</template>
