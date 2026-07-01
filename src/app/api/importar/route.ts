import { NextRequest, NextResponse } from 'next/server'

import {
  responderErro,
  responderErroAcesso,
  responderErroInterno,
  validarUuid,
} from '@/lib/api/respostas'
import { importarDocx } from '@/lib/importacao/docx'
import { importarEpub } from '@/lib/importacao/epub'
import { MAX_CAPITULOS_IMPORTACAO, TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO } from '@/lib/importacao/limites'
import { registrarErroInterno } from '@/lib/observabilidade/logger'
import { verificarAcessoProjeto } from '@/lib/projetos/acesso'
import { criarClienteServidor } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await criarClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return responderErro('Autenticação necessária', 401)
    }

    const formData = await request.formData()
    const arquivo = formData.get('arquivo') as File | null
    const projetoId = formData.get('projetoId')

    if (!validarUuid(projetoId)) {
      return responderErro('projetoId inválido', 400)
    }

    if (!arquivo) {
      return responderErro('Arquivo não enviado', 400)
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO) {
      return responderErro('Arquivo excede o limite de 5MB', 400)
    }

    try {
      await verificarAcessoProjeto(supabase, projetoId, user.id)
    } catch (error) {
      return responderErroAcesso(error, {
        mensagemSemPermissao: 'Sem permissão neste projeto',
      })
    }

    const nomeArquivo = arquivo.name.toLowerCase()
    const buffer = Buffer.from(await arquivo.arrayBuffer())

    let capitulos: { titulo: string; conteudo: unknown }[]

    if (nomeArquivo.endsWith('.epub')) {
      capitulos = await importarEpub(buffer)
    } else if (nomeArquivo.endsWith('.docx')) {
      capitulos = await importarDocx(buffer)
    } else {
      return responderErro('Formato não suportado. Use .epub ou .docx', 400)
    }

    if (capitulos.length > MAX_CAPITULOS_IMPORTACAO) {
      return responderErro(`O arquivo gerou ${capitulos.length} capítulos. Importe no máximo ${MAX_CAPITULOS_IMPORTACAO} por vez.`, 400)
    }

    return NextResponse.json({ dados: { capitulos } })
  } catch (error) {
    registrarErroInterno('api.importar.post', error, {
      rota: request.nextUrl.pathname,
      contentLength: request.headers.get('content-length'),
    })

    return responderErroInterno()
  }
}
