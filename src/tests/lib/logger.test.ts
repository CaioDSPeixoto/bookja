import { afterEach, describe, expect, it, vi } from 'vitest'

import { registrarErroInterno } from '@/lib/observabilidade/logger'

describe('logger de observabilidade', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('não registra erro durante testes', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    registrarErroInterno('teste.escopo', new Error('falha interna'))

    expect(consoleError).not.toHaveBeenCalled()
  })

  it('registra erro estruturado com campos sensíveis redigidos', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    registrarErroInterno('api.teste', new Error('falha interna'), {
      projetoId: '123e4567-e89b-12d3-a456-426614174000',
      authorization: 'Bearer segredo',
      tokenSessao: 'segredo',
    })

    expect(consoleError).toHaveBeenCalledOnce()

    const [payloadSerializado] = consoleError.mock.calls[0]
    const payload = JSON.parse(String(payloadSerializado))

    expect(payload).toMatchObject({
      nivel: 'error',
      escopo: 'api.teste',
      contexto: {
        projetoId: '123e4567-e89b-12d3-a456-426614174000',
        authorization: '[redigido]',
        tokenSessao: '[redigido]',
      },
      erro: {
        nome: 'Error',
        mensagem: 'falha interna',
      },
    })
  })
})
