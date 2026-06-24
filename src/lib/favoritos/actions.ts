'use server'

import { criarClienteServidor } from '@/lib/supabase/server'

export async function toggleFavorito(projetoId: string) {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: existente } = await supabase
    .from('favorito')
    .select('usuario_id')
    .eq('usuario_id', user.id)
    .eq('projeto_id', projetoId)
    .single()

  if (existente) {
    await supabase.from('favorito').delete().eq('usuario_id', user.id).eq('projeto_id', projetoId)
    return { favoritado: false }
  }

  await supabase.from('favorito').insert({ usuario_id: user.id, projeto_id: projetoId })
  return { favoritado: true }
}
