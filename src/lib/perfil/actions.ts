'use server'

import { criarClienteServidor } from '@/lib/supabase/server'

async function obterUsuarioOuErro() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return { supabase, user }
}

export async function atualizarPerfil(dados: { nome_exibicao?: string; bio?: string; chave_pix?: string }) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('perfil')
    .update(dados)
    .eq('id', user.id)

  if (error) throw new Error(error.message)
}

export async function buscarPerfilPublico(nomeUsuario: string) {
  const supabase = await criarClienteServidor()

  const { data: perfil, error } = await supabase
    .from('perfil')
    .select('id, nome_usuario, nome_exibicao, bio, avatar_url, chave_pix')
    .eq('nome_usuario', nomeUsuario)
    .single()

  if (error || !perfil) return null

  const { data: projetos } = await supabase
    .from('projeto')
    .select('id, titulo, sinopse, status')
    .eq('dono_id', perfil.id)
    .eq('status', 'publicado')
    .order('created_at', { ascending: false })

  const { data: leituras } = await supabase
    .from('leitura_atual')
    .select('projeto_id, ultimo_documento_id, projeto:projeto_id(id, titulo)')
    .eq('usuario_id', perfil.id)

  return { perfil, projetos: projetos || [], leituras: leituras || [] }
}

export async function obterMeuPerfil() {
  const { supabase, user } = await obterUsuarioOuErro()

  const { data, error } = await supabase
    .from('perfil')
    .select('nome_exibicao, bio, chave_pix')
    .eq('id', user.id)
    .single()

  if (error) throw new Error(error.message)
  return data
}
