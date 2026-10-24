<script setup lang="ts">
import { ref } from 'vue'
import BotaoTexto from '@/components/BotaoTexto.vue'
import type { Usuario } from '@/types/usuarios'
import ModalSituacao from './components/ModalSituacao.vue'
import ModalUsuario from './components/ModalUsuario.vue'
import TabelaUsuarios from './components/TabelaUsuarios.vue'
import { useUsuarios } from './useUsuarios'

const {
  idLogado,
  usuarios,
  carregando,
  falhaAoCarregar,
  paginaAtual,
  totalPaginas,
  resumoDaLista,
  carregarDados,
  proximaPagina,
  paginaAnterior,
} = useUsuarios()

const formularioAberto = ref(false)
const usuarioEmEdicao = ref<Usuario | null>(null)
const usuarioParaAlterar = ref<Usuario | null>(null)

function abrirFormulario(usuario: Usuario | null) {
  usuarioEmEdicao.value = usuario
  formularioAberto.value = true
}

function aoSalvar() {
  formularioAberto.value = false
  return carregarDados()
}

function aoAlterarSituacao() {
  usuarioParaAlterar.value = null
  return carregarDados()
}
</script>

<template>
  <div
    class="mx-auto flex w-full flex-col px-4 py-10 font-raleway text-white-txt1 lg:px-32 lg:py-20"
  >
    <h1 class="pb-7.5 font-forum text-[44px] leading-11">Usuários</h1>

    <div
      class="flex w-fit items-center gap-2.5 rounded-[5px] border-l-3 border-blue bg-black-bg2 px-[15px] py-2.5"
    >
      <i class="bi bi-exclamation-triangle text-blue" aria-hidden="true"></i>
      <p class="text-[16px] leading-[18px]">
        Usuários <strong class="font-bold!">nunca são excluídos</strong>: quem é desativado não
        consegue mais entrar, mas as campanhas e aprovações dele continuam no histórico.
      </p>
    </div>

    <div
      class="flex flex-col justify-between gap-4 pt-[60px] pb-[25px] md:flex-row md:items-center"
    >
      <div class="flex flex-col gap-1 md:flex-row md:items-center md:gap-[15px]">
        <h2 class="text-[24px] leading-7 font-medium whitespace-nowrap">Pessoas com acesso</h2>
        <span class="text-[16px] leading-5 text-gray-txt2-dark"
          >Quem pode entrar no Camplana e com qual perfil</span
        >
      </div>
      <BotaoTexto class="w-full md:w-auto" @click="abrirFormulario(null)">
        Adicionar usuário
        <i
          class="bi bi-plus-square-fill text-[20px] leading-5 text-white-txt1"
          aria-hidden="true"
        ></i>
      </BotaoTexto>
    </div>

    <div class="flex w-full flex-col gap-2.5">
      <p v-if="!falhaAoCarregar" class="text-[16px] leading-5">{{ resumoDaLista }}</p>
      <TabelaUsuarios
        :usuarios="usuarios"
        :id-logado="idLogado"
        :carregando="carregando"
        :falhou="falhaAoCarregar"
        :pagina-atual="paginaAtual"
        :total-paginas="totalPaginas"
        @editar="abrirFormulario"
        @alterar-situacao="usuarioParaAlterar = $event"
        @anterior="paginaAnterior"
        @proxima="proximaPagina"
        @tentar-de-novo="carregarDados"
      />
    </div>

    <ModalUsuario
      v-if="formularioAberto"
      :usuario="usuarioEmEdicao"
      @salvo="aoSalvar"
      @fechar="formularioAberto = false"
    />

    <ModalSituacao
      v-if="usuarioParaAlterar"
      :usuario="usuarioParaAlterar"
      @alterado="aoAlterarSituacao"
      @fechar="usuarioParaAlterar = null"
    />
  </div>
</template>
