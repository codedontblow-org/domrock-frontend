<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useCampanhasStore } from './stores/campanhas'
import { useStatusCampanha } from './useStatusCampanha'
import EtiquetaStatus from './components/EtiquetaStatus.vue'
import type { StatusCampanha } from './types'

const router = useRouter()
const store = useCampanhasStore()
const { campanhsFiltradas, carregando, filtroStatus } = storeToRefs(store)
const { etiquetaVigencia } = useStatusCampanha()

const filtros: Array<{ valor: StatusCampanha | 'TODOS'; rotulo: string }> = [
  { valor: 'TODOS', rotulo: 'Todos' },
  { valor: 'RASCUNHO', rotulo: 'Rascunho' },
  { valor: 'AGUARDANDO_APROVACAO', rotulo: 'Aguardando' },
  { valor: 'APROVADA', rotulo: 'Aprovada' },
  { valor: 'REPROVADA', rotulo: 'Reprovada' },
  { valor: 'ARQUIVADA', rotulo: 'Arquivada' },
]

function formatarData(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatarMoeda(valor: number | null): string {
  if (valor === null) return '—'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarPeriodo(inicio: string, fim: string): string {
  if (!inicio || !fim) return '—'
  return `${formatarData(inicio)} – ${formatarData(fim)}`
}

function irParaDetalhe(id: number) {
  router.push(`/campanhas/${id}`)
}

onMounted(() => store.listar())
</script>

<template>
  <div class="campanhas-page">
    <header class="page-header">
      <h1 class="page-titulo">Minhas Campanhas</h1>
    </header>

    <nav class="filtros" aria-label="Filtrar campanhas por status">
      <button
        v-for="f in filtros"
        :key="f.valor"
        type="button"
        class="filtro-chip"
        :class="{ 'filtro-chip--ativo': filtroStatus === f.valor }"
        @click="filtroStatus = f.valor"
      >
        {{ f.rotulo }}
      </button>
    </nav>

    <div v-if="carregando" class="estado-vazio">
      <p>Carregando campanhas…</p>
    </div>

    <div v-else-if="campanhsFiltradas.length === 0" class="estado-vazio">
      <i class="bi bi-inbox estado-vazio-icone" aria-hidden="true" />
      <p>Nenhuma campanha encontrada.</p>
    </div>

    <div v-else class="tabela-wrapper">
      <table class="tabela" role="table">
        <thead>
          <tr>
            <th class="th">Nome</th>
            <th class="th">Período</th>
            <th class="th">Status</th>
            <th class="th th--ocultar-mobile">Versão</th>
            <th class="th">Custo adicional</th>
            <th class="th th--ocultar-mobile">Atualizada em</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in campanhsFiltradas"
            :key="c.id"
            class="tr-linha"
            tabindex="0"
            role="button"
            :aria-label="`Ver detalhes de ${c.nome}`"
            @click="irParaDetalhe(c.id)"
            @keydown.enter="irParaDetalhe(c.id)"
            @keydown.space.prevent="irParaDetalhe(c.id)"
          >
            <td class="td">
              <span class="nome-campanha">{{ c.nome }}</span>
              <span class="custo-mobile">{{ formatarMoeda(c.custo_incremental) }}</span>
            </td>
            <td class="td td--periodo">{{ formatarPeriodo(c.periodo_inicio, c.periodo_fim) }}</td>
            <td class="td">
              <EtiquetaStatus :status="c.status" :vigencia="etiquetaVigencia(c)" />
            </td>
            <td class="td td--ocultar-mobile">v{{ c.versao_atual }}</td>
            <td class="td td--moeda td--ocultar-mobile-inline">{{ formatarMoeda(c.custo_incremental) }}</td>
            <td class="td td--ocultar-mobile">{{ formatarData(c.atualizada_em) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.campanhas-page {
  padding: 32px 24px;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-titulo {
  color: var(--color-white-txt1);
  font-family: var(--font-forum);
  font-size: 32px;
  font-weight: 400;
  margin: 0;
}

.filtros {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filtro-chip {
  padding: 5px 14px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 999px;
  background-color: transparent;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.filtro-chip--ativo {
  background-color: var(--color-blue);
  border-color: var(--color-blue);
  color: var(--color-black-bg1);
  font-weight: 600;
}

.filtro-chip:not(.filtro-chip--ativo):hover {
  border-color: var(--color-white-txt1);
  color: var(--color-white-txt1);
}

.filtro-chip:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}

.estado-vazio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 0;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 15px;
}

.estado-vazio-icone {
  font-size: 40px;
}

.tabela-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid rgb(255 255 255 / 7%);
}

.tabela {
  width: 100%;
  border-collapse: collapse;
}

.th {
  padding: 10px 14px;
  text-align: left;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid rgb(255 255 255 / 7%);
  white-space: nowrap;
}

.td {
  padding: 12px 14px;
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 14px;
  border-bottom: 1px solid rgb(255 255 255 / 5%);
  vertical-align: middle;
}

.td--moeda {
  font-family: var(--font-inconsolata);
  font-size: 13px;
  white-space: nowrap;
}

.td--periodo {
  white-space: nowrap;
  color: var(--color-gray-txt2-dark);
  font-size: 13px;
}

.tr-linha {
  cursor: pointer;
  transition: background-color 0.12s;
}

.tr-linha:hover {
  background-color: rgb(255 255 255 / 3%);
}

.tr-linha:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: -2px;
}

.nome-campanha {
  display: block;
  font-weight: 600;
}

.custo-mobile {
  display: none;
  font-family: var(--font-inconsolata);
  font-size: 12px;
  color: var(--color-gray-txt2-dark);
  margin-top: 2px;
}

@media (max-width: 640px) {
  .campanhas-page {
    padding: 20px 16px;
  }

  .th--ocultar-mobile,
  .td--ocultar-mobile {
    display: none;
  }

  .td--ocultar-mobile-inline {
    display: none;
  }

  .custo-mobile {
    display: block;
  }
}
</style>
