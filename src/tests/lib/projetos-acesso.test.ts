import { describe, expect, it, vi } from 'vitest'

import { verificarAcessoProjeto } from '@/lib/projetos/acesso'

function criarQuery(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ data, error: null })),
  }
}

function criarSupabaseMock(projeto: unknown, colaborador: unknown) {
  const projetoQuery = criarQuery(projeto)
  const colaboradorQuery = criarQuery(colaborador)
  const from = vi
    .fn()
    .mockReturnValueOnce(projetoQuery)
    .mockReturnValueOnce(colaboradorQuery)

  return {
    supabase: { from },
    projetoQuery,
    colaboradorQuery,
  }
}

describe('Acesso a projeto', () => {
  it('permite acesso ao dono sem consultar colaboradores', async () => {
    const { supabase } = criarSupabaseMock(
      { id: 'projeto-1', dono_id: 'usuario-1', status: 'rascunho' },
      null,
    )

    const resultado = await verificarAcessoProjeto(
      supabase as never,
      'projeto-1',
      'usuario-1',
    )

    expect(resultado.tipo).toBe('dono')
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('permite acesso ao colaborador aceito', async () => {
    const { supabase, colaboradorQuery } = criarSupabaseMock(
      { id: 'projeto-1', dono_id: 'dono-1', status: 'rascunho' },
      { usuario_id: 'usuario-1' },
    )

    const resultado = await verificarAcessoProjeto(
      supabase as never,
      'projeto-1',
      'usuario-1',
    )

    expect(resultado.tipo).toBe('colaborador')
    expect(colaboradorQuery.not).toHaveBeenCalledWith('aceito_em', 'is', null)
  })

  it('bloqueia convite pendente sem aceite', async () => {
    const { supabase, colaboradorQuery } = criarSupabaseMock(
      { id: 'projeto-1', dono_id: 'dono-1', status: 'rascunho' },
      null,
    )

    await expect(verificarAcessoProjeto(
      supabase as never,
      'projeto-1',
      'usuario-1',
    )).rejects.toThrow('Sem permissão')

    expect(colaboradorQuery.not).toHaveBeenCalledWith('aceito_em', 'is', null)
  })
})
