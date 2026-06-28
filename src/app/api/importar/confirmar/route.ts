import { NextRequest, NextResponse } from 'next/server'

import {
  eJson,
  eRegistro,
  lerJsonSeguro,
  responderErro,
  responderErroAcesso,
  responderErroInterno,
  validarUuid,
} from '@/lib/api/respostas'
import { registrarErroInterno } from '@/lib/observabilidade/logger'
import { verificarAcessoProjeto } from '@/lib/projetos/acesso'
import { criarClienteServidor } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

interface Capitulo {
  titulo: string
  conteudo: Json | null
}

function validarCapitulo(valor: unknown): valor is Capitulo {
  if (!eRegistro(valor)) return false
  const { titulo, conteudo } = valor
  return typeof titulo === 'string' && eJson(conteudo)
}

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

    const { projetoId, capitulos } = resultadoJson.dados

    if (!validarUuid(projetoId)) {
      return responderErro('projetoId inválido', 400)
    }

    if (!Array.isArray(capitulos) || capitulos.length === 0 || !capitulos.every(validarCapitulo)) {
      return responderErro('Nenhum capítulo válido para importar', 400)
    }

    try {
      await verificarAcessoProjeto(supabase, projetoId, user.id)
    } catch (error) {
      return responderErroAcesso(error, {
        mensagemSemPermissao: 'Sem permissão neste projeto',
      })
    }

    const { data: ultimo } = await supabase
      .from('documento')
      .select('ordem')
      .eq('projeto_id', projetoId)
      .order('ordem', { ascending: false })
      .limit(1)
      .single()

    const ordemInicial = (ultimo?.ordem ?? 0) + 1

    const documentos = capitulos.map((cap, indice) => ({
      projeto_id: projetoId,
      titulo: cap.titulo || `Capítulo ${ordemInicial + indice}`,
      tipo: 'capitulo' as const,
      conteudo: cap.conteudo,
      ordem: ordemInicial + indice,
    }))

    const { data, error } = await supabase
      .from('documento')
      .insert(documentos)
      .select('id, titulo, ordem')

    if (error) throw new Error(error.message)

    return NextResponse.json({ dados: { documentos: data } })
  } catch (error) {
    registrarErroInterno('api.importar.confirmar.post', error, {
      rota: request.nextUrl.pathname,
      contentLength: request.headers.get('content-length'),
    })

    return responderErroInterno()
  }
}
