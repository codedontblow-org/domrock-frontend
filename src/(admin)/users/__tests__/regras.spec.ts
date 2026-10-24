import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ativarById, create, desativarById, updateById } from '@/services/usuarios'
import { mensagemDoBackend } from '../erros'
import { rotuloDoPerfil } from '../perfis'
import { MENSAGENS_DO_FORMULARIO, useFormularioUsuario } from '../useFormularioUsuario'
import { useSituacaoUsuario } from '../useSituacaoUsuario'
import { erroDoBackend, erroSemResposta, usuarioFalso } from './fakes'

vi.mock('@/services/usuarios')
// auth.ts importa o router, que importa todas as telas.
vi.mock('@/router/index', () => ({ router: { push: vi.fn() } }))

beforeEach(() => vi.resetAllMocks())

function formularioPreenchido() {
  const form = useFormularioUsuario(null)
  form.campos.value = {
    nome: 'Marina Costa',
    email: 'marina@camplana.com.br',
    perfil: 'SUPERVISOR',
    senha: 'senha-forte',
  }
  return form
}

describe('mensagemDoBackend', () => {
  it('usa a mensagem do backend num erro 4xx', () => {
    expect(mensagemDoBackend(erroDoBackend(400, 'Você não pode desativar a própria conta'))).toBe(
      'Você não pode desativar a própria conta',
    )
  })

  it('ignora a mensagem técnica de um 5xx e a falta de resposta', () => {
    expect(mensagemDoBackend(erroDoBackend(500, 'Internal Server Error'))).toBeNull()
    expect(mensagemDoBackend(erroSemResposta())).toBeNull()
  })
})

describe('rotuloDoPerfil', () => {
  it('traduz o perfil do backend para o nome curto da tela', () => {
    expect(rotuloDoPerfil('ADMIN')).toBe('Administrador')
    expect(rotuloDoPerfil('SUPERVISOR')).toBe('Supervisor')
  })
})

describe('useFormularioUsuario', () => {
  it('só deixa salvar com nome, e-mail válido, perfil e senha de 8 caracteres', () => {
    const form = formularioPreenchido()
    expect(form.podeSalvar.value).toBe(true)

    for (const campoRuim of [
      { email: 'marina@' },
      { senha: '1234567' },
      { perfil: '' as const },
      { nome: '   ' },
    ]) {
      form.campos.value = { ...formularioPreenchido().campos.value, ...campoRuim }
      expect(form.podeSalvar.value, JSON.stringify(campoRuim)).toBe(false)
    }
  })

  it('mostra o erro do e-mail e da senha só depois que a pessoa sai do campo', () => {
    const form = useFormularioUsuario(null)
    form.campos.value.email = 'marina@'
    form.campos.value.senha = '123'
    expect(form.erroDoEmail.value).toBe('')

    form.tocar('email')
    form.tocar('senha')

    expect(form.erroDoEmail.value).toBe(MENSAGENS_DO_FORMULARIO.emailInvalido)
    expect(form.erroDaSenha.value).toBe(MENSAGENS_DO_FORMULARIO.senhaCurta)
  })

  it('na edição não pede senha e manda só nome, e-mail e perfil', async () => {
    const carlos = usuarioFalso({ nome: 'Carlos', perfil: 'SUPERVISOR' })
    const form = useFormularioUsuario(carlos)

    expect(await form.salvar()).toBe(true)
    expect(updateById).toHaveBeenCalledWith(carlos.id, {
      nome: 'Carlos',
      email: carlos.email,
      perfil: 'SUPERVISOR',
    })
  })

  it('e-mail repetido (409) vira erro no campo de e-mail e some ao trocar o e-mail', async () => {
    vi.mocked(create).mockRejectedValue(erroDoBackend(409, 'Já existe um usuário com este e-mail'))
    const form = formularioPreenchido()

    expect(await form.salvar()).toBe(false)
    expect(form.erroDoEmail.value).toBe(MENSAGENS_DO_FORMULARIO.emailRepetido)
    expect(form.erroGeral.value).toBe('')

    form.campos.value.email = 'marina.costa@camplana.com.br'
    await Promise.resolve()
    expect(form.erroDoEmail.value).toBe('')
  })

  it('outras falhas aparecem no alerta do modal, com a mensagem do backend quando houver', async () => {
    vi.mocked(create).mockRejectedValueOnce(erroDoBackend(400, 'Perfil inválido'))
    vi.mocked(create).mockRejectedValueOnce(erroSemResposta())
    const form = formularioPreenchido()

    await form.salvar()
    expect(form.erroGeral.value).toBe('Perfil inválido')

    await form.salvar()
    expect(form.erroGeral.value).toBe(MENSAGENS_DO_FORMULARIO.falhaAoSalvar)
  })
})

describe('useSituacaoUsuario', () => {
  it('desativa quem está ativo e reativa quem está desativado', async () => {
    const ativo = usuarioFalso()
    const desativado = usuarioFalso({ ativo: false })

    await useSituacaoUsuario(ativo).confirmar()
    await useSituacaoUsuario(desativado).confirmar()

    expect(desativarById).toHaveBeenCalledWith(ativo.id)
    expect(ativarById).toHaveBeenCalledWith(desativado.id)
  })

  it('sem resposta do backend, explica que nada foi alterado', async () => {
    vi.mocked(desativarById).mockRejectedValue(erroSemResposta())
    const situacao = useSituacaoUsuario(usuarioFalso())

    expect(await situacao.confirmar()).toBe(false)
    expect(situacao.erro.value).toBe(
      'Não foi possível desativar agora. Confira a conexão e tente de novo; nada foi alterado.',
    )
  })
})
