<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { formatarMoeda } from '../../chat/formatacao'
import { useCampanhasStore } from '../stores/campanhas'
import { useStatusCampanha } from '../useStatusCampanha'
import { diaDoInstante, periodoDaCampanha, valorDoParametro } from '../formatacao'
import EtiquetaStatus from '../components/EtiquetaStatus.vue'
import BotoesCampanha from '../components/BotoesCampanha.vue'
import ModalRenomearCampanha from '../components/ModalRenomearCampanha.vue'
import type { AcaoCampanha } from '../../campanha/types'

const route = useRoute()
const store = useCampanhasStore()
const { campanhaAtual, carregando, agindo, erro } = storeToRefs(store)
const { etiquetaVigencia } = useStatusCampanha()

const abaAtiva = ref<'ficha' | 'conversa' | 'trilha' | 'versoes'>('ficha')

const abas: Array<{ id: 'ficha' | 'conversa' | 'trilha' | 'versoes'; rotulo: string }> = [
  { id: 'ficha', rotulo: 'Ficha e resultado' },
  { id: 'conversa', rotulo: 'Conversa' },
  { id: 'trilha', rotulo: 'Trilha' },
  { id: 'versoes', rotulo: 'Versões' },
]

const renomeando = ref(false)
const simulacao = computed(() => campanhaAtual.value?.ultima_simulacao ?? null)

function executarAcao(acao: AcaoCampanha) {
  if (!campanhaAtual.value) return
  if (acao === 'RENOMEAR') {
    renomeando.value = true
    return
  }
  store.agir(campanhaAtual.value.id, acao)
}

async function renomear(nome: string) {
  renomeando.value = false
  if (campanhaAtual.value) await store.renomear(campanhaAtual.value.id, nome)
}

watch(() => route.params.id, (id) => {
  const numero = Number(id)
  if (Number.isInteger(numero)) store.obter(numero)
}, { immediate: true })
</script>

<template>
  <div class="detalhe-page">
    <div v-if="carregando" class="estado-carregando">
      <p>Carregando campanha…</p>
    </div>

    <template v-else-if="campanhaAtual">
      <div class="voltar-navegacao">
        <RouterLink to="/campanhas" class="voltar-link">
          <i class="bi bi-arrow-left" aria-hidden="true" />
          Voltar para Minhas Campanhas
        </RouterLink>
      </div>

      <header class="detalhe-header">
        <div class="header-info">
          <h1 class="detalhe-titulo">{{ campanhaAtual.nome }}</h1>
          <div class="header-meta">
            <EtiquetaStatus
              :status="campanhaAtual.status"
              :vigencia="etiquetaVigencia(campanhaAtual)"
            />
            <span class="meta-autor">
              <i class="bi bi-person" aria-hidden="true" />
              {{ campanhaAtual.autor.nome ?? '—' }}
            </span>
            <span class="meta-periodo">
              <i class="bi bi-calendar3" aria-hidden="true" />
              {{ periodoDaCampanha(campanhaAtual.periodo) }}
            </span>
            <span v-if="campanhaAtual.versao_atual !== null" class="meta-periodo">v{{ campanhaAtual.versao_atual }}</span>
          </div>
        </div>

        <div class="header-acoes">
          <BotoesCampanha
            :acoes="campanhaAtual.acoes"
            :status="campanhaAtual.status"
            :agindo="agindo"
            @acao="executarAcao"
          />
        </div>
      </header>

      <p v-if="erro" class="erro-acao" role="alert">{{ erro }}</p>

      <nav class="abas" role="tablist" aria-label="Seções da campanha">
        <button
          v-for="aba in abas"
          :key="aba.id"
          type="button"
          class="aba"
          :class="{ 'aba--ativa': abaAtiva === aba.id }"
          role="tab"
          :aria-selected="abaAtiva === aba.id"
          @click="abaAtiva = aba.id"
        >
          {{ aba.rotulo }}
        </button>
      </nav>

      <div class="aba-conteudo" role="tabpanel">
        <!-- Aba: Ficha e resultado (da última simulação concluída, contrato 5.2) -->
        <div v-if="abaAtiva === 'ficha'">
          <template v-if="simulacao">
            <section class="secao">
              <h2 class="secao-titulo">Parâmetros</h2>
              <dl class="params-lista">
                <div v-for="p in simulacao.regra.parametros" :key="p.key" class="param-item">
                  <dt class="param-label">{{ p.label }}</dt>
                  <dd class="param-valor">{{ valorDoParametro(p) }}</dd>
                </div>
              </dl>
            </section>

            <section class="secao">
              <h2 class="secao-titulo">Resultado da simulação</h2>
              <div class="resultado-grid">
                <div class="resultado-card">
                  <span class="card-label">Custo adicional</span>
                  <span class="card-valor">{{ formatarMoeda(simulacao.resultado.totais.diferenca) }}</span>
                </div>
                <!-- Orçamento é opcional (A6-72): sem ele, não há limite nem folga para mostrar. -->
                <template v-if="simulacao.resultado.orcamento">
                  <div class="resultado-card">
                    <span class="card-label">Orçamento limite</span>
                    <span class="card-valor">{{ formatarMoeda(simulacao.resultado.orcamento.orcamento_limite) }}</span>
                  </div>
                  <div class="resultado-card">
                    <span class="card-label">Folga</span>
                    <span class="card-valor">{{ formatarMoeda(simulacao.resultado.orcamento.folga) }}</span>
                  </div>
                </template>
                <div class="resultado-card">
                  <span class="card-label">Pessoas impactadas</span>
                  <span class="card-valor">{{ simulacao.resultado.impacto.pessoas_impactadas }}</span>
                </div>
              </div>
              <p class="resultado-explicacao">{{ simulacao.resultado.explicacao }}</p>
            </section>
          </template>

          <p v-else class="sem-dados">Nenhuma ficha ou resultado disponível.</p>
        </div>

        <!-- Aba: Conversa (contrato 3.2, A6-92) -->
        <div v-else-if="abaAtiva === 'conversa'">
          <RouterLink
            v-if="campanhaAtual"
            class="link-conversa"
            :to="{ name: 'chat', query: { campanha: campanhaAtual.id } }"
          >
            <i class="bi bi-chat-left-text" aria-hidden="true" />
            Abrir a conversa no chat
          </RouterLink>
          <p v-else class="sem-dados">Nenhuma conversa registrada.</p>
        </div>

        <!-- Aba: Trilha -->
        <div v-else-if="abaAtiva === 'trilha'">
          <p class="sem-dados">A trilha de auditoria será exibida aqui quando disponível.</p>
        </div>

        <!-- Aba: Versões -->
        <div v-else-if="abaAtiva === 'versoes'">
          <div v-if="campanhaAtual.versoes.length" class="versoes-tabela-wrapper">
            <table class="versoes-tabela">
              <thead>
                <tr>
                  <th class="th">Versão</th>
                  <th class="th">Status</th>
                  <th class="th">Submetida em</th>
                  <th class="th">Decidida em</th>
                  <th class="th">Justificativa</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in campanhaAtual.versoes" :key="v.numero">
                  <td class="td">v{{ v.numero }}</td>
                  <td class="td">
                    <EtiquetaStatus :status="v.status" />
                  </td>
                  <td class="td">{{ diaDoInstante(v.submetida_em) }}</td>
                  <td class="td">{{ diaDoInstante(v.decisao?.em ?? null) }}</td>
                  <td class="td">{{ v.decisao?.justificativa ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="sem-dados">A campanha ainda não foi submetida.</p>
        </div>
      </div>

      <ModalRenomearCampanha
        :aberto="renomeando"
        :nome-atual="campanhaAtual.nome"
        @confirmar="renomear"
        @cancelar="renomeando = false"
      />
    </template>

    <div v-else class="estado-vazio" :role="erro ? 'alert' : undefined">
      <p>{{ erro ?? 'Campanha não encontrada.' }}</p>
    </div>
  </div>
</template>

<style scoped>
.detalhe-page {
  padding: 32px 24px;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.voltar-navegacao {
  margin-bottom: -10px;
}

.voltar-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
  text-decoration: none;
  transition: color 0.15s;
}

.voltar-link:hover {
  color: var(--color-white-txt1);
}

.estado-carregando,
.estado-vazio {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 15px;
}

.detalhe-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.header-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detalhe-titulo {
  color: var(--color-white-txt1);
  font-family: var(--font-forum);
  font-size: 28px;
  font-weight: 400;
  margin: 0;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-autor,
.meta-periodo {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
}

.abas {
  display: flex;
  gap: 0;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
}

.aba {
  padding: 10px 18px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}

.aba--ativa {
  color: var(--color-white-txt1);
  border-bottom-color: var(--color-blue);
  font-weight: 600;
}

.aba:hover:not(.aba--ativa) {
  color: var(--color-white-txt1);
}

.aba:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: -2px;
}

.aba-conteudo {
  min-height: 200px;
}

.secao {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
}

.secao-titulo {
  color: var(--color-white-txt1);
  font-family: var(--font-forum);
  font-size: 20px;
  font-weight: 400;
  margin: 0;
}

.params-lista {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin: 0;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--color-black-bg2);
}

.param-label {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 12px;
}

.param-valor {
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: 14px;
}

.resultado-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.resultado-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border-radius: 8px;
  background-color: var(--color-black-bg2);
}

.card-label {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 12px;
}

.card-valor {
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: 18px;
  font-weight: 700;
}

.resultado-explicacao {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 14px;
  font-style: italic;
  margin: 0;
}

.sem-dados {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 14px;
  padding: 40px 0;
  text-align: center;
}


.link-conversa {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-blue);
  font-family: var(--font-raleway);
  font-size: 14px;
  text-decoration: none;
}

.link-conversa:hover {
  text-decoration: underline;
}

.erro-acao {
  margin: 0;
  padding: 10px 14px;
  border-radius: 6px;
  box-shadow: inset 3px 0 0 var(--color-red);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 14px;
}

.versoes-tabela-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid rgb(255 255 255 / 7%);
  margin-top: 12px;
}

.versoes-tabela {
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

@media (max-width: 640px) {
  .detalhe-page {
    padding: 20px 16px;
  }

  .detalhe-titulo {
    font-size: 22px;
  }

  .abas {
    overflow-x: auto;
  }
}
</style>
