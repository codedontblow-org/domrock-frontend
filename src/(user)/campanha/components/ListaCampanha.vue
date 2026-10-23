<script setup lang="ts">
export interface ListaCampanha {
  titulo: string
  inicio: string
  fim: string
  percentual: string
  retorno: string
  investimento: string
  sugeridoPor: string
  submetidoEm: string
  cargosEProdutos: string
  status?: string
}

defineProps<ListaCampanha>()

</script>

<template>
  <article class="approval-card">
    <div class="card-content">
      <div class="card-heading">
        <h3 :title="titulo">{{ titulo }}</h3>
      </div>

      <div class="campaign-info">
        <span>De {{ inicio }} até {{ fim }}</span>
        <span class="status">{{ status ?? 'Sem conflitos' }}</span>
      </div>

      <div class="metrics">
        <div class="metric">
          <i class="bi bi-percent metric-icon"></i>

          <div class="metric-content">
            <p>
              Acréscimo de
              <strong>{{ percentual }}</strong>
            </p>
            <small>{{ cargosEProdutos }}</small>
          </div>
        </div>

        <div class="metric">
          <i class="bi bi-cash-stack metric-icon"></i>

          <div class="metric-content">
            <p>
              Retorna
              <strong>{{ retorno }}</strong>
            </p>
            <small>Investindo {{ investimento }}.</small>
          </div>
        </div>
      </div>
    </div>

    <footer class="card-footer">
      <span>Sugerido por {{ sugeridoPor }}</span>
      <span>Submetido em {{ submetidoEm }}</span>
    </footer>
  </article>
</template>

<style scoped>
.approval-card {
  width: 100%;
  max-width: 500px;
  min-width: 0;
  overflow: hidden;
  background-color: var(--color-black-bg2);
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 5px;
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
}

.card-content {
  padding: 20px 23px 15px;
}

.card-heading h3 {
  overflow: hidden;
  margin: 0;
  font-family: var(--font-raleway);
  font-size: var(--text-header-3);
  font-weight: 400;
  line-height: var(--text-header-3--line-height);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.campaign-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-inconsolata);
  font-size: var(--text-metadata);
  line-height: var(--text-metadata--line-height);
}

.status {
  flex-shrink: 0;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 50px;
  margin-top: 20px;
}

.metric {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.metric-icon {
  flex-shrink: 0;
  color: var(--color-gray-txt2-dark);
  font-size: 36px;
  line-height: 1;
}

.metric-content {
  min-width: 0;
}

.metric-content p {
  margin: 0;
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
  white-space: nowrap;
}

.metric-content strong {
  color: var(--color-blue);
  font-weight: 700;
}

.metric-content small {
  display: block;
  overflow: hidden;
  margin-top: 5px;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-inconsolata);
  font-size: var(--text-metadata);
  line-height: var(--text-metadata--line-height);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 23px;
  border-top: 1px solid var(--color-gray-txt3-dark);
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-inconsolata);
  font-size: var(--text-metadata);
  line-height: var(--text-metadata--line-height);
}

/* Notebooks menores */
@media (max-width: 1366px) {
  .card-content {
    padding: 16px 18px 13px;
  }

  .metrics {
    gap: 20px;
    margin-top: 16px;
  }

  .metric {
    gap: 10px;
  }

  .metric-icon {
    font-size: 28px;
  }

  .card-footer {
    padding: 10px 18px;
  }
}

@media (max-width: 600px) {
  .card-content {
    padding: 17px 14px;
  }

  .metrics {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }

  .card-footer {
    flex-wrap: wrap;
    padding: 11px 14px;
  }

  .metric-content p {
    font-size: var(--text-highlight-2);
    line-height: var(--text-highlight-2--line-height);
  }
}
</style>
