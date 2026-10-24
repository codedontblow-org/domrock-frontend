<script setup lang="ts">
import BotaoTexto from '@/components/BotaoTexto.vue'
import type { Usuario } from '@/types/usuarios'
import LinhaUsuario from './LinhaUsuario.vue'

// "Tabela de usuários" do protótipo (642:1811), com o rodapé de paginação (2021:2046) e o
// estado de falha ao carregar (2021:2423). As larguras das colunas somam o gap de 16px do Figma.
defineProps<{
  usuarios: Usuario[]
  idLogado: number | undefined
  carregando: boolean
  falhou: boolean
  paginaAtual: number
  totalPaginas: number
}>()

const emit = defineEmits<{
  editar: [usuario: Usuario]
  alterarSituacao: [usuario: Usuario]
  anterior: []
  proxima: []
  tentarDeNovo: []
}>()
</script>

<template>
  <div
    class="relative overflow-x-auto overscroll-x-none rounded-[5px] border border-gray-txt3-dark bg-black-bg2"
  >
    <div
      v-if="carregando"
      class="absolute inset-0 z-10 flex cursor-wait items-center justify-center bg-black-bg1/50"
    >
      <span class="text-white-txt1">Carregando...</span>
    </div>

    <table class="w-full min-w-[800px] border-collapse text-left">
      <thead class="bg-white-txt1/5 font-label text-[14px] text-gray-txt2-dark">
        <tr class="border-b border-gray-txt3-dark/35">
          <th scope="col" class="py-3 pr-2 pl-5 font-normal">Nome</th>
          <th scope="col" class="px-2 py-3 font-normal">E-mail</th>
          <th scope="col" class="w-[216px] px-2 py-3 font-normal">Perfil</th>
          <th scope="col" class="w-[166px] px-2 py-3 font-normal">Situação</th>
          <th scope="col" class="w-[108px] py-3 pr-5 pl-2 font-normal">Ações</th>
        </tr>
      </thead>

      <tbody v-if="falhou">
        <tr>
          <td colspan="5" class="px-5 py-12">
            <div role="alert" class="flex flex-col items-center gap-2 text-center">
              <i class="bi bi-exclamation-circle text-[22px] text-red" aria-hidden="true"></i>
              <p class="text-[16px] leading-5 text-white-txt1">
                Não foi possível carregar os usuários
              </p>
              <p class="font-label text-[12px] text-gray-txt2-dark">
                Confira a conexão e tente de novo.
              </p>
              <BotaoTexto variante="vazado" class="mt-2" @click="emit('tentarDeNovo')"
                >Tentar de novo</BotaoTexto
              >
            </div>
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <LinhaUsuario
          v-for="u in usuarios"
          :key="u.id"
          :usuario="u"
          :eh-voce="u.id === idLogado"
          @editar="emit('editar', u)"
          @alterar-situacao="emit('alterarSituacao', u)"
        />
      </tbody>
    </table>

    <footer
      v-if="!falhou"
      class="flex min-w-[800px] items-center justify-between border-t border-gray-txt3-dark px-5 py-3"
    >
      <span class="font-label text-[14px] text-gray-txt2-dark">
        Página {{ totalPaginas === 0 ? 0 : paginaAtual + 1 }} de {{ totalPaginas }}
      </span>
      <div class="flex gap-2.5">
        <BotaoTexto variante="vazado" :disabled="paginaAtual === 0" @click="emit('anterior')"
          >Anterior</BotaoTexto
        >
        <BotaoTexto
          variante="vazado"
          :disabled="paginaAtual >= totalPaginas - 1"
          @click="emit('proxima')"
        >
          Próxima
        </BotaoTexto>
      </div>
    </footer>
  </div>
</template>
