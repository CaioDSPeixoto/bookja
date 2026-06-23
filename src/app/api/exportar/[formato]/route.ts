import { NextRequest, NextResponse } from 'next/server'
import { criarClienteServidor } from '@/lib/supabase/server'
import { exportarEpub } from '@/lib/exportacao/epub'
import { exportarDocx } from '@/lib/exportacao/docx'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formato: string }> }
) {
  try {
    const { formato } = await params
    if (formato !== 'epub' && formato !== 'docx') {
      return NextResponse.json({ erro: 'Formato inválido. Use: epub, docx' }, { status: 400 })
    }

    const projetoId = request.nextUrl.searchParams.get('projetoId')
    if (!projetoId || !UUID_REGEX.test(projetoId)) {
      return NextResponse.json({ erro: 'projetoId inválido' }, { status: 400 })
    }

    const supabase = await criarClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch project
    const { data: projeto } = await supabase
      .from('projeto')
      .select('id, titulo, sinopse, dono_id, status')
      .eq('id', projetoId)
      .single()

    if (!projeto) {
      return NextResponse.json({ erro: 'Projeto não encontrado' }, { status: 404 })
    }

    // Check access: published OR owner/collaborator
    const isPublicado = projeto.status === 'publicado'
    let temAcesso = isPublicado

    if (!temAcesso && user) {
      if (projeto.dono_id === user.id) {
        temAcesso = true
      } else {
        const { data: colab } = await supabase
          .from('projeto_colaborador')
          .select('usuario_id')
          .eq('projeto_id', projetoId)
          .eq('usuario_id', user.id)
          .single()
        temAcesso = !!colab
      }
    }

    if (!temAcesso) {
      return NextResponse.json({ erro: 'Sem permissão para exportar este projeto' }, { status: 403 })
    }

    // Fetch author name
    const { data: perfil } = await supabase
      .from('perfil')
      .select('nome_exibicao, nome_usuario')
      .eq('id', projeto.dono_id)
      .single()

    const autor = perfil?.nome_exibicao || perfil?.nome_usuario || 'Autor Desconhecido'

    // Fetch documents (public if published, all if owner/collaborator)
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
      return NextResponse.json({ erro: 'Nenhum documento encontrado para exportar' }, { status: 404 })
    }

    let buffer: Buffer
    let contentType: string
    let extensao: string

    if (formato === 'epub') {
      buffer = await exportarEpub({ titulo: projeto.titulo, sinopse: projeto.sinopse, autor }, documentos)
      contentType = 'application/epub+zip'
      extensao = 'epub'
    } else {
      buffer = await exportarDocx({ titulo: projeto.titulo, autor }, documentos)
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      extensao = 'docx'
    }

    const nomeArquivo = `${projeto.titulo.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '').trim()}.${extensao}`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(nomeArquivo)}"`,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno na exportação'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
