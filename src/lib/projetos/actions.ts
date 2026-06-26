'use server'

import { criarClienteServidor } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type StatusProjeto = 'rascunho' | 'revisao' | 'publicado'

async function obterUsuarioOuErro() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return { supabase, user }
}

export async function criarProjeto(formData: FormData) {
  const { supabase, user } = await obterUsuarioOuErro()
  const titulo = formData.get('titulo') as string
  const sinopse = formData.get('sinopse') as string | null

  const { data, error } = await supabase
    .from('projeto')
    .insert({ titulo, sinopse: sinopse || null, dono_id: user.id, status: 'rascunho' })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

export async function atualizarProjeto(id: string, dados: { titulo?: string; sinopse?: string | null; status?: StatusProjeto; capa_url?: string | null }) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('projeto')
    .update(dados)
    .eq('id', id)
    .eq('dono_id', user.id)

  if (error) throw new Error(error.message)
}

export async function publicarProjeto(id: string, dados: { titulo?: string; sinopse?: string | null }) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { data: documentos, error: erroDocumentos } = await supabase
    .from('documento')
    .select('id')
    .eq('projeto_id', id)
    .eq('tipo', 'capitulo')
    .limit(1)

  if (erroDocumentos) throw new Error(erroDocumentos.message)
  if (!documentos || documentos.length === 0) throw new Error('Projeto precisa ter pelo menos um capítulo')

  const { error } = await supabase
    .from('projeto')
    .update({
      ...dados,
      status: 'publicado',
      publicado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('dono_id', user.id)

  if (error) throw new Error(error.message)
}

export async function despublicarProjeto(id: string, dados: { titulo?: string; sinopse?: string | null }) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('projeto')
    .update({
      ...dados,
      status: 'rascunho',
      publicado_em: null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('dono_id', user.id)

  if (error) throw new Error(error.message)
}

export async function excluirProjeto(id: string, locale: string) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('projeto')
    .delete()
    .eq('id', id)
    .eq('dono_id', user.id)

  if (error) throw new Error(error.message)
  redirect(`/${locale}/biblioteca`)
}

export async function listarProjetos() {
  const { supabase, user } = await obterUsuarioOuErro()

  const { data, error } = await supabase
    .from('projeto')
    .select('*, documento(count)')
    .eq('dono_id', user.id)
    .order('criado_em', { ascending: false })

  if (error) {
    return []
  }
  return data ?? []
}

export async function obterProjeto(id: string) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { data, error } = await supabase
    .from('projeto')
    .select('*, documento(*)')
    .eq('id', id)
    .eq('dono_id', user.id)
    .single()

  if (error) throw new Error(error.message)
  return data
}
