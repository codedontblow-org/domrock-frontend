<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import JanelaModal from '@/components/JanelaModal.vue'
import AvisoConflitos from './AvisoConflitos.vue'
import ConferenciaCampanha from './ConferenciaCampanha.vue'
import { NOME_MAXIMO, type ConferenciaCampanha as TipoConferencia } from '../conferencia'
import type { EtapaAprovacao } from '../types'

// Modal de compartilhamento da campanha (protótipos 388:760, 427:527 e 2022:3283; Leo, 27/10).
// Padrão da develop: recebe props da tela e emite eventos sem importar store.
const props = defineProps<{
  nomeInicial: string
  conferencia: TipoConferencia | null
  etapaAprovacao: EtapaAprovacao
  erroEnvio: string | null
}>()

const emit = defineEmits<{
  fechar: []
  compartilhar: [nome: string]
}>()

const nomeCampanha = ref(props.nomeInicial)

watch(
  () => props.nomeInicial,
  (novoNome) => {
    nomeCampanha.value = novoNome
  },
)

function fechar(): void {
  if (props.etapaAprovacao === 'enviando') return
  emit('fechar')
}

function publicar(): void {
  const nome = nomeCampanha.value.trim()
  if (!nome || props.etapaAprovacao === 'enviando') return
  emit('compartilhar', nome)
}
</script>

<template>
  <JanelaModal
    :titulo="etapaAprovacao === 'enviada' ? 'Campanha Compartilhada!' : 'Compartilhando Campanha'"
    :icone="etapaAprovacao === 'enviada' ? 'bi-cloud-check-fill' : 'bi-send-fill'"
    cor-do-icone="azul"
    @fechar="fechar"
  >
    <div v-if="etapaAprovacao === 'enviada'" class="modal-sucesso">
      <p class="modal-sucesso-texto">
        Parabéns! A campanha <em>{{ nomeCampanha }}</em> foi compartilhada com o time de
        supervisores e já está aguardando análise para aprovação.
      </p>
      <p class="modal-sucesso-link">
        Confira o status da sua campanha na
        <RouterLink :to="{ name: 'campanhas' }" class="link-campanhas">aba de campanhas</RouterLink
        >.
      </p>
      <div class="modal-acoes modal-acoes--sucesso">
        <button type="button" class="btn btn--fechar" @click="fechar">Fechar</button>
      </div>
    </div>

    <div v-else class="modal-formulario">
      <div class="campo-nome">
        <label for="campo-nome-campanha" class="campo-nome-rotulo">Nome da campanha</label>
        <input
          id="campo-nome-campanha"
          v-model="nomeCampanha"
          type="text"
          class="campo-nome-input"
          :maxlength="NOME_MAXIMO"
          placeholder="Nome da campanha"
          required
          :disabled="etapaAprovacao === 'enviando'"
        />
      </div>

      <p class="modal-explicacao">
        Compartilhe essa campanha para que ela entre numa fila de aprovação, aguardando para ser
        revisada por um supervisor e então entrar em vigência.
      </p>

      <details v-if="conferencia" class="modal-conferencia">
        <summary class="modal-conferencia-sumario">Conferir informações da campanha</summary>
        <ConferenciaCampanha :conferencia="conferencia" />
      </details>

      <AvisoConflitos :conflitos="conferencia?.conflitos" />

      <p v-if="etapaAprovacao === 'fora_do_orcamento'" class="aviso-orcamento" role="status">
        O custo passa do orçamento. Dá para enviar assim mesmo: o supervisor vê o estouro na
        análise.
      </p>

      <div class="aviso-privacidade">
        <i class="bi bi-exclamation-triangle" aria-hidden="true" />
        <span>Essa ação irá expor seu histórico de mensagens nesse chat.</span>
      </div>

      <p v-if="erroEnvio" class="erro-envio" role="alert">
        {{ erroEnvio }}
      </p>

      <div class="modal-acoes">
        <button
          type="button"
          class="btn btn--cancelar"
          :disabled="etapaAprovacao === 'enviando'"
          @click="fechar"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn--azul"
          :disabled="!nomeCampanha.trim() || etapaAprovacao === 'enviando'"
          @click="publicar"
        >
          {{ etapaAprovacao === 'enviando' ? 'Publicando…' : 'Publicar' }}
        </button>
      </div>
    </div>
  </JanelaModal>
</template>

<style scoped>
.modal-formulario,
.modal-sucesso {
  display: flex;
  flex-direction: column;
  gap: 18px;
  font-family: var(--font-raleway);
}

.campo-nome {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.campo-nome-rotulo {
  font-family: var(--font-inconsolata);
  font-size: 14px;
  font-weight: 400;
  color: var(--color-gray-txt2-dark);
}

.campo-nome-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: 6px;
  background-color: var(--color-black-bg1);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 14px;
}

.campo-nome-input:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: -1px;
}

.modal-explicacao,
.modal-sucesso-texto,
.modal-sucesso-link {
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  margin: 0;
}

.modal-sucesso-texto em {
  color: var(--color-white-txt1);
  font-style: italic;
  font-weight: 400;
}

.link-campanhas {
  color: var(--color-blue);
  text-decoration: underline;
  cursor: pointer;
}

.modal-conferencia {
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 6px;
  padding: 10px 12px;
  background-color: var(--color-black-bg1);
}

.modal-conferencia-sumario {
  color: var(--color-blue);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.aviso-orcamento {
  color: var(--color-orange);
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
}

.aviso-privacidade {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: var(--color-black-bg2);
  border: none;
  border-left: 2px solid var(--color-red);
  border-radius: 3px;
  font-family: var(--font-inconsolata);
  font-size: 14px;
  font-weight: 400;
  color: var(--color-gray-txt3-dark);
  line-height: 1.4;
}

.aviso-privacidade i {
  color: var(--color-red);
  font-size: 14px;
  flex-shrink: 0;
}

.erro-envio {
  color: var(--color-red);
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
}

.modal-acoes {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
  margin-top: 8px;
}

.modal-acoes .btn {
  flex: 1;
}

.modal-acoes--sucesso {
  width: 100%;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 15px;
  border-radius: 5px;
  font-family: var(--font-raleway);
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  cursor: pointer;
  text-align: center;
  box-sizing: border-box;
  transition:
    opacity 0.15s,
    background-color 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:focus-visible {
  outline: 2px solid var(--color-white-txt1);
  outline-offset: 2px;
}

.btn--cancelar,
.btn--fechar {
  border: 1px solid var(--color-gray-txt3-dark);
  background: transparent;
  color: var(--color-gray-txt3-dark);
}

.btn--cancelar:hover:not(:disabled),
.btn--fechar:hover:not(:disabled) {
  background-color: rgb(255 255 255 / 5%);
}

.btn--azul {
  border: 1px solid var(--color-blue);
  background-color: var(--color-blue);
  color: var(--color-black-bg1);
}

.btn--azul:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-blue) 85%, white);
}
</style>
