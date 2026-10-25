
<script setup lang="ts">
import TabelaCampanhas, { type Tabela } from './components/TabelaCampanhas.vue'
import AvisoCampanha from './components/AvisoCampanha.vue'
import CarrosselCampanha from './components/CarrosselCampanha.vue'
import PainelAprovacao from './components/PainelAprovacao.vue'
import { computed, onMounted, ref } from 'vue'
import { api } from '@/services/api'
import { descreverFalha } from '../chat/services/campanha'
import { criarServicoCampanhas } from './services/campanhas'
import { cartaoDaFila, cartaoDeMinhas, comVersao, linhaAprovada } from './montagem'
import type { CampanhaAprovacao, PedidoDecisao } from './types'

const servico = criarServicoCampanhas(api)
const ehSupervisor = localStorage.getItem('perfil') === 'SUPERVISOR'
const nomeLogado = JSON.parse(localStorage.getItem('usuario') ?? 'null')?.nome ?? 'Você'

const campanhasAprovacao = ref<CampanhaAprovacao[]>([])
const carregandoFila = ref(true)
const erroFila = ref<string | null>(null)

function substituir(id: number, mudar: (campanha: CampanhaAprovacao) => CampanhaAprovacao) {
  campanhasAprovacao.value = campanhasAprovacao.value.map((campanha) => (campanha.id === id ? mudar(campanha) : campanha))
}

async function carregarFila() {
  carregandoFila.value = true
  erroFila.value = null
  try {
    campanhasAprovacao.value = ehSupervisor
      ? (await servico.fila()).map(cartaoDaFila)
      : (await servico.minhas('AGUARDANDO_APROVACAO')).map((item) => cartaoDeMinhas(item, nomeLogado))
  } catch (erro) {
    erroFila.value = descreverFalha(erro)
    return
  } finally {
    carregandoFila.value = false
  }

  await Promise.allSettled(campanhasAprovacao.value.map(async (cartao) => {
    if (cartao.versao === null) return
    try {
      const versao = await servico.versao(cartao.id, cartao.versao)
      substituir(cartao.id, (atual) => comVersao(atual, versao))
    } catch {
      substituir(cartao.id, (atual) => ({ ...atual, detalhe: 'indisponivel' }))
    }
  }))
}

onMounted(carregarFila)

const idSelecionado = ref<number | null>(null)
const campanhaSelecionada = computed(
  () => campanhasAprovacao.value.find((campanha) => campanha.id === idSelecionado.value) ?? null,
)
const decidindo = ref(false)
const erroDecisao = ref<string | null>(null)

function abrirCampanha(campanha: CampanhaAprovacao) {
  idSelecionado.value = campanha.id
  erroDecisao.value = null
}

function fecharCampanha() {
  idSelecionado.value = null
  erroDecisao.value = null
}

async function decidir(campanha: CampanhaAprovacao, decisao: PedidoDecisao['decisao'], justificativa: string | null) {
  // Sem versão carregada não há o que decidir: o painel já deixa os botões inativos.
  if (campanha.versao === null) return
  decidindo.value = true
  erroDecisao.value = null
  try {
    await servico.decidir(campanha.id, { versao: campanha.versao, decisao, justificativa })
    campanhasAprovacao.value = campanhasAprovacao.value.filter((item) => item.id !== campanha.id)
    fecharCampanha()
    // A aprovada passa a aparecer em Campanhas Passadas sem recarregar a página.
    if (decisao === 'APROVAR') carregarPassadas()
  } catch (erro) {
    erroDecisao.value = descreverFalha(erro)
  } finally {
    decidindo.value = false
  }
}

const aprovarCampanha = (campanha: CampanhaAprovacao) => decidir(campanha, 'APROVAR', null)
const devolverCampanha = (campanha: CampanhaAprovacao, justificativa: string) =>
  decidir(campanha, 'REPROVAR', justificativa)

// Campanhas Passadas: as aprovadas, de todos os autores (GET /api/campanhas/aprovadas).
const campanhasPassadas = ref<Tabela[]>([])
const carregandoPassadas = ref(true)
const erroPassadas = ref<string | null>(null)

async function carregarPassadas() {
  carregandoPassadas.value = true
  erroPassadas.value = null
  try {
    campanhasPassadas.value = (await servico.aprovadas()).map(linhaAprovada)
  } catch (erro) {
    erroPassadas.value = descreverFalha(erro)
  } finally {
    carregandoPassadas.value = false
  }
}

onMounted(carregarPassadas)
</script>

<template>
  <main class="page">
    <section class="intro-section">
      <header class="page-header">
        <h1>Campanhas</h1>
      </header>

      <div class="notice-section">
        <AvisoCampanha />
      </div>
    </section>

    <section class="approvals-section">
      <header class="section-header">
        <h2>Aguardando Aprovação</h2>

        <p v-if="ehSupervisor" class="section-description">
          Você está visualizando como um Supervisor! Clique em uma campanha para ver mais detalhes,
          aprovar ou devolver.
        </p>
        <p v-else class="section-description">
          Sugestões de campanhas que estão aguardando aprovação de um supervisor.
        </p>
      </header>

      <p v-if="carregandoFila" class="estado-fila">Carregando campanhas…</p>

      <div v-else-if="erroFila" class="estado-fila estado-fila--erro" role="alert">
        <span>{{ erroFila }}</span>
        <button type="button" class="estado-fila-acao" @click="carregarFila">Tentar de novo</button>
      </div>

      <p v-else-if="campanhasAprovacao.length === 0" class="estado-fila">
        Nenhuma campanha aguardando aprovação.
      </p>

      <CarrosselCampanha
        v-else
        :campanhas="campanhasAprovacao"
        :selecionavel="ehSupervisor"
        @selecionar="abrirCampanha"
      />
    </section>

    <section class="campaigns-section">
      <header class="section-header">
        <h2>Campanhas Passadas</h2>

        <p class="section-description">
          Clique em uma campanha na tabela abaixo para ver informações
          mais detalhadas e visualizar o chat que a gerou.
        </p>
      </header>

      <p v-if="carregandoPassadas" class="estado-fila">Carregando campanhas…</p>

      <div v-else-if="erroPassadas" class="estado-fila estado-fila--erro" role="alert">
        <span>{{ erroPassadas }}</span>
        <button type="button" class="estado-fila-acao" @click="carregarPassadas">Tentar de novo</button>
      </div>

      <p v-else-if="campanhasPassadas.length === 0" class="estado-fila">Nenhuma campanha aprovada ainda.</p>

      <TabelaCampanhas v-else :campanhas="campanhasPassadas" />
    </section>

    <PainelAprovacao
      v-if="ehSupervisor"
      :campanha="campanhaSelecionada"
      :decidindo="decidindo"
      :erro="erroDecisao"
      @fechar="fecharCampanha"
      @aprovar="aprovarCampanha"
      @devolver="devolverCampanha"
    />
  </main>
</template>

<style scoped>
.page {
  width: 100%;
  max-width: 1440px;
  min-width: 0;
  margin: 0 auto;
  padding: 40px 16px 32px;
  box-sizing: border-box;

  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
}

.intro-section {
  margin-bottom: 52px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: var(--text-header-1);
  line-height: var(--text-header-1--line-height);
  font-family: var(--font-forum);
}

.notice-section {
  margin: 0;
}

.approvals-section {
  margin-bottom: 56px;
}

.campaigns-section {
  margin-bottom: 24px;
}

.section-header {
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0 0 8px;
  font-size: var(--text-header-2);
  line-height: var(--text-header-2--line-height);
  font-weight: 800;
}

.estado-fila {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 24px 0;
  color: var(--color-gray-txt2-dark);
  font-size: var(--text-body);
}

.estado-fila--erro {
  color: var(--color-red);
}

.estado-fila-acao {
  padding: 6px 12px;
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 999px;
  background: none;
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: var(--text-label);
  cursor: pointer;
}

.estado-fila-acao:hover,
.estado-fila-acao:focus-visible {
  border-color: var(--color-blue);
}

.section-description {
  margin: 0;
  color: var(--color-gray-txt2-dark);
  font-size: var(--text-body);
  line-height: 1.5;
  font-weight: 400;
}

@media (max-width: 1366px) {
  .page {
    padding: 32px 16px 24px;
  }

  .intro-section {
    margin-bottom: 40px;
  }

  .approvals-section {
    margin-bottom: 44px;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 32px 12px 24px;
  }

  .intro-section {
    margin-bottom: 42px;
  }

  .page-header {
    margin-bottom: 16px;
  }

  .page-header h1 {
    font-size: var(--text-header-2);
    line-height: var(--text-header-2--line-height);
  }

  .approvals-section {
    margin-bottom: 44px;
  }

  .section-header {
    margin-bottom: 14px;
  }
}

@media (max-width: 600px) {
  .page {
    padding: 26px 10px 20px;
  }

  .intro-section {
    margin-bottom: 36px;
  }

  .page-header {
    margin-bottom: 14px;
  }

  .approvals-section {
    margin-bottom: 38px;
  }

  .section-header {
    margin-bottom: 12px;
  }

  .section-header h2 {
    margin-bottom: 6px;
    font-size: var(--text-header-3);
    line-height: var(--text-header-3--line-height);
  }

  .section-description {
    font-size: var(--text-label);
    line-height: 1.5;
  }
}
</style>
