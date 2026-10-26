<script setup lang="ts">
import { computed } from 'vue'
import BotaoTexto from '@/components/BotaoTexto.vue'
import type { Usuario } from '@/types/usuarios'
import { useSituacaoUsuario } from '../useSituacaoUsuario'
import AlertaErro from '@/components/AlertaErro.vue'
import JanelaModal from '@/components/JanelaModal.vue'

// confirmar-desativacao do protótipo (2021:2277) e o estado de erro (2021:2350): a falha
// aparece dentro do modal e o botão vira "Tentar de novo". Reativar segue o mesmo molde em verde.
const props = defineProps<{ usuario: Usuario }>()
const emit = defineEmits<{ alterado: []; fechar: [] }>()

const { acao, erro, enviando, confirmar } = useSituacaoUsuario(props.usuario)
const desativando = acao === 'desativar'

const rotuloDoBotao = computed(() => {
  if (enviando.value) return 'Aguarde...'
  if (erro.value) return 'Tentar de novo'
  return desativando ? 'Desativar' : 'Reativar'
})

async function enviar() {
  if (await confirmar()) emit('alterado')
}
</script>

<template>
  <JanelaModal
    :titulo="`${desativando ? 'Desativar' : 'Reativar'} ${usuario.nome}?`"
    :icone="desativando ? 'bi-person-dash' : 'bi-person-check'"
    :cor-do-icone="desativando ? 'vermelho' : 'verde'"
    @fechar="emit('fechar')"
  >
    <template #descricao>
      <template v-if="desativando">
        {{ usuario.nome }} não vai mais conseguir entrar no Camplana. As campanhas e aprovações
        continuam no histórico, e dá para reativar depois.
      </template>
      <template v-else
        >{{ usuario.nome }} volta a entrar no Camplana com o mesmo perfil de antes.</template
      >
    </template>

    <AlertaErro v-if="erro" :mensagem="erro" />

    <div class="flex gap-[15px]">
      <BotaoTexto variante="vazado" class="flex-1" @click="emit('fechar')">Cancelar</BotaoTexto>
      <BotaoTexto
        :cor="desativando ? 'vermelho' : 'verde'"
        class="flex-1"
        :disabled="enviando"
        @click="enviar"
      >
        {{ rotuloDoBotao }}
      </BotaoTexto>
    </div>
  </JanelaModal>
</template>
