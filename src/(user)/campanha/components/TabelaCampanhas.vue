<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export interface Tabela {
  id?: string | number
  titulo: string
  inicio: string
  fim: string
  cargo?: string
  marca?: string
  percentual: string
}

const props = defineProps<{
  campanhas: Tabela[]
}>()

const ordenarPor = ref('inicio')
const ordem = ref('crescente')

// Paginação
const itensPorPagina = 10
const paginaAtual = ref(1)

function converterData(data: string): number {
  const valor = data.trim()

  // DD/MM/AAAA
  const brasileira = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (brasileira) {
    const dia = Number(brasileira[1])
    const mes = Number(brasileira[2])
    const ano = Number(brasileira[3])

    return new Date(ano, mes - 1, dia).getTime()
  }

  // AAAA-MM-DD
  const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (iso) {
    const ano = Number(iso[1])
    const mes = Number(iso[2])
    const dia = Number(iso[3])

    return new Date(ano, mes - 1, dia).getTime()
  }

  return Number.NaN
}

const campanhasOrdenadas = computed(() => {
  return [...props.campanhas].sort((a, b) => {
    const dataA = converterData(
      ordenarPor.value === 'inicio' ? a.inicio : a.fim,
    )

    const dataB = converterData(
      ordenarPor.value === 'inicio' ? b.inicio : b.fim,
    )

    if (Number.isNaN(dataA) || Number.isNaN(dataB)) {
      return 0
    }

    const resultado = dataA - dataB

    return ordem.value === 'crescente' ? resultado : -resultado
  })
})


const totalPaginas = computed(() => {
  return Math.ceil(campanhasOrdenadas.value.length / itensPorPagina)
})

// Campanhas exibidas na página atual
const campanhasPaginadas = computed(() => {
  const inicio = (paginaAtual.value - 1) * itensPorPagina
  const fim = inicio + itensPorPagina

  return campanhasOrdenadas.value.slice(inicio, fim)
})

const paginasVisiveis = computed<(number | string)[]>(() => {
  const total = totalPaginas.value
  const atual = paginaAtual.value

  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  if (atual <= 3) {
    return [1, 2, 3, '...', total]
  }

  if (atual >= total - 2) {
    return [1, '...', total - 2, total - 1, total]
  }

  return [1, '...', atual, '...', total]
})


watch([ordenarPor, ordem], () => {
  paginaAtual.value = 1
})


watch(totalPaginas, (total) => {
  if (paginaAtual.value > total) {
    paginaAtual.value = Math.max(1, total)
  }
})

function irParaPagina(pagina: number | string) {
  if (typeof pagina !== 'number') return
  if (pagina < 1 || pagina > totalPaginas.value) return

  paginaAtual.value = pagina
}

function paginaAnterior() {
  if (paginaAtual.value > 1) {
    paginaAtual.value--
  }
}

function proximaPagina() {
  if (paginaAtual.value < totalPaginas.value) {
    paginaAtual.value++
  }
}
</script>

<template>
  <section class="campaign-section">
    <div class="table-filters">
      <div class="filter-group">
        <label for="ordenar-por">Ordenando por</label>

        <select
          id="ordenar-por"
          v-model="ordenarPor"
          class="filter-select"
        >
          <option value="inicio">Data de Início</option>
          <option value="fim">Data de Término</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="ordem">em ordem</label>

        <select id="ordem" v-model="ordem" class="filter-select">
          <option value="crescente">Crescente</option>
          <option value="decrescente">Decrescente</option>
        </select>
      </div>
    </div>

    <div class="table-container">
      <table class="campaign-table">
        <thead>
          <tr>
            <th>
              <div class="th-content">
                <i class="bi bi-tag header-icon"></i>
                <span>Nome da Campanha</span>
              </div>
            </th>

            <th>
              <div class="th-content">
                <i class="bi bi-calendar-event header-icon"></i>
                <span>Data de Início</span>
              </div>
            </th>

            <th>
              <div class="th-content">
                <i class="bi bi-calendar-check header-icon"></i>
                <span>Data de Término</span>
              </div>
            </th>

            <th>
              <div class="th-content">
                <i class="bi bi-person-badge header-icon"></i>
                <span>Cargo</span>
              </div>
            </th>

            <th>
              <div class="th-content">
                <i class="bi bi-badge-tm header-icon"></i>
                <span>Marca</span>
              </div>
            </th>

            <th class="text-right">
              <div class="th-content justify-end">
                <i class="bi bi-percent header-icon"></i>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(item, index) in campanhasPaginadas"
            :key="item.id ?? `${paginaAtual}-${index}`"
          >
            <td class="col-titulo" :title="item.titulo">
              {{ item.titulo }}
            </td>

            <td class="col-data">
              {{ item.inicio }}
            </td>

            <td class="col-data">
              {{ item.fim }}
            </td>

            <td class="col-cargo" :title="item.cargo || 'Todos'">
              {{ item.cargo || 'Todos' }}
            </td>

            <td class="col-marca" :title="item.marca || 'Todos'">
              {{ item.marca || 'Todos' }}
            </td>

            <td class="col-percentual text-right">
              {{ item.percentual }}
            </td>
          </tr>

          <tr v-if="campanhasOrdenadas.length === 0">
            <td colspan="6" class="empty-state">
              Nenhuma campanha encontrada.
            </td>
          </tr>
        </tbody>
      </table>
    </div>


    <nav
      v-if="totalPaginas > 1"
      class="pagination"
      aria-label="Paginação das campanhas"
    >
      <button
        type="button"
        class="pagination-button navigation-button"
        :disabled="paginaAtual === 1"
        @click="paginaAnterior"
      >
        <i class="bi bi-chevron-left"></i>
        <span>Anterior</span>
      </button>

      <div class="pagination-pages">
        <template
          v-for="(pagina, index) in paginasVisiveis"
          :key="`${pagina}-${index}`"
        >
          <span
            v-if="pagina === '...'"
            class="pagination-ellipsis"
          >
            ...
          </span>

          <button
            v-else
            type="button"
            class="pagination-button page-button"
            :class="{ active: paginaAtual === pagina }"
            :aria-current="paginaAtual === pagina ? 'page' : undefined"
            @click="irParaPagina(pagina)"
          >
            {{ pagina }}
          </button>
        </template>
      </div>

      <button
        type="button"
        class="pagination-button navigation-button"
        :disabled="paginaAtual === totalPaginas"
        @click="proximaPagina"
      >
        <span>Próximo</span>
        <i class="bi bi-chevron-right"></i>
      </button>
    </nav>
  </section>
</template>

<style scoped>
.campaign-section {
  width: 100%;
  min-width: 0;
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
}

.table-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
}

.filter-select {
  min-height: 36px;
  padding: 8px 12px 8px 10px;
  border-radius: 5px;
  outline: none;
  background-color: var(--color-black-bg2);
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  cursor: pointer;
}

.filter-select:focus {
  border-color: var(--color-blue);
}

.filter-select option {
  background-color: var(--color-black-bg2);
  color: var(--color-white-txt1);
}

.table-container {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  background-color: var(--color-black-bg1);
  color: var(--color-white-txt1);
}

.campaign-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
}

.campaign-table thead th {
  padding: 14px 12px;
  border-bottom: 1px solid var(--color-gray-txt3-dark);
  color: var(--color-white-txt1);
  font-weight: 800;
  white-space: nowrap;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.campaign-table thead th .th-content span {
  font-family: var(--font-raleway);
  font-weight: 900;
}

.justify-end {
  justify-content: flex-end;
}

.header-icon {
  flex-shrink: 0;
  color: var(--color-gray-txt2-dark);
  font-size: 16px;
  line-height: 1;
}

.campaign-table tbody tr {
  border-bottom: 1px solid var(--color-gray-txt3-dark);
  transition: background-color 0.2s ease;
}

.campaign-table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

.campaign-table td {
  padding: 16px 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}

.col-titulo,
.col-data,
.col-cargo,
.col-marca,
.col-percentual {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  line-height: var(--text-label--line-height);
}

.col-data {
  min-width: 115px;
}

.col-cargo,
.col-marca {
  max-width: 150px;
}

.text-right {
  text-align: right;
}

.empty-state {
  padding: 24px 16px;
  color: var(--color-gray-txt2-dark);
  text-align: center;
  white-space: normal;
}


.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
  padding: 0 4px;
  font-family: var(--font-inconsolata);
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 28px;
  height: 28px;
  padding: 0 9px;
  border: none;
  border-radius: 4px;
  background-color: var(--color-black-bg2);
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.pagination-button:hover:not(:disabled):not(.active) {
  background-color: var(--color-gray-txt3-dark);
}

.pagination-button.active {
  background-color: var(--blue);
  color: var(--color-black-bg2);
}

.pagination-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.navigation-button {
  padding: 0 11px;
}

.pagination-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  color: var(--color-gray-txt2-dark);
  font-size: var(--text-label);
}

@media (max-width: 768px) {
  .campaign-table td,
  .campaign-table thead th {
    padding: 10px;
  }

  .pagination {
    justify-content: center;
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .pagination {
    gap: 4px;
  }

  .pagination-pages {
    gap: 4px;
  }

  .pagination-button {
    min-width: 26px;
    padding: 0 7px;
  }

  .navigation-button {
    gap: 4px;
    padding: 0 7px;
  }
}
</style>
