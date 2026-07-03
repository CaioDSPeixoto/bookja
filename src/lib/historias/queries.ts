import { criarClienteServidor } from '@/lib/supabase/server'

const POR_PAGINA = 12

// Mapeia tags de classificação etária para idade mínima
const CLASSIFICACAO_IDADE: Record<string, number> = {
  'Livre': 0,
  '+12': 12,
  '+16': 16,
  '+18': 18,
}

async function obterIdadeUsuario(): Promise<number | null> {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase
    .from('perfil_privado')
    .select('data_nascimento')
    .eq('id', user.id)
    .maybeSingle()

  if (!perfil?.data_nascimento) return null

  const nascimento = new Date(perfil.data_nascimento)
  const hoje = new Date()
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const m = hoje.getMonth() - nascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--
  return idade
}

type TagClassificacao = {
  nome: string
  categoria: string | null
}

type ProjetoComTags = {
  projeto_tag?: Array<{ tag: TagClassificacao | null }>
}

function obterIdadeMinima(tags: TagClassificacao[]): number {
  const classificacao = tags.find((tag) => tag.categoria === 'publico_alvo')
  if (!classificacao) return 0
  return CLASSIFICACAO_IDADE[classificacao.nome] ?? 0
}

export function permitePorIdade(tags: TagClassificacao[], idadeUsuario: number | null): boolean {
  const idadeMinima = obterIdadeMinima(tags)
  if (idadeMinima === 0) return true
  if (idadeUsuario === null) return false
  return idadeUsuario >= idadeMinima
}

function filtrarPorIdade<T extends ProjetoComTags>(projetos: T[], idadeUsuario: number | null): T[] {
  return projetos.filter(p => {
    const tags = (p.projeto_tag || [])
      .map((pt) => pt.tag)
      .filter((tag): tag is TagClassificacao => Boolean(tag))
    return permitePorIdade(tags, idadeUsuario)
  })
}

/**
 * Anexa o percentual de progresso de leitura a cada projeto, quando houver
 * usuário logado com leitura registrada. Usa duas consultas (leitura + capítulos
 * publicados) apenas para os projetos exibidos — projetos sem leitura ficam sem o
 * campo (a barra não é exibida).
 */
async function anexarProgressoLeitura<T extends { id: string }>(
  projetos: T[],
): Promise<Array<T & { progresso_percentual?: number }>> {
  if (projetos.length === 0) return projetos

  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return projetos

  const ids = projetos.map((p) => p.id)
  const { data: leituras } = await supabase
    .from('leitura_atual')
    .select('projeto_id, ultimo_documento_id')
    .eq('usuario_id', user.id)
    .in('projeto_id', ids)

  if (!leituras || leituras.length === 0) return projetos

  const idsComLeitura = leituras
    .filter((l) => l.ultimo_documento_id)
    .map((l) => l.projeto_id)
  if (idsComLeitura.length === 0) return projetos

  const { data: docs } = await supabase
    .from('documento')
    .select('id, projeto_id, ordem')
    .in('projeto_id', idsComLeitura)
    .eq('publico', true)
    .eq('status', 'publicado')

  const capitulosPorProjeto = new Map<string, Array<{ id: string; ordem: number }>>()
  for (const d of docs || []) {
    const lista = capitulosPorProjeto.get(d.projeto_id) ?? []
    lista.push({ id: d.id, ordem: d.ordem })
    capitulosPorProjeto.set(d.projeto_id, lista)
  }

  const percentualPorProjeto = new Map<string, number>()
  for (const leitura of leituras) {
    const capitulos = (capitulosPorProjeto.get(leitura.projeto_id) ?? [])
      .sort((a, b) => a.ordem - b.ordem)
    if (capitulos.length === 0 || !leitura.ultimo_documento_id) continue
    const indice = capitulos.findIndex((c) => c.id === leitura.ultimo_documento_id)
    if (indice < 0) continue
    percentualPorProjeto.set(
      leitura.projeto_id,
      Math.round(((indice + 1) / capitulos.length) * 100),
    )
  }

  return projetos.map((p) => {
    const percentual = percentualPorProjeto.get(p.id)
    return percentual != null ? { ...p, progresso_percentual: percentual } : p
  })
}

export async function buscarHistoriaPublica(id: string) {
  const supabase = await criarClienteServidor()
  const idadeUsuario = await obterIdadeUsuario()

  const { data, error } = await supabase
    .from('projeto')
    .select(`
      *,
      perfil:dono_id(nome_usuario, nome_exibicao, avatar_url, chave_pix),
      projeto_colaborador(usuario_id, papel, aceito_em, perfil:usuario_id(nome_usuario, nome_exibicao, avatar_url)),
      projeto_tag(tag:tag_id(id, nome, categoria)),
      documento(id, titulo, tipo, publico, status, ordem, publicado_em)
    `)
    .eq('id', id)
    .eq('status', 'publicado')
    .single()

  if (error || !data) return null

  // Verificar classificação etária
  const tags = ((data.projeto_tag || []) as Array<{ tag: TagClassificacao }>).map(pt => pt.tag)
  if (!permitePorIdade(tags, idadeUsuario)) return null

  const documentosPublicos = (data.documento as Array<{
    id: string
    titulo: string
    tipo: string
    publico: boolean
    status?: string
    ordem: number
    publicado_em: string | null
  }>)
    .filter((d) => d.publico && (d.status ?? 'publicado') === 'publicado')
    .sort((a, b) => a.ordem - b.ordem)

  return { ...data, documento: documentosPublicos }
}

export async function buscarCatalogo(filtros: { busca?: string; tagId?: string; pagina?: number }) {
  const supabase = await criarClienteServidor()
  const idadeUsuario = await obterIdadeUsuario()
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
    // Remove caracteres que quebram a sintaxe do filtro `or` do PostgREST.
    const termo = filtros.busca.trim().replace(/[,()]/g, ' ').slice(0, 80)
    if (termo) {
      // Também casa pelo nome do autor: busca os perfis correspondentes e inclui
      // seus projetos no resultado (título, sinopse ou autor).
      const { data: autores } = await supabase
        .from('perfil')
        .select('id')
        .or(`nome_exibicao.ilike.%${termo}%,nome_usuario.ilike.%${termo}%`)

      const condicoes = [`titulo.ilike.%${termo}%`, `sinopse.ilike.%${termo}%`]
      const idsAutores = (autores || []).map((a) => a.id)
      if (idsAutores.length > 0) {
        condicoes.push(`dono_id.in.(${idsAutores.join(',')})`)
      }
      query = query.or(condicoes.join(','))
    }
  }

  if (filtros.tagId) {
    query = query.eq('projeto_tag.tag_id', Number(filtros.tagId))
  }

  const { data, count, error } = await query

  if (error) return { projetos: [], total: 0, totalPaginas: 0 }

  // Se filtrando por tag, remover projetos que não tiveram match na tag
  let projetos = data || []
  if (filtros.tagId) {
    projetos = projetos.filter((p: { projeto_tag: unknown[] }) => p.projeto_tag.length > 0)
  }

  // Filtrar por classificação etária
  projetos = filtrarPorIdade(projetos, idadeUsuario)

  // Anexa progresso de leitura para a barra nos cards (usuário logado).
  const projetosComProgresso = await anexarProgressoLeitura(projetos)

  const total = count || 0
  return { projetos: projetosComProgresso, total, totalPaginas: Math.ceil(total / POR_PAGINA) }
}

export async function buscarFavoritos() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const idadeUsuario = await obterIdadeUsuario()

  const { data } = await supabase
    .from('favorito')
    .select(`
      projeto:projeto(
        id, titulo, sinopse, capa_url, media_avaliacao, status, publicado_em,
        perfil:dono_id(nome_usuario, nome_exibicao, avatar_url),
        projeto_tag(tag:tag_id(id, nome, categoria))
      )
    `)
    .eq('usuario_id', user.id)

  // Só favoritos cujo projeto ainda está publicado (evita cards quebrados/404).
  const projetos = (data || [])
    .map((f) => (Array.isArray(f.projeto) ? f.projeto[0] : f.projeto))
    .filter((p): p is NonNullable<typeof p> => !!p && p.status === 'publicado')

  const permitidos = filtrarPorIdade(projetos, idadeUsuario)
  return anexarProgressoLeitura(permitidos)
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
    agrupadas[cat].push({ id: String(tag.id), nome: tag.nome })
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
  projeto_tag(tag:tag_id(id, nome, categoria))`

export async function buscarPopularesSemana() {
  const supabase = await criarClienteServidor()
  const idadeUsuario = await obterIdadeUsuario()
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

  return filtrarPorIdade(data || [], idadeUsuario).slice(0, 10)
}

export async function buscarMaisAcessados() {
  const supabase = await criarClienteServidor()
  const idadeUsuario = await obterIdadeUsuario()
  const { data } = await supabase
    .from('projeto')
    .select(CAMPOS_CARD)
    .eq('status', 'publicado')
    .order('contagem_visualizacoes', { ascending: false })
    .limit(20)

  return filtrarPorIdade(data || [], idadeUsuario).slice(0, 10)
}

export async function buscarMelhorAvaliados() {
  const supabase = await criarClienteServidor()
  const idadeUsuario = await obterIdadeUsuario()
  const { data } = await supabase
    .from('projeto')
    .select(CAMPOS_CARD)
    .eq('status', 'publicado')
    .gte('contagem_avaliacoes', 1)
    .order('media_avaliacao', { ascending: false })
    .limit(20)

  return filtrarPorIdade(data || [], idadeUsuario).slice(0, 10)
}

export async function buscarNovidades() {
  const supabase = await criarClienteServidor()
  const idadeUsuario = await obterIdadeUsuario()
  const { data } = await supabase
    .from('projeto')
    .select(CAMPOS_CARD)
    .eq('status', 'publicado')
    .not('publicado_em', 'is', null)
    .order('publicado_em', { ascending: false })
    .limit(20)

  return filtrarPorIdade(data || [], idadeUsuario).slice(0, 10)
}
