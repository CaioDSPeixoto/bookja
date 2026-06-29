'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { obterMeuPerfil, atualizarPerfil } from '@/lib/perfil/actions'

export default function ConfiguracoesPage() {
  const t = useTranslations('perfil')
  const tGeral = useTranslations('geral')
  const [nomeExibicao, setNomeExibicao] = useState('')
  const [bio, setBio] = useState('')
  const [chavePix, setChavePix] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    obterMeuPerfil().then((data) => {
      setNomeExibicao(data.nome_exibicao || '')
      setBio(data.bio || '')
      setChavePix(data.chave_pix || '')
      setDataNascimento(data.data_nascimento || '')
    })
  }, [])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setSalvo(false)
    setErro('')
    try {
      await atualizarPerfil({ nome_exibicao: nomeExibicao, bio, chave_pix: chavePix, data_nascimento: dataNascimento || null })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 3000)
    } catch (err) {
      setErro(err instanceof Error ? err.message : tGeral('erro'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('editarPerfil')}</h1>
      <form onSubmit={handleSalvar} className="space-y-4">
        <div>
          <label htmlFor="nome-exibicao" className="block text-sm font-medium text-gray-700">{t('nomeExibicao')}</label>
          <input
            id="nome-exibicao"
            value={nomeExibicao}
            onChange={(e) => setNomeExibicao(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">{t('bio')}</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div>
          <label htmlFor="data-nascimento" className="block text-sm font-medium text-gray-700">{t('dataNascimento')}</label>
          <input
            id="data-nascimento"
            type="date"
            value={dataNascimento}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDataNascimento(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <p className="mt-1 text-xs text-gray-500">{t('dataNascimentoAjuda')}</p>
        </div>
        <div>
          <label htmlFor="chave-pix" className="block text-sm font-medium text-gray-700">{t('chavePix')}</label>
          <input
            id="chave-pix"
            value={chavePix}
            onChange={(e) => setChavePix(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={salvando}
            className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {salvando ? tGeral('carregando') : t('salvarPerfil')}
          </button>
          {salvo && <span className="text-sm text-green-600">{t('perfilSalvo')}</span>}
        </div>
      </form>
    </div>
  )
}
