import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
const mockUser = { id: 'user-123' }
const PERFIL_ID = '123e4567-e89b-12d3-a456-426614174000'
const COMENTARIO_ID = '223e4567-e89b-12d3-a456-426614174000'

vi.mock('@/lib/supabase/server', () => ({
  criarClienteServidor: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: mockUser } })) },
    from: mockFrom,
    rpc: vi.fn(() => ({ data: false })),
  })),
}))

function criarChain(dados: unknown = null, erro: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ data: dados, error: erro })),
    get data() { return dados },
    get error() { return erro },
  }
}

describe('Server Actions - Mural', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('criarComentarioMural rejeita perfil inválido antes de consultar o banco', async () => {
    const { criarComentarioMural } = await import('@/lib/mural/actions')

    await expect(criarComentarioMural('perfil-invalido', 'Olá')).rejects.toThrow('Perfil inválido')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('criarComentarioMural normaliza conteúdo e pai opcional', async () => {
    const chain = criarChain(null)
    mockFrom.mockReturnValue(chain)
    const { criarComentarioMural } = await import('@/lib/mural/actions')

    await criarComentarioMural(PERFIL_ID, '  Olá  ', COMENTARIO_ID)

    expect(chain.insert).toHaveBeenCalledWith({
      perfil_id: PERFIL_ID,
      autor_id: mockUser.id,
      conteudo: 'Olá',
      pai_id: COMENTARIO_ID,
    })
  })

  it('reagirMural valida emoji antes de consultar reações', async () => {
    const { reagirMural } = await import('@/lib/mural/actions')

    await expect(reagirMural(COMENTARIO_ID, '')).rejects.toThrow('Emoji inválido')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('criarComentarioMural não expõe erro técnico do banco', async () => {
    const chain = criarChain(null, { message: 'permission denied for table mural_comentario' })
    mockFrom.mockReturnValue(chain)
    const { criarComentarioMural } = await import('@/lib/mural/actions')

    await expect(criarComentarioMural(PERFIL_ID, 'Olá')).rejects.toThrow(
      'Não foi possível criar o comentário no mural',
    )
  })
})
