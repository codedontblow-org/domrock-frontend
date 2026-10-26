<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { renderizarMarkdown } from '../../chat/formatacao'
import { montarJustificativa } from '../montagem'
import type { AcaoVersao, CampanhaAprovacao, Interferencia } from '../types'

const props = defineProps<{
  campanha: CampanhaAprovacao | null
  decidindo?: boolean
  /** Etapa da re-simulação em andamento (contrato 4.2), ou null. */
  resimulando?: string | null
  erro?: string | null
}>()

const emit = defineEmits<{
  fechar: []
  aprovar: [campanha: CampanhaAprovacao]
  devolver: [campanha: CampanhaAprovacao, justificativa: string]
  resimular: [campanha: CampanhaAprovacao]
}>()

const expandido = ref(false)
const comentario = ref('')
const mencionadas = ref<Interferencia[]>([])
const botaoFechar = ref<HTMLButtonElement | null>(null)

// Os botões vêm das `acoes` da versão (contrato 5.6): o backend já tirou APROVAR com re-simulação pendente.
function temAcao(acao: AcaoVersao): boolean {
  return props.campanha?.acoes?.includes(acao) ?? false
}

const ocupado = computed(() => props.decidindo || Boolean(props.resimulando))
const podeDevolver = computed(() => temAcao('REPROVAR') && comentario.value.trim().length > 0 && !ocupado.value)
const podeAprovar = computed(() =>
  temAcao('APROVAR') && props.campanha?.detalhe === 'pronto' && !ocupado.value && comentario.value.trim().length === 0,
)

const descricaoHtml = computed(() => (props.campanha?.descricao ? renderizarMarkdown(props.campanha.descricao) : ''))

function estaMencionada(interferencia: Interferencia): boolean {
  return mencionadas.value.some((item) => item.id === interferencia.id)
}

function alternarMencao(interferencia: Interferencia): void {
  mencionadas.value = estaMencionada(interferencia)
    ? mencionadas.value.filter((item) => item.id !== interferencia.id)
    : [...mencionadas.value, interferencia]
}

function devolver(): void {
  if (!props.campanha || !podeDevolver.value) return
  emit('devolver', props.campanha, montarJustificativa(comentario.value, mencionadas.value))
}

function aoPressionarTecla(evento: KeyboardEvent): void {
  if (evento.key === 'Escape' && !props.decidindo) emit('fechar')
}

watch(
  () => props.campanha?.id,
  async (id) => {
    comentario.value = ''
    mencionadas.value = []

    if (id === undefined) {
      window.removeEventListener('keydown', aoPressionarTecla)
      return
    }

    window.addEventListener('keydown', aoPressionarTecla)
    await nextTick()
    botaoFechar.value?.focus()
  },
)

onBeforeUnmount(() => window.removeEventListener('keydown', aoPressionarTecla))
</script>

<template>
  <Teleport to="body">
    <Transition name="painel-fundo">
      <div v-if="campanha" class="painel-fundo" aria-hidden="true" @click="emit('fechar')" />
    </Transition>

    <Transition name="painel">
      <aside
        v-if="campanha"
        class="painel"
        :class="{ 'painel--expandido': expandido }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="painel-aprovacao-titulo"
      >
        <header class="painel-header">
          <button
            type="button"
            class="painel-icone"
            :aria-label="expandido ? 'Recolher painel' : 'Expandir painel'"
            @click="expandido = !expandido"
          >
            <i :class="expandido ? 'bi bi-arrows-angle-contract' : 'bi bi-arrows-angle-expand'"></i>
          </button>

          <h2 id="painel-aprovacao-titulo">Visualizando Campanha</h2>

          <button
            ref="botaoFechar"
            type="button"
            class="painel-icone"
            aria-label="Fechar painel"
            @click="emit('fechar')"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </header>

        <div class="painel-corpo">
          <section class="resumo">
            <div class="metadado metadado--linha">
              <span>Sugerido por {{ campanha.sugeridoPor }}</span>
              <span>{{ campanha.submetidoEm }}</span>
            </div>

            <h3 class="resumo-titulo">{{ campanha.titulo }}</h3>

            <p class="resumo-periodo">
              De {{ campanha.inicio }} até {{ campanha.fim }}
              <span v-if="campanha.duracaoDias" class="metadado">
                · {{ campanha.duracaoDias }} {{ campanha.duracaoDias === 1 ? 'Dia' : 'Dias' }} de duração.
              </span>
            </p>

            <!-- eslint-disable-next-line vue/no-v-html -- sanitizado em renderizarMarkdown -->
            <div v-if="descricaoHtml" class="resumo-descricao" v-html="descricaoHtml"></div>

            <RouterLink
              v-if="campanha.simulacaoId"
              class="link-chat"
              :to="{ name: 'chat', query: { simulacao: campanha.simulacaoId } }"
            >
              <i class="bi bi-chat-left-text-fill"></i>
              Link para o chat
            </RouterLink>
          </section>

          <p v-if="campanha.detalhe === 'carregando'" class="bloco bloco-ajuda">
            Carregando a simulação desta versão…
          </p>
          <p v-else-if="campanha.detalhe === 'indisponivel'" class="bloco bloco-ajuda" role="alert">
            Não foi possível carregar a simulação desta versão. Recarregue a página para tentar de novo.
          </p>

          <section v-if="campanha.acrescimos?.length" class="bloco">
            <h4>Acréscimo</h4>

            <dl class="acrescimos">
              <div
                v-for="item in campanha.acrescimos"
                :key="item.rotulo"
                :class="{ 'acrescimos-total': item.destaque }"
              >
                <dt>{{ item.rotulo }}</dt>
                <dd>{{ item.valor }}</dd>
              </div>
            </dl>
          </section>

          <section v-if="campanha.impacto?.length" class="bloco">
            <h4>Impacto</h4>

            <dl class="acrescimos">
              <div
                v-for="item in campanha.impacto"
                :key="item.rotulo"
                :class="{ 'acrescimos-total': item.destaque }"
              >
                <dt>{{ item.rotulo }}</dt>
                <dd>{{ item.valor }}</dd>
              </div>
            </dl>
          </section>

          <section v-if="campanha.marcas?.length" class="bloco">
            <h4>Marcas</h4>
            <ul class="chips">
              <li v-for="marca in campanha.marcas" :key="marca" class="chip">{{ marca }}</li>
            </ul>
          </section>

          <section v-if="campanha.cargos?.length" class="bloco">
            <h4>Cargos</h4>
            <ul class="chips">
              <li v-for="cargo in campanha.cargos" :key="cargo" class="chip">{{ cargo }}</li>
            </ul>
          </section>

          <section v-if="campanha.interferencias?.length" class="bloco">
            <h4>Interferências</h4>
            <p class="bloco-ajuda">
              Clique em + para adicionar a interferência como menção no comentário de devolução da campanha.
            </p>

            <ul class="interferencias">
              <li v-for="interferencia in campanha.interferencias" :key="interferencia.id">
                <button
                  type="button"
                  class="chip chip--botao"
                  :class="{ 'chip--ativo': estaMencionada(interferencia) }"
                  :aria-pressed="estaMencionada(interferencia)"
                  :aria-label="`Mencionar ${interferencia.tipo.toLowerCase()}: ${interferencia.descricao}`"
                  @click="alternarMencao(interferencia)"
                >
                  <i :class="estaMencionada(interferencia) ? 'bi bi-check-circle' : 'bi bi-plus-circle'"></i>
                  {{ interferencia.tipo }}
                </button>
                <span class="interferencia-descricao" :title="interferencia.descricao">
                  {{ interferencia.descricao }}
                </span>
              </li>
            </ul>
          </section>

          <section v-if="campanha.avisoResimulacao || campanha.custoResimulado" class="bloco">
            <h4>Simulação de novo</h4>
            <p v-if="campanha.avisoResimulacao" class="bloco-ajuda bloco-alerta" role="status">
              {{ campanha.avisoResimulacao }}
            </p>
            <dl v-if="campanha.custoResimulado" class="acrescimos">
              <div>
                <dt>Custo na submissão</dt>
                <dd>{{ campanha.custo }}</dd>
              </div>
              <div class="acrescimos-total">
                <dt>Custo simulado de novo</dt>
                <dd>{{ campanha.custoResimulado }}</dd>
              </div>
            </dl>
          </section>

          <section v-if="temAcao('REPROVAR')" class="bloco">
            <h4><label for="painel-aprovacao-comentario">Devolver campanha</label></h4>
            <p class="bloco-ajuda">
             Devolva a campanha caso algo precise mudar antes dela ser aprovada.
            </p>

            <div class="comentario">
              <textarea
                id="painel-aprovacao-comentario"
                v-model="comentario"
                placeholder="O que precisa mudar?"
                rows="3"
                :disabled="decidindo"
              ></textarea>

              <button
                type="button"
                class="comentario-enviar"
                aria-label="Devolver campanha com este comentário"
                :disabled="!podeDevolver"
                @click="devolver"
              >
                <i class="bi bi-arrow-right"></i>
              </button>
            </div>

            <ul v-if="mencionadas.length" class="interferencias">
              <li v-for="interferencia in mencionadas" :key="interferencia.id">
                <button
                  type="button"
                  class="chip chip--botao"
                  :aria-label="`Remover menção: ${interferencia.descricao}`"
                  @click="alternarMencao(interferencia)"
                >
                  <i class="bi bi-dash-circle"></i>
                  {{ interferencia.tipo }}
                </button>
                <span class="interferencia-descricao" :title="interferencia.descricao">
                  {{ interferencia.descricao }}
                </span>
              </li>
            </ul>
          </section>
        </div>

        <p v-if="erro" class="painel-erro" role="alert">{{ erro }}</p>

        <!-- Arquivar é do autor (só em RASCUNHO/REPROVADA): o Supervisor aprova, devolve ou simula de novo. -->
        <footer class="painel-acoes">
          <button v-if="temAcao('REPROVAR')" type="button" class="acao acao--devolver" :disabled="!podeDevolver"
            @click="devolver">
            Devolver campanha
          </button>
          <button v-if="temAcao('RESIMULAR')" type="button" class="acao acao--resimular" :disabled="ocupado"
            @click="emit('resimular', campanha)">
            {{ resimulando ?? 'Simular de novo' }}
          </button>
          <button v-if="temAcao('APROVAR')" type="button" class="acao acao--aprovar" :disabled="!podeAprovar"
            @click="emit('aprovar', campanha)">
            {{ decidindo ? 'Enviando…' : 'Aprovar campanha' }}
          </button>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.painel-fundo {
  position: fixed;
  inset: 0;
  z-index: 40;
  background-color: rgb(0 0 0 / 0.35);
}

.painel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 41;
  display: flex;
  flex-direction: column;
  width: min(420px, 100vw);
  background-color: var(--color-black-bg2);
  border-left: 1px solid var(--color-gray-txt3-dark);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  transition: width 0.25s ease;
}

.painel--expandido {
  width: min(760px, 100vw);
}

.painel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px 10px;
}

.painel-header h2 {
  flex: 1;
  margin: 0;
  font-size: var(--text-header-3);
  line-height: var(--text-header-3--line-height);
  font-weight: 400;
}

.painel-icone {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: none;
  color: var(--color-white-txt1);
  font-size: 16px;
  cursor: pointer;
}

.painel-icone:hover,
.painel-icone:focus-visible {
  background-color: var(--color-black-bg1);
}

.painel-corpo {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 4px 20px 20px;
  /* Rola com a roda/toque, mas sem a barra de rolagem visível */
  scrollbar-width: none;
}

.painel-corpo::-webkit-scrollbar {
  display: none;
}

/* Resumo */
.metadado {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-inconsolata);
  font-size: var(--text-metadata);
  line-height: var(--text-metadata--line-height);
}

.metadado--linha {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.resumo-titulo {
  margin: 10px 0 6px;
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
  font-weight: 600;
}

.resumo-periodo {
  margin: 0;
  font-size: var(--text-label);
  line-height: var(--text-label--line-height);
}

.resumo-descricao {
  margin: 10px 0 0;
  color: var(--color-gray-txt2-dark);
  font-size: var(--text-label);
  line-height: 1.5;
  font-style: italic;
}

.resumo-descricao :deep(p) {
  margin: 0 0 6px;
}

.painel-erro {
  margin: 0;
  padding: 10px 20px 0;
  color: var(--color-red);
  font-size: var(--text-label);
  line-height: 1.5;
}

.link-chat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding: 8px 12px;
  border: 1px solid var(--color-blue);
  border-radius: 999px;
  color: var(--color-blue);
  font-size: var(--text-label);
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.link-chat:hover,
.link-chat:focus-visible {
  background-color: var(--color-black-bg1);
}

/* Blocos */
.bloco {
  margin-top: 24px;
}

.bloco h4 {
  margin: 0 0 8px;
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
  font-weight: 600;
}

.bloco-ajuda {
  margin: 0 0 10px;
  color: var(--color-gray-txt2-dark);
  font-size: var(--text-label);
  line-height: 1.5;
}

.bloco-alerta {
  color: var(--color-orange);
}

.acrescimos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: 0;
}

.acrescimos dt {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-inconsolata);
  font-size: var(--text-metadata);
}

.acrescimos dd {
  margin: 0;
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
}

.acrescimos-total {
  margin-left: auto;
  text-align: right;
}

.acrescimos-total dt,
.acrescimos-total dd {
  color: var(--color-blue);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 3px;
  background-color: var(--color-black-bg1);
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: var(--text-metadata);
  line-height: var(--text-metadata--line-height);
  white-space: nowrap;
}

.chip--botao {
  flex-shrink: 0;
  border: 1px solid var(--color-gray-txt3-dark);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.chip--botao:hover,
.chip--botao:focus-visible {
  border-color: var(--color-blue);
}

.chip--ativo {
  border-color: var(--color-blue);
  color: var(--color-blue);
}

.interferencias {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.interferencias li {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.interferencia-descricao {
  overflow: hidden;
  color: var(--color-gray-txt2-dark);
  font-size: var(--text-label);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Devolução */
.comentario {
  position: relative;
}

.comentario textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 44px 8px 10px;
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 4px;
  background-color: var(--color-black-bg1);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: var(--text-label);
  resize: vertical;
}

.comentario textarea:focus {
  outline: none;
  border-color: var(--color-blue);
}

.comentario-enviar {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background-color: var(--color-gray-txt3-dark);
  color: var(--color-white-txt1);
  cursor: pointer;
}

.comentario-enviar:not(:disabled):hover {
  background-color: var(--color-blue);
}

.comentario-enviar:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Ações */
.painel-acoes {
  display: flex;
  gap: 10px;
  padding: 14px 20px 18px;
  border-top: 1px solid var(--color-gray-txt3-dark);
}

.acao {
  flex: 1;
  padding: 9px 12px;
  border-radius: 999px;
  font-family: var(--font-raleway);
  font-size: var(--text-label);
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s ease;
}

.acao:not(:disabled):hover,
.acao:focus-visible {
  filter: brightness(1.15);
}

.acao:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

.acao--devolver {
  border: 1px solid var(--color-red);
  background: none;
  color: var(--color-red);
}

.acao--resimular {
  border: 1px solid var(--color-blue);
  background: none;
  color: var(--color-blue);
}

.acao--aprovar {
  border: 1px solid var(--color-blue);
  background-color: var(--color-blue);
  color: var(--color-black-txt1);
}

/* Transições */
.painel-enter-active,
.painel-leave-active {
  transition: transform 0.25s ease;
}

.painel-enter-from,
.painel-leave-to {
  transform: translateX(100%);
}

.painel-fundo-enter-active,
.painel-fundo-leave-active {
  transition: opacity 0.25s ease;
}

.painel-fundo-enter-from,
.painel-fundo-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .painel,
  .painel-enter-active,
  .painel-leave-active,
  .painel-fundo-enter-active,
  .painel-fundo-leave-active {
    transition: none;
  }
}

@media (max-width: 600px) {
  .painel-header,
  .painel-corpo,
  .painel-acoes {
    padding-left: 16px;
    padding-right: 16px;
  }

  .painel-acoes {
    flex-direction: column-reverse;
  }
}
</style>
