
<script setup lang="ts">
import TabelaCampanhas from './components/TabelaCampanhas.vue'
import AvisoCampanha from './components/AvisoCampanha.vue'
import CarrosselCampanha from './components/CarrosselCampanha.vue'

const campanhasAprovacao = [
  {
    id: 1,
    titulo: 'Acréscimo para o cargo Vendedor loja no final do mês',
    inicio: '23/11',
    fim: '30/11',
    percentual: '+1%',
    retorno: 'R$2.000,00',
    investimento: 'R$1.500,00',
    cargosEProdutos: 'Afeta 1 cargo e 1 produto.',
    sugeridoPor: 'Roberval Silva',
    submetidoEm: '16/11',
    status: 'Sem conflitos',
  },
  {
    id: 2,
    titulo: 'Campanha especial de novembro',
    inicio: '20/11',
    fim: '30/11',
    percentual: '+2%',
    retorno: 'R$3.500,00',
    investimento: 'R$2.000,00',
    cargosEProdutos: 'Afeta 2 cargos e 1 produto.',
    sugeridoPor: 'Mariana Costa',
    submetidoEm: '17/11',
    status: 'Sem conflitos',
  },
  {
    id: 3,
    titulo: 'Incentivo de vendas de Natal',
    inicio: '01/12',
    fim: '25/12',
    percentual: '+3%',
    retorno: 'R$4.000,00',
    investimento: 'R$2.500,00',
    cargosEProdutos: 'Afeta 1 cargo e 2 produtos.',
    sugeridoPor: 'Carlos Mendes',
    submetidoEm: '18/11',
    status: 'Sem conflitos',
  },
  {
    id: 4,
    titulo: 'Bônus de desempenho comercial',
    inicio: '01/12',
    fim: '15/12',
    percentual: '+1,5%',
    retorno: 'R$2.800,00',
    investimento: 'R$1.800,00',
    cargosEProdutos: 'Afeta 3 cargos e 1 produto.',
    sugeridoPor: 'Ana Oliveira',
    submetidoEm: '19/11',
    status: 'Sem conflitos',
  },
  {
    id: 5,
    titulo: 'Campanha de fidelização de clientes',
    inicio: '05/12',
    fim: '20/12',
    percentual: '+2,5%',
    retorno: 'R$5.000,00',
    investimento: 'R$3.000,00',
    cargosEProdutos: 'Afeta 2 cargos e 3 produtos.',
    sugeridoPor: 'Roberval Silva',
    submetidoEm: '20/11',
    status: 'Sem conflitos',
  },
]

const campanhas = [
  {
    id: 1,
    titulo: 'Campanha de Verão',
    inicio: '01/11/2026',
    fim: '30/11/2026',
    cargo: 'Gerente de Vendas',
    marca: 'Nike',
    percentual: '15%',
  },
  {
    id: 2,
    titulo: 'Promoção de Natal',
    inicio: '01/12/2026',
    fim: '25/12/2026',
    cargo: 'Supervisor de Vendas',
    marca: 'Adidas',
    percentual: '20%',
  },
  {
    id: 3,
    titulo: 'Campanha Especial',
    inicio: '10/12/2026',
    fim: '20/12/2026',
    percentual: '10%',
  },
  {
    id: 4,
    titulo: 'Black Friday',
    inicio: '20/11/2026',
    fim: '30/11/2026',
    cargo: 'Gerente de Vendas',
    marca: 'Puma',
    percentual: '25%',
  },
  {
    id: 5,
    titulo: 'Liquidação de Inverno',
    inicio: '01/07/2026',
    fim: '31/07/2026',
    cargo: 'Vendedor de Loja',
    marca: 'Nike',
    percentual: '12%',
  },
  {
    id: 6,
    titulo: 'Semana do Consumidor',
    inicio: '10/03/2026',
    fim: '17/03/2026',
    cargo: 'Supervisor de Vendas',
    marca: 'Samsung',
    percentual: '18%',
  },
  {
    id: 7,
    titulo: 'Aniversário da Loja',
    inicio: '05/08/2026',
    fim: '15/08/2026',
    cargo: 'Vendedor de Loja',
    marca: 'Adidas',
    percentual: '8%',
  },
  {
    id: 8,
    titulo: 'Volta às Aulas',
    inicio: '15/01/2026',
    fim: '15/02/2026',
    cargo: 'Gerente de Vendas',
    marca: 'Faber-Castell',
    percentual: '10%',
  },
  {
    id: 9,
    titulo: 'Dia das Mães',
    inicio: '01/05/2026',
    fim: '10/05/2026',
    cargo: 'Supervisor de Vendas',
    marca: 'Natura',
    percentual: '15%',
  },
  {
    id: 10,
    titulo: 'Dia dos Namorados',
    inicio: '01/06/2026',
    fim: '12/06/2026',
    cargo: 'Vendedor de Loja',
    marca: 'O Boticário',
    percentual: '13%',
  },
]
</script>

<template>
  <main class="page">
    <!-- Seção 1: Título e aviso -->
    <section class="intro-section">
      <header class="page-header">
        <h1>Campanhas</h1>
      </header>

      <div class="notice-section">
        <AvisoCampanha />
      </div>
    </section>

    <!-- Seção 2: Campanhas aguardando aprovação -->
    <section class="approvals-section">
      <header class="section-header">
        <h2>Aguardando Aprovação</h2>

        <p class="section-description">
          Clique em uma campanha para ver mais detalhes!
        </p>
      </header>

      <CarrosselCampanha :campanhas="campanhasAprovacao" />
    </section>

    <!-- Seção 3: Campanhas passadas -->
    <section class="campaigns-section">
      <header class="section-header">
        <h2>Campanhas Passadas</h2>

        <p class="section-description">
          Clique em uma campanha na tabela abaixo para ver informações
          mais detalhadas e visualizar o chat que a gerou.
        </p>
      </header>

      <TabelaCampanhas :campanhas="campanhas" />
    </section>
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

/* Seção 1: título e aviso */
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

/* Aviso próximo ao título */
.notice-section {
  margin: 0;
}

/* Seções 2 e 3 */
.approvals-section {
  margin-bottom: 56px;
}

.campaigns-section {
  margin-bottom: 24px;
}

/* Cabeçalho interno das seções */
.section-header {
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0 0 8px;
  font-size: var(--text-header-2);
  line-height: var(--text-header-2--line-height);
  font-weight: 800;
}

.section-description {
  margin: 0;
  color: var(--color-gray-txt2-dark);
  font-size: var(--text-body);
  line-height: 1.5;
  font-weight: 400;
}

/* Telas médias */
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

/* Celulares */
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
