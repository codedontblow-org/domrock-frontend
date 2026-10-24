import { ref } from 'vue'
import type { Usuario } from '@/types/usuarios'
import { ativarById, desativarById } from '@/services/usuarios'
import { mensagemDoBackend } from './erros'

/**
 * Desativa um usuário ativo ou reativa um desativado. O erro fica no próprio modal de
 * confirmação, que continua aberto para tentar de novo (antes era um alert() que travava a página).
 * Ex.: const { acao, confirmar } = useSituacaoUsuario(usuario); await confirmar()
 */
export function useSituacaoUsuario(usuario: Usuario) {
  const acao = usuario.ativo ? 'desativar' : 'reativar'
  const erro = ref('')
  const enviando = ref(false)

  /** Devolve true se o backend aceitou a mudança. */
  async function confirmar(): Promise<boolean> {
    erro.value = ''
    enviando.value = true
    try {
      await (usuario.ativo ? desativarById(usuario.id) : ativarById(usuario.id))
      return true
    } catch (falha) {
      erro.value =
        mensagemDoBackend(falha) ??
        `Não foi possível ${acao} agora. Confira a conexão e tente de novo; nada foi alterado.`
      return false
    } finally {
      enviando.value = false
    }
  }

  return { acao, erro, enviando, confirmar }
}
