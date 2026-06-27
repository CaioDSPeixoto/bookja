'use server'

import { erroOperacao, erroPublico } from '@/lib/actions/erros'
import { criarClienteServidor } from '@/lib/supabase/server'
import { validarUuid } from '@/lib/validacao/comum'

function validarIdProjeto(projetoId: unknown): string {
  if (!validarUuid(projetoId)) {
    throw erroPublico('Projeto inválido')
  }

  return projetoId
}

export async function toggleFavorito(projetoId: string) {
  const projetoIdValidado = validarIdProjeto(projetoId)
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  const { data: existente } = await supabase
    .from('favorito')
    .select('usuario_id')
    .eq('usuario_id', user.id)
    .eq('projeto_id', projetoIdValidado)
    .single()

  if (existente) {
    const { error } = await supabase
      .from('favorito')
      .delete()
      .eq('usuario_id', user.id)
      .eq('projeto_id', projetoIdValidado)

    if (error) throw erroOperacao('Não foi possível remover o favorito')
    return { favoritado: false }
  }

  const { error } = await supabase
    .from('favorito')
    .insert({ usuario_id: user.id, projeto_id: projetoIdValidado })

  if (error) throw erroOperacao('Não foi possível favoritar o projeto')
  return { favoritado: true }
}
