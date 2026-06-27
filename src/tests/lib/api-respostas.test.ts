import { describe, expect, it } from 'vitest'

import {
  eJson,
  eRegistro,
  responderErroAcesso,
  validarUuid,
} from '@/lib/api/respostas'

const UUID_VALIDO = '123e4567-e89b-12d3-a456-426614174000'

describe('API - respostas e validações', () => {
  it('valida UUID no formato esperado', () => {
    expect(validarUuid(UUID_VALIDO)).toBe(true)
    expect(validarUuid('123')).toBe(false)
    expect(validarUuid(null)).toBe(false)
  })

  it('identifica objetos simples como registro', () => {
    expect(eRegistro({ id: UUID_VALIDO })).toBe(true)
    expect(eRegistro([])).toBe(false)
    expect(eRegistro(null)).toBe(false)
  })

  it('aceita valores JSON serializáveis', () => {
    expect(eJson({ texto: 'ok', lista: [1, true, null] })).toBe(true)
    expect(eJson(Number.NaN)).toBe(false)
    expect(eJson(() => null)).toBe(false)
  })

  it('mapeia projeto não encontrado para 404 sem expor erro interno', () => {
    const resposta = responderErroAcesso(new Error('Projeto não encontrado'))
    expect(resposta.status).toBe(404)
  })

  it('mapeia usuário não autenticado para 401', () => {
    const resposta = responderErroAcesso(new Error('Não autenticado'))
    expect(resposta.status).toBe(401)
  })

  it('mapeia demais erros de acesso para 403', () => {
    const resposta = responderErroAcesso(new Error('detalhe interno'), {
      mensagemSemPermissao: 'Sem permissão neste projeto',
    })
    expect(resposta.status).toBe(403)
  })
})
