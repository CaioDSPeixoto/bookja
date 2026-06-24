import { criarClienteServidor } from '@/lib/supabase/server'

const POR_PAGINA = 12

export async function buscarHistoriaPublica(id: string) {
  const supabase = await criarClienteServidor()

  const { data, error } = await supabase
    .from('projeto')
    .select(`
      *,
      perfil:dono_id(nome_usuario, nome_exibicao, avatar_url, chave_pix),
      projeto_colaborador(usuario_id, papel, perfil:usuario_id(nome_usuario, nome_exibicao, avatar_url)),
      projeto_tag(tag:tag_id(id, nome, categoria)),
      documento(id, titulo, tipo, publico, ordem)
    `)
    .eq('id', id)
    .eq('status', 'publicado')
    .single()

  if (error || !data) return null

  const documentosPublicos = (data.documento as Array<{ id: string; titulo: string; tipo: string; publico: boolean; ordem: number }>)
    .filter((d) => d.publico)
    .sort((a, b) => a.ordem - b.ordem)

  return { ...data, documento: documentosPublicos }
}

export async function buscarCatalogo(filtros: { busca?: string; tagId?: string; pagina?: number }) {
  const supabase = await criarClienteServidor()
  const pagina = filtros.pagina || 1
  const de = (pagina - 1) * POR_PAGINA
  const ate = de + POR_PAGINA - 1

  let query = supabase
    .from('projeto')
    .select(`
      id, titulo, sinopse, capa_url, media_avaliacao, contagem_avaliacoes, contagem_visualizacoes, publicado_em,
      perfil:dono_id(nome_usuario, nome_exibicao, avatar_url),
      projeto_tag(tag:tag_id(id, nome, categoria))
    `, { count: 'exact' })
    .eq('status', 'publicado')
    .order('publicado_em', { ascending: false })
    .range(de, ate)

  if (filtros.busca) {
    query = query.ilike('titulo', `%${filtros.busca}%`)
  }

  if (filtros.tagId) {
    query = query.eq('projeto_tag.tag_id', filtros.tagId)
  }

  const { data, count, error } = await query

  if (error) return { projetos: [], total: 0, totalPaginas: 0 }

  // Se filtrando por tag, remover projetos que não tiveram match na tag
  let projetos = data || []
  if (filtros.tagId) {
    projetos = projetos.filter((p: { projeto_tag: unknown[] }) => p.projeto_tag.length > 0)
  }

  const total = count || 0
  return { projetos, total, totalPaginas: Math.ceil(total / POR_PAGINA) }
}

export async function buscarTagsDisponiveis() {
  const supabase = await criarClienteServidor()

  const { data, error } = await supabase
    .from('tag')
    .select('id, nome, categoria')
    .order('categoria')
    .order('nome')

  if (error) return {}

  const agrupadas: Record<string, Array<{ id: string; nome: string }>> = {}
  for (const tag of data || []) {
    const cat = tag.categoria || 'geral'
    if (!agrupadas[cat]) agrupadas[cat] = []
    agrupadas[cat].push({ id: tag.id, nome: tag.nome })
  }
  return agrupadas
}

export async function registrarVisualizacao(projetoId: string, usuarioId?: string) {
  const supabase = await criarClienteServidor()
  await supabase.rpc('incrementar_visualizacao', {
    p_projeto_id: projetoId,
    p_usuario_id: usuarioId || null,
  })
}

const CAMPOS_CARD = `id, titulo, sinopse, capa_url, media_avaliacao, contagem_avaliacoes, contagem_visualizacoes, publicado_em,
  perfil:dono_id(nome_usuario, nome_exibicao, avatar_url),
  projeto_tag(tag:tag_id(id, nome))`

export async function buscarPopularesSemana() {
  const supabase = await criarClienteServidor()
  const semanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: vis } = await supabase
    .from('projeto_visualizacao')
    .select('projeto_id')
    .gte('visualizado_em', semanaAtras)

  if (!vis || vis.length === 0) return []

  const contagem: Record<string, number> = {}
  for (const v of vis) {
    contagem[v.projeto_id] = (contagem[v.projeto_id] || 0) + 1
  }

  const topIds = Object.entries(contagem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  const { data } = await supabase
    .from('projeto')
    .select(CAMPOS_CARD)
    .in('id', topIds)
    .eq('status', 'publicado')

  return data || []
}

export async function buscarMaisAcessados() {
  const supabase = await criarClienteServidor()
  const { data } = await supabase
    .from('projeto')
    .select(CAMPOS_CARD)
    .eq('status', 'publicado')
    .order('contagem_visualizacoes', { ascending: false })
    .limit(10)

  return data || []
}

export async function buscarMelhorAvaliados() {
  const supabase = await criarClienteServidor()
  const { data } = await supabase
    .from('projeto')
    .select(CAMPOS_CARD)
    .eq('status', 'publicado')
    .gte('contagem_avaliacoes', 1)
    .order('media_avaliacao', { ascending: false })
    .limit(10)

  return data || []
}

export async function buscarNovidades() {
  const supabase = await criarClienteServidor()
  const { data } = await supabase
    .from('projeto')
    .select(CAMPOS_CARD)
    .eq('status', 'publicado')
    .not('publicado_em', 'is', null)
    .order('publicado_em', { ascending: false })
    .limit(10)

  return data || []
}
