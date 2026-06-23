'use server'

import { criarClienteServidor } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

export async function atualizarProjeto(id: string, dados: { titulo?: string; sinopse?: string | null; status?: string }) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('projeto')
    .update(dados)
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
  redirect(`/${locale}/painel`)
}

export async function listarProjetos() {
  const { supabase, user } = await obterUsuarioOuErro()

  const { data, error } = await supabase
    .from('projeto')
    .select('*, documento(count)')
    .eq('dono_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
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
