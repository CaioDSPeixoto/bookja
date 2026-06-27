import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'autor-1', email: 'autor@test.com' }
const mockCriarNotificacao = vi.fn()
const mockFrom = vi.fn()
const PROJETO_ID = '123e4567-e89b-12d3-a456-426614174000'

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
    is: vi.fn().mockReturnThis(),
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

    await criarComentario(PROJETO_ID, null, 'Comentário novo')

    expect(projetoDonoChain.select).toHaveBeenCalledWith('dono_id')
    expect(mockCriarNotificacao).toHaveBeenCalledWith({
      usuario_id: 'dono-1',
      tipo: 'comentario',
      projeto_id: PROJETO_ID,
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

    await criarComentario(PROJETO_ID, null, 'Comentário do próprio dono')

    expect(mockCriarNotificacao).not.toHaveBeenCalled()
  })

  it('criarComentario rejeita projeto inválido antes de consultar o banco', async () => {
    const { criarComentario } = await import('@/lib/comentarios/actions')

    await expect(criarComentario('proj-1', null, 'Comentário')).rejects.toThrow('Projeto inválido')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('criarComentario rejeita conteúdo vazio antes de consultar o banco', async () => {
    const { criarComentario } = await import('@/lib/comentarios/actions')

    await expect(criarComentario(PROJETO_ID, null, '   ')).rejects.toThrow('Conteúdo obrigatório')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('criarComentario não expõe erro técnico do banco', async () => {
    const projetoPublicadoChain = criarChain({ status: 'publicado' })
    const inserirComentarioChain = criarChain(null, { message: 'permission denied for table comentario' })

    mockFrom
      .mockReturnValueOnce(projetoPublicadoChain)
      .mockReturnValueOnce(inserirComentarioChain)

    const { criarComentario } = await import('@/lib/comentarios/actions')

    await expect(criarComentario(PROJETO_ID, null, 'Comentário novo')).rejects.toThrow(
      'Não foi possível criar o comentário',
    )
  })
})
