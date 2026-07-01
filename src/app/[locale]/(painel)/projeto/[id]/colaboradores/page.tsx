'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  PencilLine,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  buscarUsuariosParaConvite,
  convidarColaborador,
  listarColaboradores,
  removerColaborador,
} from '@/lib/colaboradores/actions'

type PapelColaborador = 'coautor' | 'revisor'

type PerfilColaborador = {
  nome_usuario: string
  nome_exibicao: string | null
  avatar_url: string | null
}

type Colaborador = {
  usuario_id: string
  papel: PapelColaborador
  convidado_em: string
  aceito_em: string | null
  perfil: PerfilColaborador | PerfilColaborador[] | null
}

type PerfilBusca = PerfilColaborador & {
  id: string
}

const papeis: Array<{
  valor: PapelColaborador
  titulo: string
  descricao: string
  icone: typeof PencilLine
}> = [
  {
    valor: 'coautor',
    titulo: 'Coautor',
    descricao: 'Pode escrever, editar capítulos e participar do fluxo editorial depois de aceitar o convite.',
    icone: PencilLine,
  },
  {
    valor: 'revisor',
    titulo: 'Revisor',
    descricao: 'Ajuda na revisão supervisionada e aprova capítulos quando você pedir aprovação.',
    icone: ShieldCheck,
  },
]

function obterPerfil(colaborador: Colaborador): PerfilColaborador | null {
  return Array.isArray(colaborador.perfil) ? colaborador.perfil[0] ?? null : colaborador.perfil
}

function iniciais(perfil: PerfilColaborador | null) {
  const nome = perfil?.nome_exibicao || perfil?.nome_usuario || '?'
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

function formatarData(data: string | null) {
  if (!data) return null
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function ColaboradoresPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('colaboradores')
  const tGeral = useTranslations('geral')
  const locale = useLocale()
  const [projetoId, setProjetoId] = useState('')
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [papel, setPapel] = useState<PapelColaborador>('coautor')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [resultadoBusca, setResultadoBusca] = useState<PerfilBusca[]>([])
  const [buscando, setBuscando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [removendoId, setRemovendoId] = useState<string | null>(null)
  const [confirmarRemocaoId, setConfirmarRemocaoId] = useState<string | null>(null)

  const resumo = useMemo(() => {
    const aceitos = colaboradores.filter((colaborador) => colaborador.aceito_em).length
    return {
      total: colaboradores.length,
      aceitos,
      pendentes: colaboradores.length - aceitos,
    }
  }, [colaboradores])

  const carregar = useCallback(async (id: string) => {
    setCarregando(true)
    try {
      const dados = await listarColaboradores(id)
      setColaboradores(dados as Colaborador[])
    } catch (error) {
      setErro(error instanceof Error ? error.message : tGeral('erro'))
    } finally {
      setCarregando(false)
    }
  }, [tGeral])

  useEffect(() => {
    params.then(({ id }) => {
      setProjetoId(id)
      carregar(id)
    })
  }, [params, carregar])

  async function handleConvidar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setEnviando(true)
    try {
      const nomeNormalizado = nomeUsuario.trim().replace(/^@+/, '')
      const novo = await convidarColaborador(projetoId, nomeNormalizado, papel)
      setColaboradores((atuais) => [novo as Colaborador, ...atuais])
      setSucesso(`Convite enviado para @${nomeNormalizado}. A pessoa só acessa o projeto depois de aceitar.`)
      setNomeUsuario('')
      setResultadoBusca([])
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : tGeral('erro'))
    } finally {
      setEnviando(false)
    }
  }

  async function handleBuscarUsuarios() {
    setErro('')
    setSucesso('')
    setBuscando(true)
    try {
      const resultado = await buscarUsuariosParaConvite(projetoId, nomeUsuario)
      setResultadoBusca(resultado as PerfilBusca[])
      if (resultado.length === 0) {
        setSucesso('Nenhum usuário disponível encontrado para essa busca.')
      }
    } catch (err: unknown) {
      setResultadoBusca([])
      setErro(err instanceof Error ? err.message : tGeral('erro'))
    } finally {
      setBuscando(false)
    }
  }

  function selecionarUsuario(perfil: PerfilBusca) {
    setNomeUsuario(perfil.nome_usuario)
    setResultadoBusca([])
    setSucesso(`Selecionado @${perfil.nome_usuario}. Escolha o papel e envie o convite.`)
  }

  async function handleRemover(usuarioId: string) {
    if (confirmarRemocaoId !== usuarioId) {
      setConfirmarRemocaoId(usuarioId)
      return
    }

    setErro('')
    setSucesso('')
    setRemovendoId(usuarioId)
    try {
      await removerColaborador(projetoId, usuarioId)
      setColaboradores((atuais) => atuais.filter((colaborador) => colaborador.usuario_id !== usuarioId))
      setConfirmarRemocaoId(null)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : tGeral('erro'))
    } finally {
      setRemovendoId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <div className="mb-5">
        <Link
          href={`/${locale}/projeto/${projetoId}/editar`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          Voltar para o projeto
        </Link>
      </div>

      <header className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">{t('titulo')}</h1>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Convide pessoas pelo nome de usuário. Convites ficam pendentes até a pessoa aceitar; antes disso ela não consegue acessar nem editar o projeto.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:max-w-md">
          <div className="rounded-lg bg-white px-2 py-2">
            <strong className="block text-base text-gray-900">{resumo.total}</strong>
            <span className="text-gray-500">total</span>
          </div>
          <div className="rounded-lg bg-white px-2 py-2">
            <strong className="block text-base text-green-700">{resumo.aceitos}</strong>
            <span className="text-gray-500">aceitos</span>
          </div>
          <div className="rounded-lg bg-white px-2 py-2">
            <strong className="block text-base text-amber-700">{resumo.pendentes}</strong>
            <span className="text-gray-500">pendentes</span>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Novo convite</h2>
          <form onSubmit={handleConvidar} className="mt-4 space-y-4">
            <div>
              <label htmlFor="nome-usuario-colab" className="block text-sm font-medium text-gray-800">
                {t('nomeUsuario')}
              </label>
              <div className="mt-1 flex rounded-lg border border-gray-300 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                <span className="flex items-center border-r border-gray-200 px-3 text-sm text-gray-400">@</span>
                <input
                  id="nome-usuario-colab"
                  value={nomeUsuario}
                  onChange={(e) => {
                    setNomeUsuario(e.target.value)
                    setResultadoBusca([])
                  }}
                  required
                  autoComplete="off"
                  placeholder="nome, usuário ou @usuario"
                  className="min-w-0 flex-1 rounded-r-lg px-3 py-2.5 text-sm outline-none"
                />
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                  Busque por nome ou usuário, selecione a pessoa certa e envie o convite.
                </p>
                <button
                  type="button"
                  onClick={handleBuscarUsuarios}
                  disabled={buscando || nomeUsuario.trim().length < 2}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {buscando ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                  Buscar
                </button>
              </div>
              {resultadoBusca.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                  {resultadoBusca.map((perfil) => (
                    <button
                      key={perfil.id}
                      type="button"
                      onClick={() => selecionarUsuario(perfil)}
                      className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-indigo-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                        {iniciais(perfil)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {perfil.nome_exibicao || perfil.nome_usuario}
                        </span>
                        <span className="block truncate text-xs text-gray-500">@{perfil.nome_usuario}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-gray-800">{t('papel')}</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {papeis.map((opcao) => {
                  const Icone = opcao.icone
                  const ativo = papel === opcao.valor
                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => setPapel(opcao.valor)}
                      className={`rounded-xl border p-3 text-left transition ${
                        ativo
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <Icone size={16} />
                        {opcao.titulo}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-gray-600">{opcao.descricao}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
            {sucesso && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{sucesso}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {enviando ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {enviando ? 'Enviando convite' : t('convidar')}
            </button>
          </form>
        </section>

        <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Como funciona</h2>
          <ol className="mt-3 space-y-3 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">1</span>
              Você envia o convite pelo nome de usuário.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">2</span>
              A pessoa recebe uma notificação e precisa aceitar.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">3</span>
              Depois do aceite, ela entra no projeto conforme o papel escolhido.
            </li>
          </ol>
        </aside>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Equipe do projeto</h2>
        </div>

        {carregando ? (
          <div className="flex justify-center rounded-xl border border-gray-200 bg-white py-10">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          </div>
        ) : colaboradores.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center">
            <Users className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-700">{t('semColaboradores')}</p>
            <p className="mt-1 text-xs text-gray-500">Convide alguém quando quiser escrever ou revisar em conjunto.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {colaboradores.map((colaborador) => {
              const perfil = obterPerfil(colaborador)
              const aceito = Boolean(colaborador.aceito_em)
              const removendoEste = removendoId === colaborador.usuario_id
              const confirmar = confirmarRemocaoId === colaborador.usuario_id
              return (
                <li key={colaborador.usuario_id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                      {iniciais(perfil)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-gray-900">
                          {perfil?.nome_exibicao || perfil?.nome_usuario || 'Usuário'}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          {colaborador.papel === 'coautor' ? 'Coautor' : 'Revisor'}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          aceito ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                        }`}
                        >
                          {aceito ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                          {aceito ? t('aceito') : t('pendente')}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        @{perfil?.nome_usuario || colaborador.usuario_id}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {aceito
                          ? `Aceito em ${formatarData(colaborador.aceito_em)}`
                          : `Convidado em ${formatarData(colaborador.convidado_em)}. Ainda sem acesso ao projeto.`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemover(colaborador.usuario_id)}
                      disabled={removendoEste}
                      className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium ${
                        confirmar
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'text-red-600 hover:bg-red-50'
                      } disabled:opacity-60`}
                      aria-label={t('remover')}
                    >
                      {removendoEste ? <Loader2 size={14} className="animate-spin" /> : confirmar ? 'Confirmar' : <Trash2 size={15} />}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
