'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { UserPlus, Trash2 } from 'lucide-react'
import { convidarColaborador, removerColaborador, listarColaboradores } from '@/lib/colaboradores/actions'

type Colaborador = {
  usuario_id: string
  papel: string
  convidado_em: string
  aceito_em: string | null
  perfil: { nome_usuario: string; nome_exibicao: string | null; avatar_url: string | null } | { nome_usuario: string; nome_exibicao: string | null; avatar_url: string | null }[] | null
}

export default function ColaboradoresPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('colaboradores')
  const tGeral = useTranslations('geral')
  const [projetoId, setProjetoId] = useState('')
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [papel, setPapel] = useState('coautor')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    params.then(({ id }) => {
      setProjetoId(id)
      carregar(id)
    })
  }, [params])

  async function carregar(id: string) {
    const dados = await listarColaboradores(id)
    setColaboradores(dados as Colaborador[])
  }

  async function handleConvidar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    try {
      await convidarColaborador(projetoId, nomeUsuario, papel)
      setSucesso(t('conviteEnviado'))
      setNomeUsuario('')
      await carregar(projetoId)
    } catch (err: unknown) {
      setErro(err instanceof Error && err.message === 'Usuário não encontrado' ? t('usuarioNaoEncontrado') : tGeral('erro'))
    }
  }

  async function handleRemover(usuarioId: string) {
    await removerColaborador(projetoId, usuarioId)
    await carregar(projetoId)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('titulo')}</h1>

      <form onSubmit={handleConvidar} className="mb-8 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="nome-usuario-colab" className="block text-sm font-medium text-gray-700">{t('nomeUsuario')}</label>
          <input
            id="nome-usuario-colab"
            value={nomeUsuario}
            onChange={(e) => setNomeUsuario(e.target.value)}
            required
            className="mt-1 rounded border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div>
          <label htmlFor="papel-colab" className="block text-sm font-medium text-gray-700">{t('papel')}</label>
          <select
            id="papel-colab"
            value={papel}
            onChange={(e) => setPapel(e.target.value)}
            className="mt-1 rounded border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="coautor">{t('coautor')}</option>
            <option value="revisor">{t('revisor')}</option>
          </select>
        </div>
        <button type="submit" className="inline-flex items-center gap-1 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
          <UserPlus size={16} />
          {t('convidar')}
        </button>
      </form>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}
      {sucesso && <p className="mb-4 text-sm text-green-600">{sucesso}</p>}

      {colaboradores.length === 0 ? (
        <p className="text-gray-500">{t('semColaboradores')}</p>
      ) : (
        <ul className="space-y-2">
          {colaboradores.map((c) => {
            const perfil = Array.isArray(c.perfil) ? c.perfil[0] : c.perfil
            return (
            <li key={c.usuario_id} className="flex items-center justify-between rounded border border-gray-200 p-3">
              <div>
                <span className="font-medium">{perfil?.nome_exibicao || perfil?.nome_usuario}</span>
                <span className="ml-2 text-sm text-gray-500">({t(c.papel as 'coautor' | 'revisor')})</span>
                <span className={`ml-2 text-xs ${c.aceito_em ? 'text-green-600' : 'text-yellow-600'}`}>
                  {c.aceito_em ? t('aceito') : t('pendente')}
                </span>
              </div>
              <button onClick={() => handleRemover(c.usuario_id)} className="rounded p-1 text-red-600 hover:bg-red-50" aria-label={t('remover')}>
                <Trash2 size={16} />
              </button>
            </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
