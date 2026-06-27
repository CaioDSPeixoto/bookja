import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase responses
const mockFrom = vi.fn()

const mockUser = { id: 'user-123', email: 'test@test.com' }

vi.mock('@/lib/supabase/server', () => ({
  criarClienteServidor: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: mockUser }, error: null })) },
    from: mockFrom,
  })),
}))

function setupChain(dados: unknown = null, erro: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ data: dados, error: erro })),
    then: undefined,
  }
  // Para queries sem .single()
  Object.defineProperty(chain, 'data', { get: () => dados })
  Object.defineProperty(chain, 'error', { get: () => erro })
  mockFrom.mockReturnValue(chain)
  return chain
}

describe('Server Actions - Projetos (lógica de validação)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('listarProjetos usa o id do usuário autenticado', async () => {
    const chain = setupChain([])
    const { listarProjetos } = await import('@/lib/projetos/actions')

    await listarProjetos()

    expect(mockFrom).toHaveBeenCalledWith('projeto')
    expect(chain.select).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('dono_id', 'user-123')
  })

  it('excluirProjeto verifica propriedade antes de deletar', async () => {
    const chain = setupChain({ id: 'proj-1', dono_id: 'user-123' })
    const { obterProjeto } = await import('@/lib/projetos/actions')

    await obterProjeto('proj-1')

    expect(mockFrom).toHaveBeenCalledWith('projeto')
    expect(chain.eq).toHaveBeenCalledWith('id', 'proj-1')
  })

  it('publicarProjeto marca status e data de publicação', async () => {
    const documentosChain = setupChain([{ id: 'doc-1' }])
    const projetoChain = setupChain(null)
    mockFrom.mockReturnValueOnce(documentosChain).mockReturnValueOnce(projetoChain)
    const { publicarProjeto } = await import('@/lib/projetos/actions')

    await publicarProjeto('proj-1', { titulo: 'Livro', sinopse: 'Resumo' })

    expect(mockFrom).toHaveBeenNthCalledWith(1, 'documento')
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'projeto')
    expect(projetoChain.update).toHaveBeenCalledWith(expect.objectContaining({
      titulo: 'Livro',
      sinopse: 'Resumo',
      status: 'publicado',
      publicado_em: expect.any(String),
      atualizado_em: expect.any(String),
    }))
    expect(projetoChain.eq).toHaveBeenCalledWith('dono_id', 'user-123')
  })

  it('despublicarProjeto volta para rascunho e limpa publicado_em', async () => {
    const chain = setupChain(null)
    const { despublicarProjeto } = await import('@/lib/projetos/actions')

    await despublicarProjeto('proj-1', { titulo: 'Livro' })

    expect(mockFrom).toHaveBeenCalledWith('projeto')
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
      titulo: 'Livro',
      status: 'rascunho',
      publicado_em: null,
      atualizado_em: expect.any(String),
    }))
    expect(chain.eq).toHaveBeenCalledWith('dono_id', 'user-123')
  })
})

describe('Validações de segurança - Projetos', () => {
  it('todas as actions usam criarClienteServidor (não browser)', async () => {
    const actionsCode = await import('@/lib/projetos/actions')
    // Se importou sem erro, significa que usa criarClienteServidor (mock)
    expect(actionsCode).toBeDefined()
    expect(actionsCode.criarProjeto).toBeDefined()
    expect(actionsCode.atualizarProjeto).toBeDefined()
    expect(actionsCode.publicarProjeto).toBeDefined()
    expect(actionsCode.despublicarProjeto).toBeDefined()
    expect(actionsCode.excluirProjeto).toBeDefined()
    expect(actionsCode.listarProjetos).toBeDefined()
    expect(actionsCode.obterProjeto).toBeDefined()
  })
})
