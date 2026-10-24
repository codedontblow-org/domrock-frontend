<script setup lang="ts">
import BotaoTexto from '@/components/BotaoTexto.vue'
import type { Usuario } from '@/types/usuarios'
import { useFormularioUsuario } from '../useFormularioUsuario'
import AlertaErro from './AlertaErro.vue'
import CampoUsuario from './CampoUsuario.vue'
import JanelaModal from './JanelaModal.vue'
import SeletorPerfil from './SeletorPerfil.vue'

// modal-usuario do protótipo: novo (2022:3283) ou edição (2022:3370), que não mostra a senha.
const props = defineProps<{ usuario: Usuario | null }>()
const emit = defineEmits<{ salvo: []; fechar: [] }>()

const {
  editando,
  campos,
  erroDoEmail,
  erroDaSenha,
  erroGeral,
  salvando,
  podeSalvar,
  tocar,
  salvar,
} = useFormularioUsuario(props.usuario)

async function enviar() {
  if (await salvar()) emit('salvo')
}
</script>

<template>
  <JanelaModal
    :titulo="editando ? 'Editar usuário' : 'Novo usuário'"
    :icone="editando ? 'bi-pencil' : 'bi-person-plus'"
    cor-do-icone="azul"
    @fechar="emit('fechar')"
  >
    <template #descricao>
      {{
        editando
          ? 'Altere o nome, o e-mail ou o perfil. A senha não muda por aqui.'
          : 'Quem for cadastrado já entra com a senha inicial e o perfil escolhido.'
      }}
    </template>

    <form class="flex flex-col gap-[30px]" novalidate @submit.prevent="enviar">
      <div class="flex flex-col gap-5">
        <CampoUsuario v-model="campos.nome" rotulo="Nome" />
        <CampoUsuario
          v-model="campos.email"
          rotulo="E-mail"
          tipo="email"
          :erro="erroDoEmail"
          @sair="tocar('email')"
        />
        <SeletorPerfil v-model="campos.perfil" />
        <CampoUsuario
          v-if="!editando"
          v-model="campos.senha"
          rotulo="Senha inicial"
          tipo="password"
          placeholder="Pelo menos 8 caracteres"
          :erro="erroDaSenha"
          @sair="tocar('senha')"
        />
      </div>

      <AlertaErro v-if="erroGeral" :mensagem="erroGeral" />

      <div class="flex gap-[15px]">
        <BotaoTexto variante="vazado" class="flex-1" @click="emit('fechar')">Cancelar</BotaoTexto>
        <BotaoTexto tipo="submit" class="flex-1" :disabled="!podeSalvar">
          {{ salvando ? 'Salvando...' : 'Salvar' }}
        </BotaoTexto>
      </div>
    </form>
  </JanelaModal>
</template>
