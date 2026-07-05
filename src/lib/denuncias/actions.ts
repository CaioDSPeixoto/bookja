'use server'

import { erroOperacao, erroPublico } from '@/lib/actions/erros'
import { criarClienteServidor } from '@/lib/supabase/server'
import { validarUuid } from '@/lib/validacao/comum'

export type TipoAlvoDenuncia = 'comentario' | 'mural' | 'projeto'

const TIPOS_VALIDOS: readonly TipoAlvoDenuncia[] = ['comentario', 'mural', 'projeto']

function validarTipoAlvo(tipo: unknown): TipoAlvoDenuncia {
  if (typeof tipo !== 'string' || !TIPOS_VALIDOS.includes(tipo as TipoAlvoDenuncia)) {
    throw erroPublico('Tipo de conteúdo inválido')
  }
  return tipo as TipoAlvoDenuncia
}

function normalizarMotivo(motivo: unknown): string {
  const texto = typeof motivo === 'string' ? motivo.trim() : ''
  if (!texto) throw erroPublico('Descreva o motivo da denúncia')
  if (texto.length > 500) throw erroPublico('Motivo muito longo')
  return texto
}

/** Registra uma denúncia de conteúdo. Idempotente por (usuário, alvo). */
export async function denunciar(tipoAlvo: TipoAlvoDenuncia, alvoId: string, motivo: string) {
  const tipo = validarTipoAlvo(tipoAlvo)
  if (!validarUuid(alvoId)) throw erroPublico('Conteúdo inválido')
  const motivoValidado = normalizarMotivo(motivo)

  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  const { error } = await supabase.from('denuncia').insert({
    denunciante_id: user.id,
    tipo_alvo: tipo,
    alvo_id: alvoId,
    motivo: motivoValidado,
  })

  // 23505 = violação de índice único: o usuário já denunciou este conteúdo.
  if (error && (error as { code?: string }).code === '23505') {
    return { jaDenunciado: true }
  }
  if (error) throw erroOperacao('Não foi possível registrar a denúncia')

  return { jaDenunciado: false }
}

type DenunciaPendente = {
  id: string
  tipo_alvo: string
  alvo_id: string
  motivo: string
  criado_em: string
  perfil: { nome_usuario: string; nome_exibicao: string | null } | null
}

/** Lista denúncias pendentes (apenas admin; a RLS restringe o acesso). */
export async function listarDenunciasPendentes(): Promise<DenunciaPendente[]> {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  const { data, error } = await supabase
    .from('denuncia')
    .select('id, tipo_alvo, alvo_id, motivo, criado_em, perfil:denunciante_id(nome_usuario, nome_exibicao)')
    .eq('resolvida', false)
    .order('criado_em', { ascending: false })

  if (error) throw erroOperacao('Não foi possível listar as denúncias')
  return (data || []) as unknown as DenunciaPendente[]
}

/** Marca uma denúncia como resolvida (apenas admin; a RLS restringe a escrita). */
export async function resolverDenuncia(id: string) {
  if (!validarUuid(id)) throw erroPublico('Denúncia inválida')
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  const { error } = await supabase
    .from('denuncia')
    .update({ resolvida: true, resolvida_em: new Date().toISOString() })
    .eq('id', id)

  if (error) throw erroOperacao('Não foi possível resolver a denúncia')
}

/** Indica se o usuário logado é administrador (moderador). */
export async function souAdmin(): Promise<boolean> {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('perfil')
    .select('papel')
    .eq('id', user.id)
    .maybeSingle()

  return data?.papel === 'admin'
}
