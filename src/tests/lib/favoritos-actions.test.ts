import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
const mockUser = { id: 'user-123' }
const PROJETO_ID = '123e4567-e89b-12d3-a456-426614174000'

vi.mock('@/lib/supabase/server', () => ({
  criarClienteServidor: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: mockUser } })) },
    from: mockFrom,
  })),
}))

function criarChain(dados: unknown = null, erro: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ data: dados, error: erro })),
    get data() { return dados },
    get error() { return erro },
  }
}

describe('Server Actions - Favoritos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('toggleFavorito rejeita projeto inválido antes de consultar o banco', async () => {
    const { toggleFavorito } = await import('@/lib/favoritos/actions')

    await expect(toggleFavorito('projeto-invalido')).rejects.toThrow('Projeto inválido')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('toggleFavorito impede o dono de favoritar a própria história', async () => {
    const projetoChain = criarChain({ dono_id: mockUser.id })
    mockFrom.mockReturnValueOnce(projetoChain)
    const { toggleFavorito } = await import('@/lib/favoritos/actions')

    await expect(toggleFavorito(PROJETO_ID)).rejects.toThrow('Você não pode favoritar a própria história')
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('toggleFavorito remove favorito existente', async () => {
    const projetoChain = criarChain({ dono_id: 'outro-usuario' })
    const buscarChain = criarChain({ usuario_id: mockUser.id })
    const removerChain = criarChain(null)
    mockFrom.mockReturnValueOnce(projetoChain).mockReturnValueOnce(buscarChain).mockReturnValueOnce(removerChain)
    const { toggleFavorito } = await import('@/lib/favoritos/actions')

    const resultado = await toggleFavorito(PROJETO_ID)

    expect(resultado).toEqual({ favoritado: false })
    expect(removerChain.delete).toHaveBeenCalled()
    expect(removerChain.eq).toHaveBeenCalledWith('projeto_id', PROJETO_ID)
  })

  it('toggleFavorito não expõe erro técnico ao inserir', async () => {
    const projetoChain = criarChain({ dono_id: 'outro-usuario' })
    const buscarChain = criarChain(null)
    const inserirChain = criarChain(null, { message: 'permission denied for table favorito' })
    mockFrom.mockReturnValueOnce(projetoChain).mockReturnValueOnce(buscarChain).mockReturnValueOnce(inserirChain)
    const { toggleFavorito } = await import('@/lib/favoritos/actions')

    await expect(toggleFavorito(PROJETO_ID)).rejects.toThrow('Não foi possível favoritar o projeto')
  })
})
