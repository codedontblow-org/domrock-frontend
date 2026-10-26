<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  aberto: boolean
}>()

const emit = defineEmits<{
  confirmar: [nome: string]
  cancelar: []
}>()

const nome = ref('')
const erro = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function validar(): boolean {
  if (!nome.value.trim()) {
    erro.value = 'O nome da campanha é obrigatório.'
    return false
  }
  if (nome.value.trim().length < 3) {
    erro.value = 'O nome deve ter pelo menos 3 caracteres.'
    return false
  }
  erro.value = ''
  return true
}

function confirmar() {
  if (!validar()) return
  emit('confirmar', nome.value.trim())
  nome.value = ''
  erro.value = ''
}

function cancelar() {
  nome.value = ''
  erro.value = ''
  emit('cancelar')
}

function onKeydown(event: KeyboardEvent) {
  if (!props.aberto) return
  if (event.key === 'Escape') cancelar()
  if (event.key === 'Tab') trapFocus(event)
}

function trapFocus(event: KeyboardEvent) {
  const modal = document.getElementById('modal-salvar')
  if (!modal) return
  const focusable = modal.querySelectorAll<HTMLElement>(
    'button, input, [tabindex]:not([tabindex="-1"])',
  )
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

watch(
  () => props.aberto,
  (v) => {
    if (v) {
      setTimeout(() => inputRef.value?.focus(), 50)
    }
  },
)

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="aberto" class="overlay" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" @click.self="cancelar">
      <div id="modal-salvar" class="modal">
        <h2 id="modal-titulo" class="modal-titulo">Salvar campanha</h2>

        <div class="modal-corpo">
          <label for="nome-campanha" class="campo-label">Nome da campanha</label>
          <input
            id="nome-campanha"
            ref="inputRef"
            v-model="nome"
            type="text"
            class="campo-input"
            :class="{ 'campo-input--erro': erro }"
            placeholder="Ex: Black Friday 2025"
            autocomplete="off"
            @keydown.enter="confirmar"
          />
          <p v-if="erro" class="campo-erro" role="alert">{{ erro }}</p>
        </div>

        <footer class="modal-rodape">
          <button type="button" class="btn btn--secundario" @click="cancelar">Cancelar</button>
          <button type="button" class="btn btn--primario" @click="confirmar">Salvar</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(0 0 0 / 60%);
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 420px;
  background-color: var(--color-black-bg2);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-titulo {
  color: var(--color-white-txt1);
  font-family: var(--font-forum);
  font-size: 22px;
  font-weight: 400;
  margin: 0;
}

.modal-corpo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.campo-label {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
}

.campo-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 6px;
  background-color: var(--color-black-bg1);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s;
}

.campo-input:focus {
  border-color: var(--color-blue);
}

.campo-input--erro {
  border-color: var(--color-red);
}

.campo-erro {
  color: var(--color-red);
  font-family: var(--font-raleway);
  font-size: 12px;
  margin: 0;
}

.modal-rodape {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 9px 20px;
  border: none;
  border-radius: 6px;
  font-family: var(--font-raleway);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn--primario {
  background-color: var(--color-blue);
  color: var(--color-black-bg1);
}

.btn--secundario {
  background-color: rgb(255 255 255 / 8%);
  color: var(--color-white-txt1);
}

.btn:hover {
  opacity: 0.85;
}

.btn:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}
</style>
