import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
const mockCriarNotificacao = vi.fn()
const mockObterUsuarioAutenticado = vi.fn()
const mockVerificarDonoProjeto = vi.fn()

const PROJETO_ID = '123e4567-e89b-12d3-a456-426614174000'
const USUARIO_ID = '223e4567-e89b-12d3-a456-426614174000'

vi.mock('@/lib/supabase/server', () => ({
  criarClienteServidor: vi.fn(() => ({
    from: mockFrom,
  })),
}))

vi.mock('@/lib/notificacoes/actions', () => ({
  criarNotificacao: (...args: unknown[]) => mockCriarNotificacao(...args),
}))

vi.mock('@/lib/projetos/acesso', () => ({
  obterUsuarioAutenticado: (...args: unknown[]) => mockObterUsuarioAutenticado(...args),
  verificarDonoProjeto: (...args: unknown[]) => mockVerificarDonoProjeto(...args),
}))

function criarChain(dados: unknown = null, erro: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ data: dados, error: erro })),
    get data() { return dados },
    get error() { return erro },
  }
}

describe('Server Actions - Colaboradores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockObterUsuarioAutenticado.mockResolvedValue({ id: 'dono-1' })
    mockVerificarDonoProjeto.mockResolvedValue(undefined)
  })

  it('convidarColaborador rejeita projeto inválido antes de consultar o banco', async () => {
    const { convidarColaborador } = await import('@/lib/colaboradores/actions')

    await expect(convidarColaborador('projeto-invalido', 'caio', 'coautor')).rejects.toThrow(
      'Projeto inválido',
    )
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('convidarColaborador valida papel antes de consultar o banco', async () => {
    const { convidarColaborador } = await import('@/lib/colaboradores/actions')

    await expect(convidarColaborador(PROJETO_ID, 'caio', 'admin')).rejects.toThrow(
      'Papel de colaborador inválido',
    )
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('convidarColaborador normaliza nome e cria convite', async () => {
    const perfilChain = criarChain({ id: USUARIO_ID })
    const conviteChain = criarChain(null)
    const projetoChain = criarChain({ titulo: 'Livro' })
    mockFrom
      .mockReturnValueOnce(perfilChain)
      .mockReturnValueOnce(conviteChain)
      .mockReturnValueOnce(projetoChain)

    const { convidarColaborador } = await import('@/lib/colaboradores/actions')

    await convidarColaborador(PROJETO_ID, '  caio  ', 'coautor')

    expect(perfilChain.eq).toHaveBeenCalledWith('nome_usuario', 'caio')
    expect(conviteChain.insert).toHaveBeenCalledWith(expect.objectContaining({
      projeto_id: PROJETO_ID,
      usuario_id: USUARIO_ID,
      papel: 'coautor',
      convidado_em: expect.any(String),
    }))
    expect(mockCriarNotificacao).toHaveBeenCalledWith({
      usuario_id: USUARIO_ID,
      tipo: 'convite',
      projeto_id: PROJETO_ID,
      mensagem: 'Livro',
    })
  })

  it('convidarColaborador não expõe erro técnico do banco', async () => {
    const perfilChain = criarChain({ id: USUARIO_ID })
    const conviteChain = criarChain(null, { message: 'duplicate key value violates unique constraint' })
    mockFrom.mockReturnValueOnce(perfilChain).mockReturnValueOnce(conviteChain)

    const { convidarColaborador } = await import('@/lib/colaboradores/actions')

    await expect(convidarColaborador(PROJETO_ID, 'caio', 'coautor')).rejects.toThrow(
      'Não foi possível convidar o colaborador',
    )
  })
})
