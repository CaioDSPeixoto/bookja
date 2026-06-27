import { NextRequest, NextResponse } from 'next/server'

import {
  eRegistro,
  lerJsonSeguro,
  responderErro,
  responderErroInterno,
  validarUuid,
} from '@/lib/api/respostas'
import { criarClienteServidor } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await criarClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return responderErro('Autenticação necessária', 401)
    }

    const resultadoJson = await lerJsonSeguro(request)
    if (!resultadoJson.sucesso) return resultadoJson.resposta
    if (!eRegistro(resultadoJson.dados)) return responderErro('Body inválido', 400)

    const { documentoId } = resultadoJson.dados
    if (!validarUuid(documentoId)) {
      return responderErro('documentoId inválido', 400)
    }

    const { error } = await supabase
      .from('documento_lock')
      .update({ expira_em: new Date(Date.now() + 5 * 60 * 1000).toISOString() })
      .eq('documento_id', documentoId)
      .eq('travado_por', user.id)

    if (error) {
      return responderErro('Lock perdido', 409)
    }

    return NextResponse.json({ sucesso: true })
  } catch {
    return responderErroInterno()
  }
}
