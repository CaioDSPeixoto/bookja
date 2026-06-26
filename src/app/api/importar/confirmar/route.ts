import { NextRequest, NextResponse } from 'next/server'
import { criarClienteServidor } from '@/lib/supabase/server'
import { verificarAcessoProjeto } from '@/lib/projetos/acesso'
import type { Json } from '@/types/database'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Capitulo {
  titulo: string
  conteudo: Json | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await criarClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ erro: 'Body inválido' }, { status: 400 })
    }

    const { projetoId, capitulos } = body as { projetoId?: string; capitulos?: Capitulo[] }

    if (!projetoId || !UUID_REGEX.test(projetoId)) {
      return NextResponse.json({ erro: 'projetoId inválido' }, { status: 400 })
    }

    if (!capitulos || !Array.isArray(capitulos) || capitulos.length === 0) {
      return NextResponse.json({ erro: 'Nenhum capítulo para importar' }, { status: 400 })
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

    // Get current max order
    const { data: ultimo } = await supabase
      .from('documento')
      .select('ordem')
      .eq('projeto_id', projetoId)
      .order('ordem', { ascending: false })
      .limit(1)
      .single()

    const ordemInicial = (ultimo?.ordem ?? 0) + 1

    // Insert all chapters
    const documentos = capitulos.map((cap, i) => ({
      projeto_id: projetoId,
      titulo: cap.titulo || `Capítulo ${ordemInicial + i}`,
      tipo: 'capitulo' as const,
      conteudo: cap.conteudo,
      ordem: ordemInicial + i,
    }))

    const { data, error } = await supabase
      .from('documento')
      .insert(documentos)
      .select('id, titulo, ordem')

    if (error) throw new Error(error.message)

    return NextResponse.json({ dados: { documentos: data } })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao confirmar importação'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
