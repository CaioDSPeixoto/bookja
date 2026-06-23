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

  await supabase
    .from('documento_lock')
    .delete()
    .eq('documento_id', documentoId)
    .eq('travado_por', user.id)

  return NextResponse.json({ sucesso: true })
}
