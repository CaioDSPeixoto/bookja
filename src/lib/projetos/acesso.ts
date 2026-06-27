import { criarClienteServidor } from '@/lib/supabase/server'

type ClienteSupabase = Awaited<ReturnType<typeof criarClienteServidor>>

type UsuarioAutenticado = {
  id: string
}

type ProjetoAcesso = {
  id: string
  dono_id: string
  status?: string | null
}

type TipoAcessoProjeto = 'dono' | 'colaborador' | 'publico'

type ResultadoAcessoProjeto = {
  projeto: ProjetoAcesso
  tipo: TipoAcessoProjeto
  usuarioId: string | null
}

type OpcoesAcessoProjeto = {
  permitirPublicado?: boolean
}

export async function obterUsuarioAutenticado(supabase: ClienteSupabase): Promise<UsuarioAutenticado> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user
}

export async function obterUsuarioOpcional(supabase: ClienteSupabase): Promise<UsuarioAutenticado | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function buscarProjetoParaAcesso(
  supabase: ClienteSupabase,
  projetoId: string,
): Promise<ProjetoAcesso> {
  const { data: projeto } = await supabase
    .from('projeto')
    .select('id, dono_id, status')
    .eq('id', projetoId)
    .single()

  if (!projeto) throw new Error('Projeto não encontrado')
  return projeto
}

export async function verificarDonoProjeto(
  supabase: ClienteSupabase,
  projetoId: string,
  usuarioId: string,
): Promise<ProjetoAcesso> {
  const projeto = await buscarProjetoParaAcesso(supabase, projetoId)
  if (projeto.dono_id !== usuarioId) throw new Error('Sem permissão')
  return projeto
}

export async function verificarAcessoProjeto(
  supabase: ClienteSupabase,
  projetoId: string,
  usuarioId: string | null,
  opcoes: OpcoesAcessoProjeto = {},
): Promise<ResultadoAcessoProjeto> {
  const projeto = await buscarProjetoParaAcesso(supabase, projetoId)

  if (opcoes.permitirPublicado && projeto.status === 'publicado') {
    return { projeto, tipo: 'publico', usuarioId }
  }

  if (!usuarioId) throw new Error('Não autenticado')

  if (projeto.dono_id === usuarioId) {
    return { projeto, tipo: 'dono', usuarioId }
  }

  const { data: colaborador } = await supabase
    .from('projeto_colaborador')
    .select('usuario_id')
    .eq('projeto_id', projetoId)
    .eq('usuario_id', usuarioId)
    .not('aceito_em', 'is', null)
    .single()

  if (!colaborador) throw new Error('Sem permissão')
  return { projeto, tipo: 'colaborador', usuarioId }
}
