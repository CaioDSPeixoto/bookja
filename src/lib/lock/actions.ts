'use server'

import { criarClienteServidor } from '@/lib/supabase/server'

async function obterUsuario() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return { supabase, user }
}

export async function adquirirLock(documentoId: string) {
  const { supabase, user } = await obterUsuario()

  // Tenta inserir ou atualizar lock se expirado ou do mesmo user
  const { data, error } = await supabase.rpc('adquirir_lock_documento', {
    p_documento_id: documentoId,
    p_usuario_id: user.id,
  })

  if (error) {
    // Fallback: verificar lock atual
    const { data: lockAtual } = await supabase
      .from('documento_lock')
      .select('travado_por, expira_em, perfil:perfil!documento_lock_travado_por_fkey(nome_usuario)')
      .eq('documento_id', documentoId)
      .single()

    if (lockAtual && lockAtual.travado_por !== user.id) {
      const expirado = new Date(lockAtual.expira_em) < new Date()
      if (!expirado) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const perfil = lockAtual.perfil as any
        const nome = perfil?.nome_usuario || 'Alguém'
        return { sucesso: false, travadoPor: nome }
      }
    }

    // Lock expirado ou inexistente — tomar
    await supabase.from('documento_lock').upsert({
      documento_id: documentoId,
      travado_por: user.id,
      travado_em: new Date().toISOString(),
      expira_em: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })
    return { sucesso: true }
  }

  const resultado = data as { sucesso?: boolean; travado_por_nome?: string } | null
  return resultado?.sucesso !== false ? { sucesso: true } : { sucesso: false, travadoPor: resultado.travado_por_nome }
}

export async function liberarLock(documentoId: string) {
  const { supabase, user } = await obterUsuario()

  await supabase
    .from('documento_lock')
    .delete()
    .eq('documento_id', documentoId)
    .eq('travado_por', user.id)
}

export async function renovarLock(documentoId: string) {
  const { supabase, user } = await obterUsuario()

  const { error } = await supabase
    .from('documento_lock')
    .update({ expira_em: new Date(Date.now() + 5 * 60 * 1000).toISOString() })
    .eq('documento_id', documentoId)
    .eq('travado_por', user.id)

  if (error) return { sucesso: false }
  return { sucesso: true }
}

export async function verificarLock(documentoId: string) {
  const { supabase, user } = await obterUsuario()

  const { data } = await supabase
    .from('documento_lock')
    .select('travado_por, expira_em, perfil:perfil!documento_lock_travado_por_fkey(nome_usuario)')
    .eq('documento_id', documentoId)
    .single()

  if (!data) return { livre: true }

  const expirado = new Date(data.expira_em) < new Date()
  if (expirado) return { livre: true }

  if (data.travado_por === user.id) return { livre: false, proprio: true }

  const nome = (data.perfil as unknown as { nome_usuario: string })?.nome_usuario || 'Alguém'
  return { livre: false, proprio: false, travadoPor: nome }
}
