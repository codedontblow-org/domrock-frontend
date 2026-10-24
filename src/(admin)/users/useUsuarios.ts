import { ref, computed, onMounted } from 'vue'
import type { Usuario, PostUsuarioDTO, PutUsuarioDTO, Perfil, ResumoUsuarios } from '@/types/usuarios'
import { listAll, create, updateById, desativarById, ativarById, getResumo } from '@/services/usuarios'
import { usuarioLogado } from '@/services/auth'

export function useUsuarios() {
  const logado = usuarioLogado()
  const emailLogado = computed(() => logado?.email)

  const usuarios = ref<Usuario[]>([])
  const carregando = ref(false)
  
  const paginaAtual = ref(0) 
  const totalPaginas = ref(0)
  const itensPorPagina = 10

  const showModal = ref(false)
  const isEditing = ref(false)
  const editingId = ref<number | null>(null)
  const errorMessage = ref('')
  const isSaving = ref(false)

  const showConfirmModal = ref(false)
  const usuarioParaAlterar = ref<Usuario | null>(null)
  const isToggling = ref(false)

  const totalUsuarios = ref(0)
  const ativosCount = ref(0)
  const desativadosCount = ref(0)

  const formData = ref({
    nome: '',
    email: '',
    perfil: '' as Perfil | '',
    senha: ''
  })

  const usuariosOrdenados = computed(() => {
    return [...usuarios.value].sort((a, b) => {
      if (a.ativo === b.ativo) {
        return a.nome.localeCompare(b.nome)
      }
      return a.ativo ? -1 : 1 
    })
  })

  const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email))
  const isSenhaValid = computed(() => isEditing.value || formData.value.senha.length >= 8)
  const isFormValid = computed(() => {
    return formData.value.nome.trim() !== '' && 
           isEmailValid.value && 
           formData.value.perfil !== '' && 
           isSenhaValid.value
  })

  onMounted(() => {
    carregarDados()
  })

  async function carregarDados() {
    carregando.value = true
    try {
      const [pagina, resumo] = await Promise.all([
        listAll(paginaAtual.value, itensPorPagina),
        getResumo()
      ])
    
      usuarios.value = pagina.content
      totalPaginas.value = pagina.totalPages || 1
    
      totalUsuarios.value = resumo.total
      ativosCount.value = resumo.ativos
      desativadosCount.value = resumo.desativados

    } catch (error) {
      console.error("Erro ao carregar utilizadores e resumo:", error)
    } finally {
      carregando.value = false
    }
  }

  function proximaPagina() {
    if (paginaAtual.value < totalPaginas.value - 1) {
      paginaAtual.value++
      carregarDados()
    }
  }

  function paginaAnterior() {
    if (paginaAtual.value > 0) {
      paginaAtual.value--
      carregarDados()
    }
  }

  function abrirModalNovo() {
    isEditing.value = false
    editingId.value = null
    errorMessage.value = ''
    formData.value = { nome: '', email: '', perfil: '', senha: '' }
    showModal.value = true
  }

  function abrirModalEditar(u: Usuario) {
    isEditing.value = true
    editingId.value = u.id
    errorMessage.value = ''
    formData.value = { nome: u.nome, email: u.email, perfil: u.perfil, senha: '' }
    showModal.value = true
  }

  function fecharModal() {
    showModal.value = false
  }

  function abrirModalConfirmacao(u: Usuario) {
    if (u.email === emailLogado.value) return 
    usuarioParaAlterar.value = u
    showConfirmModal.value = true
  }

  function fecharModalConfirmacao() {
    showConfirmModal.value = false
    usuarioParaAlterar.value = null
  }

  async function salvar() {
    if (!isFormValid.value) return
    errorMessage.value = ''
    isSaving.value = true

    try {
      if (isEditing.value && editingId.value) {
        const dto: PutUsuarioDTO = {
          nome: formData.value.nome,
          email: formData.value.email,
          perfil: formData.value.perfil as Perfil
        }
        await updateById(editingId.value, dto)
      } else {
        const dto: PostUsuarioDTO = {
          nome: formData.value.nome,
          email: formData.value.email,
          perfil: formData.value.perfil as Perfil,
          senha: formData.value.senha
        }
        await create(dto)
      }
      
      await carregarDados()
      fecharModal()
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (data && data.message) {
        errorMessage.value = data.message;
      } else if (status === 409) {
        errorMessage.value = 'Já existe um usuário com este e-mail.';
      } else if (status === 400) {
        errorMessage.value = 'Operação inválida. Você não pode alterar regras críticas da sua própria conta.';
      } else if (status === 403) {
        errorMessage.value = 'Acesso negado. Apenas Administradores podem realizar esta ação.';
      } else {
        errorMessage.value = 'Erro de comunicação com o servidor.';
      }
    } finally {
      isSaving.value = false
    }
  }

  async function confirmarToggleStatus() {
    if (!usuarioParaAlterar.value) return
    const u = usuarioParaAlterar.value
    isToggling.value = true
    
    try {
      if (u.ativo) {
        await desativarById(u.id)
      } else {
        await ativarById(u.id)
      }
      await carregarDados()
      fecharModalConfirmacao()
    } catch (error: any) {
      console.error("Erro ao alterar status:", error)
      const data = error.response?.data;
      
      if (error.response?.status === 400) {
        alert(data?.message || 'Você não pode desativar a própria conta.');
      } else if (error.response?.status === 403) {
        alert('Acesso negado. Apenas Administradores podem desativar usuários.');
      } else {
        alert('Erro ao alterar o status do usuário.');
      }
    } finally {
      isToggling.value = false
    }
  }

  return {
    emailLogado,
    usuariosOrdenados,
    totalUsuarios,
    ativosCount,
    desativadosCount,
    carregando,
    showModal,
    isEditing,
    errorMessage,
    isSaving,
    formData,
    isEmailValid,
    isFormValid,
    paginaAtual,
    totalPaginas,
    showConfirmModal,
    usuarioParaAlterar,
    isToggling,
    abrirModalNovo,
    abrirModalEditar,
    fecharModal,
    salvar,
    abrirModalConfirmacao,
    fecharModalConfirmacao,
    confirmarToggleStatus,
    proximaPagina,
    paginaAnterior
  }
}