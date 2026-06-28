import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
const mockRpc = vi.fn()
const mockUser = { id: 'user-123' }
const NOTIFICACAO_ID = '123e4567-e89b-12d3-a456-426614174000'
const USUARIO_ID = '223e4567-e89b-12d3-a456-426614174000'

vi.mock('@/lib/supabase/server', () => ({
  criarClienteServidor: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: mockUser } })) },
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

function criarChain(dados: unknown = null, erro: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get data() { return dados },
    get error() { return erro },
  }
}

describe('Server Actions - Notificações', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marcarComoLida rejeita id inválido antes de consultar o banco', async () => {
    const { marcarComoLida } = await import('@/lib/notificacoes/actions')

    await expect(marcarComoLida('notificacao-invalida')).rejects.toThrow('Notificação inválida')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('marcarComoLida filtra por usuário autenticado', async () => {
    const chain = criarChain(null)
    mockFrom.mockReturnValue(chain)
    const { marcarComoLida } = await import('@/lib/notificacoes/actions')

    await marcarComoLida(NOTIFICACAO_ID)

    expect(chain.update).toHaveBeenCalledWith({ lida: true })
    expect(chain.eq).toHaveBeenCalledWith('id', NOTIFICACAO_ID)
    expect(chain.eq).toHaveBeenCalledWith('usuario_id', mockUser.id)
  })

  it('criarNotificacao valida mensagem obrigatória', async () => {
    const { criarNotificacao } = await import('@/lib/notificacoes/actions')

    await expect(
      criarNotificacao({ usuario_id: USUARIO_ID, tipo: 'convite', mensagem: '   ' }),
    ).rejects.toThrow('Mensagem obrigatória')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('criarNotificacao não expõe erro técnico do banco', async () => {
    const chain = criarChain(null, { message: 'permission denied for table notificacao' })
    mockRpc.mockResolvedValue({ data: null, error: { message: 'permission denied for table notificacao' } })
    const { criarNotificacao } = await import('@/lib/notificacoes/actions')

    await expect(
      criarNotificacao({ usuario_id: USUARIO_ID, tipo: 'convite', mensagem: 'Convite' }),
    ).rejects.toThrow('Não foi possível criar a notificação')
    expect(chain.insert).not.toHaveBeenCalled()
  })

  it('criarNotificacao usa RPC segura para notificar outro usuário', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    const { criarNotificacao } = await import('@/lib/notificacoes/actions')

    await criarNotificacao({
      usuario_id: USUARIO_ID,
      tipo: 'convite',
      projeto_id: '323e4567-e89b-12d3-a456-426614174000',
      mensagem: 'Convite',
    })

    expect(mockRpc).toHaveBeenCalledWith('criar_notificacao_sistema', {
      p_usuario_id: USUARIO_ID,
      p_tipo: 'convite',
      p_projeto_id: '323e4567-e89b-12d3-a456-426614174000',
      p_documento_id: null,
      p_comentario_id: null,
      p_mensagem: 'Convite',
    })
  })
})
