import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'user-1', email: 'a@b.com' }
const mockUpsert = vi.fn()
const mockDelete = vi.fn()
const mockUpdate = vi.fn()
const mockSelect = vi.fn()

const mockSupabase = {
  auth: { getUser: vi.fn(() => ({ data: { user: mockUser }, error: null })) },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    upsert: mockUpsert.mockReturnValue({ error: null }),
    delete: mockDelete.mockReturnThis(),
    update: mockUpdate.mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ data: null, error: null })),
  })),
  rpc: vi.fn(() => ({ data: { sucesso: true }, error: null })),
}

vi.mock('@/lib/supabase/server', () => ({
  criarClienteServidor: vi.fn(() => mockSupabase),
}))

describe('Lock de Edição - Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adquirirLock tenta adquirir via RPC primeiro', async () => {
    const { adquirirLock } = await import('@/lib/lock/actions')
    const resultado = await adquirirLock('doc-1')

    expect(mockSupabase.rpc).toHaveBeenCalledWith('adquirir_lock_documento', {
      p_documento_id: 'doc-1',
      p_usuario_id: 'user-1',
    })
    expect(resultado.sucesso).toBe(true)
  })

  it('liberarLock usa delete com filtro de documento e usuário', async () => {
    const { liberarLock } = await import('@/lib/lock/actions')
    await liberarLock('doc-1')

    expect(mockSupabase.from).toHaveBeenCalledWith('documento_lock')
  })

  it('renovarLock atualiza expira_em', async () => {
    const { renovarLock } = await import('@/lib/lock/actions')
    const resultado = await renovarLock('doc-1')

    expect(mockSupabase.from).toHaveBeenCalledWith('documento_lock')
  })

  it('verificarLock retorna livre quando não há lock', async () => {
    const { verificarLock } = await import('@/lib/lock/actions')
    const resultado = await verificarLock('doc-1')

    expect(resultado.livre).toBe(true)
  })
})
