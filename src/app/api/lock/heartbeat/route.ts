import { NextRequest, NextResponse } from 'next/server'
import { criarClienteServidor } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
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

  const { documentoId } = body as { documentoId?: string }

  if (!documentoId || !UUID_REGEX.test(documentoId)) {
    return NextResponse.json({ erro: 'documentoId inválido' }, { status: 400 })
  }

  const { error } = await supabase
    .from('documento_lock')
    .update({ expira_em: new Date(Date.now() + 5 * 60 * 1000).toISOString() })
    .eq('documento_id', documentoId)
    .eq('travado_por', user.id)

  if (error) {
    return NextResponse.json({ erro: 'Lock perdido' }, { status: 409 })
  }

  return NextResponse.json({ sucesso: true })
}
