import { computed, ref, watch } from 'vue'
import type { Perfil, Usuario } from '@/types/usuarios'
import { create, updateById } from '@/services/usuarios'
import { mensagemDoBackend, statusDoErro } from './erros'

export interface CamposUsuario {
  nome: string
  email: string
  perfil: Perfil | ''
  senha: string
}

type CampoValidado = 'email' | 'senha'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TAMANHO_MINIMO_DA_SENHA = 8

// Textos do protótipo (estados 2021:2058 e 2021:2131 no Figma).
export const MENSAGENS_DO_FORMULARIO = {
  emailInvalido: 'Digite um e-mail válido, como nome@empresa.com',
  senhaCurta: 'A senha inicial precisa de pelo menos 8 caracteres',
  emailRepetido: 'Já existe um usuário com este e-mail',
  semPermissao: 'Só administradores podem cadastrar e editar usuários.',
  falhaAoSalvar:
    'Não foi possível salvar agora. Confira a conexão e tente de novo; nada foi alterado.',
}

function camposIniciais(usuario: Usuario | null): CamposUsuario {
  if (!usuario) return { nome: '', email: '', perfil: '', senha: '' }
  return { nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, senha: '' }
}

function enviarAoBackend(usuario: Usuario | null, campos: CamposUsuario): Promise<Usuario> {
  const { email, perfil, senha } = campos
  const nome = campos.nome.trim()
  if (perfil === '') {
    return Promise.reject(
      new Error(`perfil vazio: esperava um de GERENTE, SUPERVISOR ou ADMIN, veio "${perfil}"`),
    )
  }
  if (usuario) return updateById(usuario.id, { nome, email, perfil })
  return create({ nome, email, perfil, senha })
}

/**
 * Estado e regras do formulário de usuário: novo (usuario = null) ou edição, que não mexe na senha.
 * O erro de cada campo só aparece depois que a pessoa sai dele, para não acusar enquanto digita.
 * Ex.: const form = useFormularioUsuario(null); form.campos.value.email = 'ana@'; form.tocar('email')
 */
export function useFormularioUsuario(usuario: Usuario | null) {
  const editando = usuario !== null
  const campos = ref<CamposUsuario>(camposIniciais(usuario))
  const tocados = ref<Record<CampoValidado, boolean>>({ email: false, senha: false })
  const emailRepetido = ref(false)
  const erroGeral = ref('')
  const salvando = ref(false)

  const emailValido = computed(() => EMAIL_VALIDO.test(campos.value.email))
  const senhaValida = computed(
    () => editando || campos.value.senha.length >= TAMANHO_MINIMO_DA_SENHA,
  )
  const camposValidos = computed(
    () =>
      campos.value.nome.trim() !== '' &&
      emailValido.value &&
      campos.value.perfil !== '' &&
      senhaValida.value,
  )

  const erroDoEmail = computed(() => {
    if (emailRepetido.value) return MENSAGENS_DO_FORMULARIO.emailRepetido
    return tocados.value.email && !emailValido.value ? MENSAGENS_DO_FORMULARIO.emailInvalido : ''
  })
  const erroDaSenha = computed(() =>
    tocados.value.senha && !senhaValida.value ? MENSAGENS_DO_FORMULARIO.senhaCurta : '',
  )

  // O 409 vale para o e-mail que foi enviado; trocar o e-mail já tira o aviso.
  watch(
    () => campos.value.email,
    () => (emailRepetido.value = false),
  )

  function tratarFalha(erro: unknown) {
    const status = statusDoErro(erro)
    if (status === 409) {
      emailRepetido.value = true
      return
    }
    const textoDaTela =
      status === 403 ? MENSAGENS_DO_FORMULARIO.semPermissao : MENSAGENS_DO_FORMULARIO.falhaAoSalvar
    erroGeral.value = mensagemDoBackend(erro) ?? textoDaTela
  }

  /** Envia ao backend e devolve true se salvou; com falha, o modal continua aberto com o erro. */
  async function salvar(): Promise<boolean> {
    if (!camposValidos.value || salvando.value) return false
    erroGeral.value = ''
    salvando.value = true
    try {
      await enviarAoBackend(usuario, campos.value)
      return true
    } catch (erro) {
      tratarFalha(erro)
      return false
    } finally {
      salvando.value = false
    }
  }

  return {
    editando,
    campos,
    erroDoEmail,
    erroDaSenha,
    erroGeral,
    salvando,
    podeSalvar: computed(() => camposValidos.value && !salvando.value),
    tocar: (campo: CampoValidado) => (tocados.value[campo] = true),
    salvar,
  }
}
