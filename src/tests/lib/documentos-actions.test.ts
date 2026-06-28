import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
const mockObterUsuarioAutenticado = vi.fn()
const mockVerificarAcessoProjeto = vi.fn()
const mockNotificarFavoritosNovoCapitulo = vi.fn()

const PROJETO_ID = '123e4567-e89b-12d3-a456-426614174000'
const DOCUMENTO_ID = '223e4567-e89b-12d3-a456-426614174000'

vi.mock('@/lib/supabase/server', () => ({
  criarClienteServidor: vi.fn(() => ({
    from: mockFrom,
  })),
}))

vi.mock('@/lib/projetos/acesso', () => ({
  obterUsuarioAutenticado: (...args: unknown[]) => mockObterUsuarioAutenticado(...args),
  verificarAcessoProjeto: (...args: unknown[]) => mockVerificarAcessoProjeto(...args),
}))

vi.mock('@/lib/notificacoes/actions', () => ({
  notificarFavoritosNovoCapitulo: (...args: unknown[]) => mockNotificarFavoritosNovoCapitulo(...args),
}))

function setupChain(dados: unknown = null, erro: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ data: dados, error: erro })),
    then: undefined,
  }

  Object.defineProperty(chain, 'data', { get: () => dados })
  Object.defineProperty(chain, 'error', { get: () => erro })
  mockFrom.mockReturnValue(chain)
  return chain
}

describe('Server Actions - Documentos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockObterUsuarioAutenticado.mockResolvedValue({ id: 'user-123' })
    mockVerificarAcessoProjeto.mockResolvedValue(undefined)
  })

  it('criarDocumento valida UUID do projeto antes de consultar documentos', async () => {
    const { criarDocumento } = await import('@/lib/documentos/actions')

    await expect(criarDocumento('projeto-invalido', 'Capítulo', 'capitulo')).rejects.toThrow(
      'Projeto inválido',
    )
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('criarDocumento valida tipo antes de inserir', async () => {
    const { criarDocumento } = await import('@/lib/documentos/actions')

    await expect(
      criarDocumento(PROJETO_ID, 'Capítulo', 'invalido' as never),
    ).rejects.toThrow('Tipo de documento inválido')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('criarDocumento define ordem, normaliza título e nasce como rascunho', async () => {
    const ultimoChain = setupChain({ ordem: 2 })
    const inserirChain = setupChain({ id: DOCUMENTO_ID, titulo: 'Capítulo', ordem: 3 })
    mockFrom.mockReturnValueOnce(ultimoChain).mockReturnValueOnce(inserirChain)
    const { criarDocumento } = await import('@/lib/documentos/actions')

    await criarDocumento(PROJETO_ID, '  Capítulo  ', 'capitulo')

    expect(mockFrom).toHaveBeenNthCalledWith(1, 'documento')
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'documento')
    expect(inserirChain.insert).toHaveBeenCalledWith(expect.objectContaining({
      projeto_id: PROJETO_ID,
      titulo: 'Capítulo',
      tipo: 'capitulo',
      ordem: 3,
      publico: false,
      status: 'rascunho',
    }))
  })

  it('alterarStatusDocumento publica capítulo e notifica favoritos', async () => {
    const buscarChain = setupChain({
      id: DOCUMENTO_ID,
      projeto_id: PROJETO_ID,
      titulo: 'Capítulo 1',
      status: 'revisao',
    })
    const atualizarChain = setupChain({
      id: DOCUMENTO_ID,
      projeto_id: PROJETO_ID,
      titulo: 'Capítulo 1',
      status: 'publicado',
      publico: true,
      publicado_em: new Date().toISOString(),
    })
    mockFrom.mockReturnValueOnce(buscarChain).mockReturnValueOnce(atualizarChain)
    mockNotificarFavoritosNovoCapitulo.mockResolvedValue(undefined)
    const { alterarStatusDocumento } = await import('@/lib/documentos/actions')

    await alterarStatusDocumento(DOCUMENTO_ID, 'publicado')

    expect(atualizarChain.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'publicado',
      publico: true,
      publicado_em: expect.any(String),
    }))
    expect(mockNotificarFavoritosNovoCapitulo).toHaveBeenCalledWith(
      PROJETO_ID,
      DOCUMENTO_ID,
      'Novo capítulo publicado: Capítulo 1',
    )
  })

  it('alterarStatusDocumento bloqueia publicação direta a partir de rascunho', async () => {
    const buscarChain = setupChain({
      id: DOCUMENTO_ID,
      projeto_id: PROJETO_ID,
      titulo: 'Capítulo 1',
      status: 'rascunho',
    })
    mockFrom.mockReturnValueOnce(buscarChain)
    const { alterarStatusDocumento } = await import('@/lib/documentos/actions')

    await expect(alterarStatusDocumento(DOCUMENTO_ID, 'publicado')).rejects.toThrow(
      'Capítulo precisa passar por revisão antes de ser publicado',
    )
  })

  it('alterarStatusDocumento bloqueia revisão supervisionada com aprovação pendente', async () => {
    const buscarChain = setupChain({
      id: DOCUMENTO_ID,
      projeto_id: PROJETO_ID,
      titulo: 'Capítulo 1',
      status: 'revisao_supervisionada',
    })
    const pendentesChain = setupChain([{ usuario_id: 'revisor-1' }])
    mockFrom.mockReturnValueOnce(buscarChain).mockReturnValueOnce(pendentesChain)
    const { alterarStatusDocumento } = await import('@/lib/documentos/actions')

    await expect(alterarStatusDocumento(DOCUMENTO_ID, 'publicado')).rejects.toThrow(
      'Aprovação dos colaboradores pendente',
    )
  })

  it('atualizarDocumento rejeita conteúdo inválido antes de buscar o documento', async () => {
    const { atualizarDocumento } = await import('@/lib/documentos/actions')

    await expect(
      atualizarDocumento(DOCUMENTO_ID, { conteudo: Number.NaN as never }),
    ).rejects.toThrow('Conteúdo do documento inválido')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('atualizarDocumento não expõe erro técnico do banco', async () => {
    const buscarChain = setupChain({ projeto_id: PROJETO_ID })
    const atualizarChain = setupChain(null, { message: 'permission denied for table documento' })
    mockFrom.mockReturnValueOnce(buscarChain).mockReturnValueOnce(atualizarChain)
    const { atualizarDocumento } = await import('@/lib/documentos/actions')

    await expect(
      atualizarDocumento(DOCUMENTO_ID, { titulo: 'Novo título' }),
    ).rejects.toThrow('Não foi possível atualizar o documento')
  })
})
