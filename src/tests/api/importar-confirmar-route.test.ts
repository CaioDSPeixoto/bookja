import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFrom = vi.fn()
const mockGetUser = vi.fn()
const mockVerificarAcessoProjeto = vi.fn()

const PROJETO_ID = '123e4567-e89b-12d3-a456-426614174000'

vi.mock('@/lib/supabase/server', () => ({
  criarClienteServidor: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/projetos/acesso', () => ({
  verificarAcessoProjeto: (...args: unknown[]) => mockVerificarAcessoProjeto(...args),
}))

vi.mock('@/lib/observabilidade/logger', () => ({
  registrarErroInterno: vi.fn(),
}))

function criarRequest(body: unknown) {
  return new NextRequest('http://localhost/api/importar/confirmar', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

function criarChain(dados: unknown = null, erro: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ data: dados, error: erro })),
    get data() { return dados },
    get error() { return erro },
  }
}

describe('POST /api/importar/confirmar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockVerificarAcessoProjeto.mockResolvedValue(undefined)
  })

  it('cria capítulos importados como rascunho privado', async () => {
    const ultimoChain = criarChain({ ordem: 2 })
    const insertChain = criarChain([{ id: 'doc-1', titulo: 'Capítulo 1', ordem: 3 }])
    mockFrom.mockReturnValueOnce(ultimoChain).mockReturnValueOnce(insertChain)
    const { POST } = await import('@/app/api/importar/confirmar/route')

    const response = await POST(criarRequest({
      projetoId: PROJETO_ID,
      capitulos: [{ titulo: '  Capítulo 1  ', conteudo: { type: 'doc', content: [] } }],
    }))

    expect(response.status).toBe(200)
    expect(insertChain.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        projeto_id: PROJETO_ID,
        titulo: 'Capítulo 1',
        tipo: 'capitulo',
        ordem: 3,
        publico: false,
        status: 'rascunho',
      }),
    ])
  })

  it('bloqueia importação com mais de 80 capítulos', async () => {
    const { POST } = await import('@/app/api/importar/confirmar/route')
    const capitulos = Array.from({ length: 81 }, (_, index) => ({
      titulo: `Capítulo ${index + 1}`,
      conteudo: { type: 'doc', content: [] },
    }))

    const response = await POST(criarRequest({ projetoId: PROJETO_ID, capitulos }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.erro).toBe('Importe no máximo 80 capítulos por vez')
    expect(mockFrom).not.toHaveBeenCalled()
  })
})
