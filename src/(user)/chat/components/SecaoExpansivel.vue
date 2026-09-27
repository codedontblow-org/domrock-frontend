<script setup lang="ts">
import { nextTick, ref, useId } from 'vue'

// Acordeão do resultado. Substitui o <details> nativo, que abre sem transição e deixa o
// conteúdo novo fora da tela: aqui a altura anima (0,25 s, como a sidebar) e, ao abrir,
// a página rola só o necessário para mostrar o que abriu.
withDefaults(defineProps<{ titulo: string; discreta?: boolean }>(), { discreta: false })

const aberta = ref(false)
const corpo = ref<HTMLElement | null>(null)
const idCorpo = useId()

function semAnimacao(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function mostrarConteudo(): void {
  corpo.value?.scrollIntoView({ behavior: semAnimacao() ? 'auto' : 'smooth', block: 'nearest' })
}

async function alternar(): Promise<void> {
  aberta.value = !aberta.value
  // Sem animação não há transitionend; rola logo depois de renderizar.
  if (aberta.value && semAnimacao()) {
    await nextTick()
    mostrarConteudo()
  }
}

function aoTerminarTransicao(evento: TransitionEvent): void {
  if (evento.target !== evento.currentTarget || !aberta.value) return
  mostrarConteudo()
}
</script>

<template>
  <section class="secao" :class="{ 'secao--aberta': aberta, 'secao--discreta': discreta }">
    <button type="button" class="secao-titulo" :aria-expanded="aberta" :aria-controls="idCorpo" @click="alternar">
      <span class="secao-seta" aria-hidden="true" />
      {{ titulo }}
    </button>
    <div :id="idCorpo" class="secao-grade" role="region" :aria-label="titulo" @transitionend="aoTerminarTransicao">
      <div ref="corpo" class="secao-corpo" :inert="aberta ? undefined : true">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.secao {
  border-top: 1px solid rgb(255 255 255 / 7%);
}

.secao--discreta {
  border-top: none;
}

.secao-titulo {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  border: none;
  background: none;
  color: var(--color-white-txt2);
  font-family: var(--font-raleway);
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

.secao--discreta .secao-titulo {
  width: auto;
  padding: 4px 0;
  color: var(--color-blue);
  font-weight: 400;
}

.secao-titulo:hover {
  color: var(--color-white-txt1);
}

.secao-titulo:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}

/* Seta que gira ao abrir, junto com a altura. */
.secao-seta {
  width: 6px;
  height: 6px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(-45deg);
  transition: transform 0.25s ease;
}

.secao--aberta > .secao-titulo .secao-seta {
  transform: rotate(45deg);
}

/* 0fr -> 1fr anima a altura real do conteúdo, sem medir em JS. */
.secao-grade {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 0.25s ease, opacity 0.2s ease;
}

.secao--aberta > .secao-grade {
  grid-template-rows: 1fr;
  opacity: 1;
}

.secao-corpo {
  min-height: 0;
  overflow: hidden;
  /* A caixa de mensagem fica fixa no rodapé; sem a margem, o fim do conteúdo ficaria atrás dela. */
  scroll-margin-bottom: 110px;
}

.secao-corpo > :deep(:first-child) {
  margin-top: 0;
}

.secao:not(.secao--discreta) .secao-corpo {
  padding-left: 14px;
}

.secao--aberta:not(.secao--discreta) > .secao-grade > .secao-corpo {
  padding-bottom: 16px;
}

@media (prefers-reduced-motion: reduce) {
  .secao-seta,
  .secao-grade {
    transition: none;
  }
}
</style>
