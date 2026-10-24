import { computed, ref, onMounted } from 'vue'
import type { Usuario, ResumoUsuarios } from '@/types/usuarios'
import type { Page } from '@/types/pagination'
import { listAll, getResumo } from '@/services/usuarios'
import { usuarioLogado } from '@/services/auth'

// A ordem vem do backend para valer na lista toda, e não só nos itens de uma página:
// ativos primeiro e, dentro de cada grupo, por nome (card A6-63).
const ORDEM_DA_LISTA = ['ativo,desc', 'nome,asc']
const ITENS_POR_PAGINA = 10

/** Ex.: contagem(1, 'ativo', 'ativos') -> '1 ativo' */
function contagem(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}

/**
 * Lista paginada de usuários e o resumo de ativos e desativados, carregados ao montar a tela.
 * Ex.: const { usuarios, proximaPagina } = useUsuarios()
 */
export function useUsuarios() {
  // Pelo id, e não pelo e-mail: quem edita o próprio e-mail continua sendo "você" (review do PR #6).
  const idLogado = usuarioLogado()?.id

  const usuarios = ref<Usuario[]>([])
  const carregando = ref(false)
  const falhaAoCarregar = ref(false)
  const paginaAtual = ref(0)
  const totalPaginas = ref(0)
  const resumo = ref<ResumoUsuarios>({ total: 0, ativos: 0, desativados: 0 })

  const resumoDaLista = computed(() => {
    const { total, ativos, desativados } = resumo.value
    return `Visualizando ${contagem(total, 'usuário', 'usuários')} · ${contagem(ativos, 'ativo', 'ativos')} e ${contagem(desativados, 'desativado', 'desativados')}`
  })

  onMounted(carregarDados)

  async function carregarDados() {
    carregando.value = true
    falhaAoCarregar.value = false
    try {
      const resposta = await Promise.all([
        listAll(paginaAtual.value, ITENS_POR_PAGINA, ORDEM_DA_LISTA),
        getResumo(),
      ])
      aplicar(...resposta)
    } catch {
      // A tabela mostra o aviso com "Tentar de novo"; antes a tela ficava em "0 usuários" sem explicar.
      falhaAoCarregar.value = true
    } finally {
      carregando.value = false
    }
  }

  function aplicar(pagina: Page<Usuario>, novoResumo: ResumoUsuarios) {
    usuarios.value = pagina.content
    totalPaginas.value = pagina.totalPages || 1
    resumo.value = novoResumo
  }

  function irParaPagina(pagina: number) {
    if (pagina < 0 || pagina >= totalPaginas.value) return
    paginaAtual.value = pagina
    carregarDados()
  }

  return {
    idLogado,
    usuarios,
    carregando,
    falhaAoCarregar,
    paginaAtual,
    totalPaginas,
    resumoDaLista,
    carregarDados,
    proximaPagina: () => irParaPagina(paginaAtual.value + 1),
    paginaAnterior: () => irParaPagina(paginaAtual.value - 1),
  }
}
