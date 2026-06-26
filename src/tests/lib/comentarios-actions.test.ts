import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'autor-1', email: 'autor@test.com' }
const mockCriarNotificacao = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/notificacoes/actions', () => ({
  criarNotificacao: (...args: unknown[]) => mockCriarNotificacao(...args),
}))

vi.mock('@/lib/supabase/server', () => ({
  criarClienteServidor: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: mockUser }, error: null })) },
    from: mockFrom,
  })),
}))

function criarChain(dados: unknown = null, erro: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ data: dados, error: erro })),
    maybeSingle: vi.fn(() => ({ data: dados, error: erro })),
    get data() { return dados },
    get error() { return erro },
  }
}

describe('Server Actions - Comentários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('criarComentario notifica o dono do projeto usando dono_id', async () => {
    const projetoPublicadoChain = criarChain({ status: 'publicado' })
    const inserirComentarioChain = criarChain(null)
    const projetoDonoChain = criarChain({ dono_id: 'dono-1' })

    mockFrom
      .mockReturnValueOnce(projetoPublicadoChain)
      .mockReturnValueOnce(inserirComentarioChain)
      .mockReturnValueOnce(projetoDonoChain)

    const { criarComentario } = await import('@/lib/comentarios/actions')

    await criarComentario('proj-1', null, 'Comentário novo')

    expect(projetoDonoChain.select).toHaveBeenCalledWith('dono_id')
    expect(mockCriarNotificacao).toHaveBeenCalledWith({
      usuario_id: 'dono-1',
      tipo: 'comentario',
      projeto_id: 'proj-1',
      mensagem: 'Novo comentário no seu projeto',
    })
  })

  it('criarComentario não notifica quando o autor é o dono', async () => {
    const projetoPublicadoChain = criarChain({ status: 'publicado' })
    const inserirComentarioChain = criarChain(null)
    const projetoDonoChain = criarChain({ dono_id: 'autor-1' })

    mockFrom
      .mockReturnValueOnce(projetoPublicadoChain)
      .mockReturnValueOnce(inserirComentarioChain)
      .mockReturnValueOnce(projetoDonoChain)

    const { criarComentario } = await import('@/lib/comentarios/actions')

    await criarComentario('proj-1', null, 'Comentário do próprio dono')

    expect(mockCriarNotificacao).not.toHaveBeenCalled()
  })
})
