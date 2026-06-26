import { NextRequest, NextResponse } from 'next/server'
import { criarClienteServidor } from '@/lib/supabase/server'
import { importarEpub } from '@/lib/importacao/epub'
import { importarDocx } from '@/lib/importacao/docx'
import { verificarAcessoProjeto } from '@/lib/projetos/acesso'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await criarClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const arquivo = formData.get('arquivo') as File | null
    const projetoId = formData.get('projetoId') as string | null

    if (!projetoId || !UUID_REGEX.test(projetoId)) {
      return NextResponse.json({ erro: 'projetoId inválido' }, { status: 400 })
    }

    if (!arquivo) {
      return NextResponse.json({ erro: 'Arquivo não enviado' }, { status: 400 })
    }

    if (arquivo.size > MAX_SIZE) {
      return NextResponse.json({ erro: 'Arquivo excede o limite de 5MB' }, { status: 400 })
    }

    try {
      await verificarAcessoProjeto(supabase, projetoId, user.id)
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Sem permissão neste projeto'
      if (mensagem === 'Projeto não encontrado') {
        return NextResponse.json({ erro: mensagem }, { status: 404 })
      }
      return NextResponse.json({ erro: 'Sem permissão neste projeto' }, { status: 403 })
    }

    const nomeArquivo = arquivo.name.toLowerCase()
    const buffer = Buffer.from(await arquivo.arrayBuffer())

    let capitulos: { titulo: string; conteudo: unknown }[]

    if (nomeArquivo.endsWith('.epub')) {
      capitulos = await importarEpub(buffer)
    } else if (nomeArquivo.endsWith('.docx')) {
      capitulos = await importarDocx(buffer)
    } else {
      return NextResponse.json({ erro: 'Formato não suportado. Use .epub ou .docx' }, { status: 400 })
    }

    return NextResponse.json({ dados: { capitulos } })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao processar importação'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
