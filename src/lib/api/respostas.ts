import { NextRequest, NextResponse } from 'next/server'

import type { Json } from '@/types/database'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type ResultadoJson =
  | { sucesso: true; dados: unknown }
  | { sucesso: false; resposta: NextResponse }

type OpcoesErroAcesso = {
  mensagemSemPermissao?: string
}

export function validarUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && UUID_REGEX.test(valor)
}

export async function lerJsonSeguro(request: NextRequest): Promise<ResultadoJson> {
  try {
    return { sucesso: true, dados: await request.json() }
  } catch {
    return { sucesso: false, resposta: responderErro('Body inválido', 400) }
  }
}

export function responderErro(erro: string, status: number): NextResponse {
  return NextResponse.json({ erro }, { status })
}

export function responderErroInterno(): NextResponse {
  return responderErro('Erro interno. Tente novamente.', 500)
}

export function responderErroAcesso(
  error: unknown,
  opcoes: OpcoesErroAcesso = {},
): NextResponse {
  const mensagem = error instanceof Error ? error.message : ''

  if (mensagem === 'Projeto não encontrado') {
    return responderErro('Projeto não encontrado', 404)
  }

  if (mensagem === 'Não autenticado') {
    return responderErro('Autenticação necessária', 401)
  }

  return responderErro(opcoes.mensagemSemPermissao ?? 'Sem permissão', 403)
}

export function eRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

export function eJson(valor: unknown): valor is Json {
  if (valor === null) return true

  switch (typeof valor) {
    case 'string':
    case 'boolean':
      return true
    case 'number':
      return Number.isFinite(valor)
    case 'object':
      if (Array.isArray(valor)) return valor.every((item) => eJson(item))
      return Object.values(valor).every((item) => eJson(item))
    default:
      return false
  }
}
