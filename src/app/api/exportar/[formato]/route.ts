import { NextRequest, NextResponse } from 'next/server'

import {
  responderErro,
  responderErroAcesso,
  responderErroInterno,
  validarUuid,
} from '@/lib/api/respostas'
import { exportarDocx } from '@/lib/exportacao/docx'
import { exportarEpub } from '@/lib/exportacao/epub'
import { exportarPdf } from '@/lib/exportacao/pdf'
import { obterUsuarioOpcional, verificarAcessoProjeto } from '@/lib/projetos/acesso'
import { criarClienteServidor } from '@/lib/supabase/server'

type FormatoExportacao = 'epub' | 'docx' | 'pdf'

function validarFormato(formato: string): formato is FormatoExportacao {
  return formato === 'epub' || formato === 'docx' || formato === 'pdf'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formato: string }> },
) {
  try {
    const { formato } = await params
    if (!validarFormato(formato)) {
      return responderErro('Formato inválido. Use: epub, docx, pdf', 400)
    }

    const projetoId = request.nextUrl.searchParams.get('projetoId')
    if (!validarUuid(projetoId)) {
      return responderErro('projetoId inválido', 400)
    }

    const supabase = await criarClienteServidor()
    const user = await obterUsuarioOpcional(supabase)

    const { data: projeto } = await supabase
      .from('projeto')
      .select('id, titulo, sinopse, dono_id, status')
      .eq('id', projetoId)
      .single()

    if (!projeto) {
      return responderErro('Projeto não encontrado', 404)
    }

    const isPublicado = projeto.status === 'publicado'
    if (!isPublicado) {
      try {
        await verificarAcessoProjeto(supabase, projetoId, user?.id ?? null)
      } catch (error) {
        return responderErroAcesso(error, {
          mensagemSemPermissao: 'Sem permissão para exportar este projeto',
        })
      }
    }

    const { data: perfil } = await supabase
      .from('perfil')
      .select('nome_exibicao, nome_usuario')
      .eq('id', projeto.dono_id)
      .single()

    const autor = perfil?.nome_exibicao || perfil?.nome_usuario || 'Autor Desconhecido'

    let query = supabase
      .from('documento')
      .select('titulo, conteudo')
      .eq('projeto_id', projetoId)
      .eq('tipo', 'capitulo')
      .order('ordem', { ascending: true })

    if (isPublicado && projeto.dono_id !== user?.id) {
      query = query.eq('publico', true)
    }

    const { data: documentos } = await query
    if (!documentos || documentos.length === 0) {
      return responderErro('Nenhum documento encontrado para exportar', 404)
    }

    let buffer: Buffer
    let contentType: string

    switch (formato) {
      case 'epub':
        buffer = await exportarEpub({ titulo: projeto.titulo, sinopse: projeto.sinopse, autor }, documentos)
        contentType = 'application/epub+zip'
        break
      case 'pdf':
        buffer = await exportarPdf({ titulo: projeto.titulo, autor }, documentos)
        contentType = 'application/pdf'
        break
      case 'docx':
        buffer = await exportarDocx({ titulo: projeto.titulo, autor }, documentos)
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
    }

    const nomeArquivo = `${projeto.titulo.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '').trim()}.${formato}`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(nomeArquivo)}"`,
      },
    })
  } catch {
    return responderErroInterno()
  }
}
