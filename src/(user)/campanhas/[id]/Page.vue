<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useCampanhasStore } from '../stores/campanhas'
import { useStatusCampanha } from '../useStatusCampanha'
import EtiquetaStatus from '../components/EtiquetaStatus.vue'
import BotoesCampanha from '../components/BotoesCampanha.vue'
import type { AcaoCampanha } from '../types'

const route = useRoute()
const store = useCampanhasStore()
const { campanhaAtual, carregando } = storeToRefs(store)
const { etiquetaVigencia } = useStatusCampanha()

const abaAtiva = ref<'ficha' | 'conversa' | 'trilha' | 'versoes'>('ficha')

const abas: Array<{ id: 'ficha' | 'conversa' | 'trilha' | 'versoes'; rotulo: string }> = [
  { id: 'ficha', rotulo: 'Ficha e resultado' },
  { id: 'conversa', rotulo: 'Conversa' },
  { id: 'trilha', rotulo: 'Trilha' },
  { id: 'versoes', rotulo: 'Versões' },
]

function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatarPeriodo(inicio: string | null | undefined, fim: string | null | undefined): string {
  if (!inicio || !fim) return '—'
  return `${formatarData(inicio)} – ${formatarData(fim)}`
}

function formatarMoeda(valor: number | null): string {
  if (valor === null) return '—'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function executarAcao(acao: AcaoCampanha) {
  if (!campanhaAtual.value) return
  await store.executarAcao(campanhaAtual.value.id, acao)
}

onMounted(() => {
  const id = Number(route.params.id)
  if (!Number.isNaN(id)) store.obter(id)
})
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
              {{ campanhaAtual.autor_nome }}
            </span>
            <span class="meta-periodo">
              <i class="bi bi-calendar3" aria-hidden="true" />
              {{ formatarPeriodo(campanhaAtual.periodo_inicio, campanhaAtual.periodo_fim) }}
            </span>
          </div>
        </div>

        <div class="header-acoes">
          <BotoesCampanha
            :pode-simular="true"
            :campanha-id="campanhaAtual.id"
            :status="campanhaAtual.status"
            :nome="campanhaAtual.nome"
            :versao="campanhaAtual.versao_atual"
            :salvando="false"
            @salvar="() => {}"
            @acao="executarAcao"
          />
        </div>
      </header>

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
        <!-- Aba: Ficha e resultado -->
        <div v-if="abaAtiva === 'ficha'">
          <section v-if="campanhaAtual.parametros.length" class="secao">
            <h2 class="secao-titulo">Parâmetros</h2>
            <dl class="params-lista">
              <div v-for="p in campanhaAtual.parametros" :key="p.key" class="param-item">
                <dt class="param-label">{{ p.label }}</dt>
                <dd class="param-valor">{{ p.value ?? '—' }}</dd>
              </div>
            </dl>
          </section>

          <section v-if="campanhaAtual.resultado_simulacao" class="secao">
            <h2 class="secao-titulo">Resultado da simulação</h2>
            <div class="resultado-grid">
              <div class="resultado-card">
                <span class="card-label">Custo incremental</span>
                <span class="card-valor">{{ formatarMoeda(campanhaAtual.resultado_simulacao.orcamento.custo_incremental) }}</span>
              </div>
              <div class="resultado-card">
                <span class="card-label">Orçamento limite</span>
                <span class="card-valor">{{ formatarMoeda(campanhaAtual.resultado_simulacao.orcamento.orcamento_limite) }}</span>
              </div>
              <div class="resultado-card">
                <span class="card-label">Folga</span>
                <span class="card-valor">{{ formatarMoeda(campanhaAtual.resultado_simulacao.orcamento.folga) }}</span>
              </div>
              <div class="resultado-card">
                <span class="card-label">Pessoas impactadas</span>
                <span class="card-valor">{{ campanhaAtual.resultado_simulacao.impacto.pessoas_impactadas }}</span>
              </div>
            </div>
            <p class="resultado-explicacao">{{ campanhaAtual.resultado_simulacao.explicacao }}</p>
          </section>

          <p v-if="!campanhaAtual.parametros.length && !campanhaAtual.resultado_simulacao" class="sem-dados">
            Nenhuma ficha ou resultado disponível.
          </p>
        </div>

        <!-- Aba: Conversa -->
        <div v-else-if="abaAtiva === 'conversa'" class="conversa-lista">
          <div
            v-for="msg in campanhaAtual.mensagens"
            :key="msg.id"
            class="msg-item"
            :class="`msg-item--${msg.papel}`"
          >
            <template v-if="msg.papel === 'sistema'">
              <span class="msg-sistema-linha" aria-hidden="true" />
              <span class="msg-sistema-texto">{{ msg.texto }}</span>
              <span class="msg-sistema-linha" aria-hidden="true" />
            </template>
            <template v-else>
              <span class="msg-papel">{{ msg.papel === 'usuario' ? 'Você' : 'Lana' }}</span>
              <p class="msg-texto">{{ msg.texto }}</p>
              <time class="msg-tempo" :datetime="msg.criada_em">{{ formatarData(msg.criada_em) }}</time>
            </template>
          </div>
          <p v-if="!campanhaAtual.mensagens.length" class="sem-dados">Nenhuma mensagem registrada.</p>
        </div>

        <!-- Aba: Trilha -->
        <div v-else-if="abaAtiva === 'trilha'">
          <p class="sem-dados">A trilha de auditoria será exibida aqui quando disponível.</p>
        </div>

        <!-- Aba: Versões -->
        <div v-else-if="abaAtiva === 'versoes'">
          <div class="versoes-tabela-wrapper">
            <table class="versoes-tabela">
              <thead>
                <tr>
                  <th class="th">Versão</th>
                  <th class="th">Status</th>
                  <th class="th">Criada em</th>
                  <th class="th">Decidida em</th>
                  <th class="th">Justificativa</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in campanhaAtual.versoes" :key="v.versao">
                  <td class="td">v{{ v.versao }}</td>
                  <td class="td">
                    <EtiquetaStatus :status="v.status" />
                  </td>
                  <td class="td">{{ formatarData(v.criada_em) }}</td>
                  <td class="td">{{ v.decidida_em ? formatarData(v.decidida_em) : '—' }}</td>
                  <td class="td">{{ v.justificativa ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="estado-vazio">
      <p>Campanha não encontrada.</p>
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

.conversa-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 0;
}

.msg-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.msg-item--usuario {
  align-items: flex-end;
}

.msg-item--agente {
  align-items: flex-start;
}

.msg-item--sistema {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.msg-papel {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.msg-texto {
  max-width: 600px;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: var(--color-black-bg2);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.msg-item--usuario .msg-texto {
  background-color: var(--color-blue);
}

.msg-tempo {
  color: var(--color-gray-txt3-dark);
  font-family: var(--font-raleway);
  font-size: 11px;
}

.msg-sistema-linha {
  flex: 1;
  height: 1px;
  background-color: rgb(255 255 255 / 10%);
}

.msg-sistema-texto {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 12px;
  white-space: nowrap;
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
