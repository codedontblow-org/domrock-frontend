<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import ListaCampanha from './ListaCampanha.vue'
import type { DetalheAprovada } from '../montagem'

const props = defineProps<{
  campanha: DetalheAprovada | null
}>()

const emit = defineEmits<{
  fechar: []
}>()

const botaoFechar = ref<HTMLButtonElement | null>(null)

function aoPressionarTecla(evento: KeyboardEvent): void {
  if (evento.key === 'Escape') emit('fechar')
}

watch(
  () => props.campanha,
  async (campanha) => {
    window.removeEventListener('keydown', aoPressionarTecla)

    if (!campanha) return

    window.addEventListener('keydown', aoPressionarTecla)

    await nextTick()
    botaoFechar.value?.focus()
  },
)

onBeforeUnmount(() => window.removeEventListener('keydown', aoPressionarTecla))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="campanha"
        class="modal-fundo"
        @click.self="emit('fechar')"
      >
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          :aria-label="`Campanha ${campanha.titulo}`"
        >
          <button
            ref="botaoFechar"
            type="button"
            class="modal-fechar"
            aria-label="Fechar"
            @click="emit('fechar')"
          >
            <i class="bi bi-x-lg"></i>
          </button>

          <div class="modal-conteudo">
            <ListaCampanha v-bind="campanha" />

            <RouterLink
              class="link-chat"
              :to="{ name: 'chat', query: { simulacao: campanha.simulacaoId } }"
            >
              <i class="bi bi-chat-left-text-fill"></i>
              Link para o chat
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fundo {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: rgb(0 0 0 / 0.5);
}

.modal {
  position: relative;
  width: min(680px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 24px;
  border: 1px solid var(--color-black-bg1);
  border-radius: 16px;
  background-color: var(--color-black-bg2);
  box-shadow: 0 12px 40px rgb(0 0 0 / 0.3);
}

.modal-conteudo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  padding-top: 28px;
  box-sizing: border-box;
}


.modal-conteudo > :deep(*) {
  max-width: 100%;
}


.link-chat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  border: 1px solid var(--color-blue);
  border-radius: 999px;
  background-color: var(--color-black-bg2);
  color: var(--color-blue);
  font-family: var(--font-raleway);
  font-size: var(--text-label);
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.link-chat:hover,
.link-chat:focus-visible {
  background-color: var(--color-black-bg1);
}

.modal-fechar {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--color-white-txt1);
  font-size: 16px;
  cursor: pointer;
}

.modal-fechar:hover,
.modal-fechar:focus-visible {
  background-color: var(--color-black-bg1);
}

.modal :deep(.card-heading) {
  padding-right: 32px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}


@media (max-width: 600px) {
  .modal-fundo {
    padding: 12px;
  }

  .modal {
    width: 100%;
    max-height: calc(100vh - 24px);
    padding: 20px 16px;
    border-radius: 12px;
  }

  .modal-conteudo {
    gap: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active {
    transition: none;
  }
}
</style>
```