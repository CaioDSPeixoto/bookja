import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
let currentUser: { id: string; email: string } | null = { id: 'user-1', email: 'a@b.com' }

const DOC = '123e4567-e89b-12d3-a456-426614174000'
const PROJ = '223e4567-e89b-12d3-a456-426614174000'
const NOTA = '323e4567-e89b-12d3-a456-426614174000'

vi.mock('@/lib/supabase/server', () => ({
  criarClienteServidor: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: currentUser }, error: null })) },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/projetos/acesso', () => ({
  verificarAcessoProjeto: vi.fn(async () => ({ projeto: { id: PROJ, dono_id: 'user-1' }, tipo: 'dono', usuarioId: 'user-1' })),
}))

function makeChain(result: { data?: unknown; error?: unknown } = {}) {
  const r = { data: result.data ?? null, error: result.error ?? null }
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => r),
    maybeSingle: vi.fn(() => r),
    data: r.data,
    error: r.error,
  }
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  currentUser = { id: 'user-1', email: 'a@b.com' }
})

describe('interacoes - validação de entrada', () => {
  it('listarNotasDocumento rejeita UUID inválido sem tocar no banco', async () => {
    const { listarNotasDocumento } = await import('@/lib/documentos/interacoes')
    await expect(listarNotasDocumento('nao-uuid')).rejects.toThrow('Documento inválido')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('criarNotaDocumento rejeita conteúdo vazio', async () => {
    const { criarNotaDocumento } = await import('@/lib/documentos/interacoes')
    await expect(criarNotaDocumento(PROJ, DOC, '   ')).rejects.toThrow('Conteúdo obrigatório')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('reagirDocumento rejeita emoji longo demais', async () => {
    const { reagirDocumento } = await import('@/lib/documentos/interacoes')
    await expect(reagirDocumento(DOC, 'x'.repeat(20))).rejects.toThrow('Emoji inválido')
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe('interacoes - notas (post-its)', () => {
  it('criarNotaDocumento insere com autor_id do usuário autenticado', async () => {
    const docChain = makeChain({ data: { id: DOC } })
    const insertChain = makeChain({})
    mockFrom.mockReturnValueOnce(docChain).mockReturnValueOnce(insertChain)

    const { criarNotaDocumento } = await import('@/lib/documentos/interacoes')
    await criarNotaDocumento(PROJ, DOC, 'Curiosidade do capítulo')

    expect(mockFrom).toHaveBeenNthCalledWith(1, 'documento')
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'documento_nota')
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ documento_id: DOC, autor_id: 'user-1', conteudo: 'Curiosidade do capítulo' }),
    )
  })

  it('excluirNotaDocumento nega quando o usuário não é o autor', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: { autor_id: 'outro' } }))
    const { excluirNotaDocumento } = await import('@/lib/documentos/interacoes')
    await expect(excluirNotaDocumento(NOTA)).rejects.toThrow('Sem permissão')
  })
})

describe('interacoes - reações (toggle)', () => {
  it('remove a reação quando já existe', async () => {
    const selectChain = makeChain({ data: { emoji: '❤️' } })
    const deleteChain = makeChain({})
    mockFrom.mockReturnValueOnce(selectChain).mockReturnValueOnce(deleteChain)

    const { reagirDocumento } = await import('@/lib/documentos/interacoes')
    await reagirDocumento(DOC, '❤️')

    expect(deleteChain.delete).toHaveBeenCalled()
    expect(selectChain.insert).not.toHaveBeenCalled()
  })

  it('adiciona a reação quando ainda não existe', async () => {
    const selectChain = makeChain({ data: null })
    const insertChain = makeChain({})
    mockFrom.mockReturnValueOnce(selectChain).mockReturnValueOnce(insertChain)

    const { reagirDocumento } = await import('@/lib/documentos/interacoes')
    await reagirDocumento(DOC, '🔥')

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ documento_id: DOC, usuario_id: 'user-1', emoji: '🔥' }),
    )
  })

  it('listarReacoesDocumento agrega contagem e marca reagiu do próprio usuário', async () => {
    mockFrom.mockReturnValueOnce(makeChain({
      data: [
        { emoji: '❤️', usuario_id: 'user-1' },
        { emoji: '❤️', usuario_id: 'u2' },
        { emoji: '🔥', usuario_id: 'u2' },
      ],
    }))
    const { listarReacoesDocumento } = await import('@/lib/documentos/interacoes')
    const r = await listarReacoesDocumento(DOC)
    expect(r['❤️']).toEqual({ contagem: 2, reagiu: true })
    expect(r['🔥']).toEqual({ contagem: 1, reagiu: false })
  })
})
