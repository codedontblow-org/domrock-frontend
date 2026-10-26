<script setup lang="ts">
defineProps<{
  mensagem?: string
  destaque?: string
  textoLink?: string
  href?: string
}>()
</script>

<template>
  <div class="aviso-campanhas" role="note">
    <i class="bi bi-exclamation-triangle aviso-icone"></i>

    <p class="aviso-texto">
      {{ mensagem || 'Para acompanhar quais são as' }}
      <strong>{{ destaque || 'campanhas em vigência' }}</strong>
      atualmente, consulte a página
      <a :href="href || '/vigente'" class="aviso-link">
        {{ textoLink || 'Vigente' }}
      </a>.
    </p>
  </div>
</template>

<style scoped>
.aviso-campanhas {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  padding: 10px 14px;
  border-left: 3px solid var(--color-blue);
  border-radius: 5px;
  background-color: var(--color-black-bg2);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  box-sizing: border-box;
}

.aviso-icone {
  flex-shrink: 0;
  color: var(--color-blue);
  font-size: 18px;
  line-height: 1;
}

.aviso-texto {
  margin: 0;
  font-size: var(--text-body);
  line-height: 1.4;
  font-weight: 400;
}

.aviso-texto strong {
  font-weight: 800;
}

.aviso-link {
  color: var(--color-blue);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.aviso-link:hover {
  opacity: 0.75;
}

@media (max-width: 600px) {
  .aviso-campanhas {
    align-items: flex-start;
    gap: 8px;
    padding: 10px;
  }

  .aviso-icone {
    margin-top: 2px;
    font-size: 16px;
  }

  .aviso-texto {
    font-size: var(--text-label);
    line-height: 1.5;
  }
}
</style>
