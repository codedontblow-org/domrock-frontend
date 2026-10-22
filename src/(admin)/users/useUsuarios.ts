import { ref, computed, onMounted } from 'vue'

import type { 
    Usuario, 
    PostUsuarioDTO, 
    PutUsuarioDTO, 
    Perfil 
} from '@/types/usuarios'

import { 
  listAll, 
  create, 
  updateById, 
  desativarById, 
  ativarById 
} from '@/services/usuarios'
import { usuarioLogado } from '@/services/auth'

export function useUsuarios() {
  const logado = usuarioLogado()
  const emailLogado = computed(() => logado?.email)

  const usuarios = ref<Usuario[]>([])
  const carregando = ref(false)

  const showModal = ref(false)
  const isEditing = ref(false)
  const editingId = ref<number | null>(null)
  const errorMessage = ref('')
  const isSaving = ref(false)

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

  // TODO: Pegar totais reais do backend futuramente
  const totalUsuarios = 10
  const ativosCount = 9
  const desativadosCount = 1

  const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+\$/.test(formData.value.email))
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
      const pagina = await listAll(0, 50)
      usuarios.value = pagina.content
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    } finally {
      carregando.value = false
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
      if (error.response?.status === 409 || error.response?.status === 400) {
        errorMessage.value = error.response.data.message || 'Dados inválidos ou e-mail já cadastrado.'
      } else {
        errorMessage.value = 'Ocorreu um erro inesperado.'
      }
    } finally {
      isSaving.value = false
    }
  }

  async function toggleStatus(u: Usuario) {
    if (u.email === emailLogado.value) return 
    
    const acao = u.ativo ? 'desativar' : 'reativar'
    if (confirm(`Tem certeza que deseja ${acao} o usuário ${u.nome}?`)) {
      try {
        if (u.ativo) {
          await desativarById(u.id)
        } else {
          await ativarById(u.id)
        }
        await carregarDados()
      } catch (error) {
        console.error("Erro ao alterar status:", error)
        alert("Erro ao alterar o status.")
      }
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
    abrirModalNovo,
    abrirModalEditar,
    fecharModal,
    salvar,
    toggleStatus
  }
}