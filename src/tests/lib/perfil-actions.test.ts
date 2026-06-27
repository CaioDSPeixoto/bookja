import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
const mockUser = { id: 'user-123' }

vi.mock('@/lib/supabase/server', () => ({
  criarClienteServidor: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: mockUser } })) },
    from: mockFrom,
  })),
}))

function criarChain(dados: unknown = null, erro: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ data: dados, error: erro })),
    get data() { return dados },
    get error() { return erro },
  }
}

describe('Server Actions - Perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('atualizarPerfil normaliza textos antes de atualizar', async () => {
    const chain = criarChain(null)
    mockFrom.mockReturnValue(chain)
    const { atualizarPerfil } = await import('@/lib/perfil/actions')

    await atualizarPerfil({ nome_exibicao: '  Caio  ', bio: '   ', chave_pix: ' pix ' })

    expect(chain.update).toHaveBeenCalledWith({
      nome_exibicao: 'Caio',
      bio: null,
      chave_pix: 'pix',
    })
    expect(chain.eq).toHaveBeenCalledWith('id', mockUser.id)
  })

  it('atualizarPerfil rejeita payload inválido antes de consultar o banco', async () => {
    const { atualizarPerfil } = await import('@/lib/perfil/actions')

    await expect(atualizarPerfil(null as never)).rejects.toThrow('Perfil inválido')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('obterMeuPerfil não expõe erro técnico do banco', async () => {
    const chain = criarChain(null, { message: 'permission denied for table perfil' })
    mockFrom.mockReturnValue(chain)
    const { obterMeuPerfil } = await import('@/lib/perfil/actions')

    await expect(obterMeuPerfil()).rejects.toThrow('Não foi possível obter o perfil')
  })
})
