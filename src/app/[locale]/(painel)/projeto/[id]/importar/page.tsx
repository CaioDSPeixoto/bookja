'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { Upload, FileText, Check, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { MAX_CAPITULOS_IMPORTACAO, TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO } from '@/lib/importacao/limites'

interface CapituloPreview {
  titulo: string
  conteudo: unknown
  selecionado: boolean
}

export default function ImportarPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('importacao')
  const tGeral = useTranslations('geral')
  const locale = useLocale()
  const [projetoId, setProjetoId] = useState('')
  const [etapa, setEtapa] = useState<'upload' | 'preview' | 'importando' | 'sucesso'>('upload')
  const [capitulos, setCapitulos] = useState<CapituloPreview[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [nomeArquivo, setNomeArquivo] = useState('')

  useEffect(() => {
    params.then(({ id }) => setProjetoId(id))
  }, [params])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    const nome = arquivo.name.toLowerCase()
    if (!nome.endsWith('.epub') && !nome.endsWith('.docx')) {
      setErro(t('formatoInvalido'))
      return
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO) {
      setErro('Arquivo excede o limite de 5MB')
      return
    }

    setErro('')
    setCarregando(true)
    setNomeArquivo(arquivo.name)

    const formData = new FormData()
    formData.append('arquivo', arquivo)
    formData.append('projetoId', projetoId)

    try {
      const res = await fetch('/api/importar', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        setErro(json.erro || t('erroProcessar'))
        setCarregando(false)
        return
      }

      const capitulosProcessados = json.dados.capitulos.map((c: { titulo: string; conteudo: unknown }) => ({
        ...c,
        titulo: c.titulo?.trim() || 'Capítulo sem título',
        selecionado: true,
      }))

      if (capitulosProcessados.length > MAX_CAPITULOS_IMPORTACAO) {
        setErro(`O arquivo gerou ${capitulosProcessados.length} capítulos. Importe no máximo ${MAX_CAPITULOS_IMPORTACAO} por vez.`)
        return
      }

      setCapitulos(capitulosProcessados)
      setEtapa('preview')
    } catch {
      setErro(t('erroProcessar'))
    } finally {
      setCarregando(false)
    }
  }

  function toggleCapitulo(idx: number) {
    setCapitulos(prev => prev.map((c, i) => i === idx ? { ...c, selecionado: !c.selecionado } : c))
  }

  function editarTitulo(idx: number, titulo: string) {
    setCapitulos(prev => prev.map((c, i) => i === idx ? { ...c, titulo } : c))
  }

  async function handleConfirmar() {
    const selecionados = capitulos
      .filter(c => c.selecionado)
      .map((capitulo, indice) => ({
        ...capitulo,
        titulo: capitulo.titulo.trim() || `Capítulo ${indice + 1}`,
      }))
    if (selecionados.length === 0) return

    setEtapa('importando')

    try {
      const res = await fetch('/api/importar/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projetoId,
          capitulos: selecionados.map(c => ({ titulo: c.titulo, conteudo: c.conteudo })),
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        setErro(json.erro || t('erroImportar'))
        setEtapa('preview')
        return
      }

      setEtapa('sucesso')
    } catch {
      setErro(t('erroImportar'))
      setEtapa('preview')
    }
  }

  const selecionadosCount = capitulos.filter(c => c.selecionado).length
  const todosSelecionados = capitulos.length > 0 && selecionadosCount === capitulos.length

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/${locale}/projeto/${projetoId}/editar`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} />
        {tGeral('voltar')}
      </Link>

      <h1 className="mb-2 text-3xl font-bold text-gray-900">{t('titulo')}</h1>
      <p className="mb-8 text-gray-500">{t('descricao')}</p>
      <p className="mb-6 rounded-md border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
        Os capítulos importados entram como rascunho. Depois você revisa, solicita revisão supervisionada ou publica cada capítulo no editor. Limites: EPUB/DOCX até 5MB e até {MAX_CAPITULOS_IMPORTACAO} capítulos por importação.
      </p>

      {/* Etapa: Upload */}
      {etapa === 'upload' && (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/30">
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="mb-2 text-lg font-medium text-gray-700">{t('arrasteOuClique')}</p>
          <p className="mb-6 text-sm text-gray-400">{t('formatosAceitos')} · até 5MB</p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md">
            <Upload size={16} />
            {t('selecionarArquivo')}
            <input
              type="file"
              accept=".epub,.docx"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          {carregando && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              {t('processando')}
            </div>
          )}
        </div>
      )}

      {/* Etapa: Preview */}
      {etapa === 'preview' && (
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-100 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-gray-600">
              <FileText size={16} className="shrink-0" />
              <span className="truncate font-medium">{nomeArquivo}</span>
              <span className="shrink-0 text-gray-400">— {t('capitulosDetectados', { count: capitulos.length })}</span>
            </div>
            <button
              onClick={() => { setEtapa('upload'); setCapitulos([]); setNomeArquivo('') }}
              className="shrink-0 text-sm text-gray-500 hover:text-gray-700"
            >
              {t('trocarArquivo')}
            </button>
          </div>

          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-gray-500">
              {t('selecionados', { count: selecionadosCount, total: capitulos.length })}
            </span>
            <button
              onClick={() => setCapitulos(prev => prev.map(c => ({ ...c, selecionado: !todosSelecionados })))}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {todosSelecionados ? 'Desmarcar todos' : t('selecionarTodos')}
            </button>
          </div>

          <ul className="space-y-2">
            {capitulos.map((cap, idx) => (
              <li
                key={idx}
                className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${
                  cap.selecionado ? 'border-indigo-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleCapitulo(idx)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                    cap.selecionado
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {cap.selecionado && <Check size={12} />}
                </button>
                <div className="min-w-0 flex-1">
                  <input
                    value={cap.titulo}
                    onChange={(e) => editarTitulo(idx, e.target.value)}
                    maxLength={140}
                    className="w-full rounded border-0 bg-transparent px-2 py-1 text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                  />
                  {!cap.titulo.trim() && <span className="px-2 text-xs text-amber-600">Será importado como capítulo sem título</span>}
                </div>
                <span className="text-xs text-gray-400">#{idx + 1}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => { setEtapa('upload'); setCapitulos([]) }}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {tGeral('cancelar')}
            </button>
            <button
              onClick={handleConfirmar}
              disabled={selecionadosCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              <Check size={16} />
              Importar {selecionadosCount} capítulo{selecionadosCount === 1 ? '' : 's'} selecionado{selecionadosCount === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}

      {/* Etapa: Importando */}
      {etapa === 'importando' && (
        <div className="flex flex-col items-center py-16">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-gray-600">{t('importando')}</p>
        </div>
      )}

      {/* Etapa: Sucesso */}
      {etapa === 'sucesso' && (
        <div className="flex flex-col items-center rounded-2xl border border-green-200 bg-green-50 py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check size={32} className="text-green-600" />
          </div>
          <p className="mb-2 text-lg font-semibold text-green-800">{t('sucesso')}</p>
          <p className="mb-6 text-sm text-green-600">
            {t('capitulosImportados', { count: selecionadosCount })}
          </p>
          <Link
            href={`/${locale}/projeto/${projetoId}/escrita`}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700"
          >
            {t('irParaEditor')}
          </Link>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <X size={16} />
          {erro}
        </div>
      )}
    </div>
  )
}
