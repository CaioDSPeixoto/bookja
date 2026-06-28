import { NextRequest, NextResponse } from 'next/server'

import {
  eRegistro,
  lerJsonSeguro,
  responderErro,
  responderErroInterno,
  validarUuid,
} from '@/lib/api/respostas'
import { registrarErroInterno } from '@/lib/observabilidade/logger'
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

    await supabase
      .from('documento_lock')
      .delete()
      .eq('documento_id', documentoId)
      .eq('travado_por', user.id)

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    registrarErroInterno('api.lock.liberar.post', error, {
      rota: request.nextUrl.pathname,
      contentLength: request.headers.get('content-length'),
    })

    return responderErroInterno()
  }
}
