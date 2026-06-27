import { NextRequest, NextResponse } from 'next/server'

export { eJson, eRegistro, validarUuid } from '@/lib/validacao/comum'

type ResultadoJson =
  | { sucesso: true; dados: unknown }
  | { sucesso: false; resposta: NextResponse }

type OpcoesErroAcesso = {
  mensagemSemPermissao?: string
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
