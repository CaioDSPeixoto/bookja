'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, FileText, PenLine, Eye, Upload, Check, Tag, Users, Plus, Save, ChevronDown, ChevronRight, ImageIcon, X, Globe } from 'lucide-react'
import { obterProjeto, atualizarProjeto, excluirProjeto } from '@/lib/projetos/actions'
import { listarColaboradores } from '@/lib/colaboradores/actions'
import { criarClienteBrowser } from '@/lib/supabase/client'

const statusCores: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  revisao: 'bg-yellow-100 text-yellow-700',
  publicado: 'bg-green-100 text-green-700',
}

export default function EditarProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('projeto')
  const tGeral = useTranslations('geral')
  const locale = useLocale()
  const router = useRouter()
  const [projeto, setProjeto] = useState<{ titulo: string; sinopse?: string; status: string; documento?: { id: string; titulo?: string; tipo?: string }[] } | null>(null)
  const [titulo, setTitulo] = useState('')
  const [sinopse, setSinopse] = useState('')
  const [status, setStatus] = useState('rascunho')
  const [salvando, setSalvando] = useState(false)
  const [salvoFeedback, setSalvoFeedback] = useState(false)
  const [mostrarModalExcluir, setMostrarModalExcluir] = useState(false)
  const [mostrarModalPublicar, setMostrarModalPublicar] = useState(false)
  const [id, setId] = useState('')
  const [todasTags, setTodasTags] = useState<{ id: number; nome: string; categoria: string }[]>([])
  const [tagsSelecionadas, setTagsSelecionadas] = useState<number[]>([])
  const [temCoautores, setTemCoautores] = useState(false)
  const [abertos, setAbertos] = useState({ sinopse: true, tags: true, capitulos: true, colaboradores: false })
  const [capaUrl, setCapaUrl] = useState<string | null>(null)
  const [uploadingCapa, setUploadingCapa] = useState(false)

  function toggle(key: keyof typeof abertos) { setAbertos(p => ({ ...p, [key]: !p[key] })) }

  useEffect(() => {
    params.then(({ id }) => {
      setId(id)
      obterProjeto(id).then((data) => {
        setProjeto(data)
        setTitulo(data.titulo)
        setSinopse(data.sinopse || '')
        setStatus(data.status)
        setCapaUrl(data.capa_url || null)
      })
      listarColaboradores(id).then((cols) => {
        setTemCoautores(cols.length > 0)
      })
      const supabase = criarClienteBrowser()
      supabase.from('tag').select('*').order('categoria').then(({ data }) => {
        setTodasTags(data || [])
      })
      supabase.from('projeto_tag').select('tag_id').eq('projeto_id', id).then(({ data }) => {
        setTagsSelecionadas((data || []).map(t => t.tag_id))
      })
    })
  }, [params])

  async function toggleTag(tagId: number) {
    const supabase = criarClienteBrowser()
    if (tagsSelecionadas.includes(tagId)) {
      await supabase.from('projeto_tag').delete().eq('projeto_id', id).eq('tag_id', tagId)
      setTagsSelecionadas(prev => prev.filter(t => t !== tagId))
    } else {
      await supabase.from('projeto_tag').insert({ projeto_id: id, tag_id: tagId })
      setTagsSelecionadas(prev => [...prev, tagId])
    }
  }

  async function handleSalvar() {
    setSalvando(true)
    await atualizarProjeto(id, { titulo, sinopse: sinopse || null, status })
    setSalvando(false)
    setSalvoFeedback(true)
    setTimeout(() => setSalvoFeedback(false), 2000)
  }

  async function handleExcluir() {
    await excluirProjeto(id, locale)
    router.push(`/${locale}/biblioteca`)
  }

  async function handlePublicar() {
    setStatus('publicado')
    await atualizarProjeto(id, { titulo, sinopse: sinopse || null, status: 'publicado' })
    setMostrarModalPublicar(false)
    setSalvoFeedback(true)
    setTimeout(() => setSalvoFeedback(false), 2000)
  }

  async function handleDespublicar() {
    setStatus('rascunho')
    await atualizarProjeto(id, { titulo, sinopse: sinopse || null, status: 'rascunho' })
    setSalvoFeedback(true)
    setTimeout(() => setSalvoFeedback(false), 2000)
  }

  async function handleUploadCapa(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return
    setUploadingCapa(true)
    try {
      const dataUrl = await redimensionarImagem(file, 400, 600)
      await atualizarProjeto(id, { capa_url: dataUrl })
      setCapaUrl(dataUrl)
    } finally {
      setUploadingCapa(false)
    }
  }

  function redimensionarImagem(file: File, maxW: number, maxH: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  async function handleRemoverCapa() {
    await atualizarProjeto(id, { capa_url: null })
    setCapaUrl(null)
  }

  const temCapitulos = (projeto?.documento?.length || 0) > 0
  const podePublicar = titulo.length > 0 && temCapitulos

  if (!projeto) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-4">
      {/* Toolbar fixa */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex items-center gap-2 border-b bg-white/95 px-4 py-3 backdrop-blur">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="mr-auto min-w-0 flex-1 truncate border-none bg-transparent text-lg font-bold text-gray-900 focus:outline-none focus:ring-0"
          required
        />
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusCores[status]}`}>
          {t(status)}
        </span>
        {status !== 'publicado' ? (
          <button onClick={() => setMostrarModalPublicar(true)} type="button" className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
            <Globe size={14} /> Publicar
          </button>
        ) : (
          <button onClick={handleDespublicar} type="button" className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            Despublicar
          </button>
        )}
        <button onClick={handleSalvar} disabled={salvando} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {salvoFeedback ? <><Check size={14} /> Salvo</> : <><Save size={14} /> {tGeral('salvar')}</>}
        </button>
        <Link href={`/${locale}/projeto/${id}/escrita`} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          <PenLine size={14} /> Escrever
        </Link>
        <Link href={`/${locale}/projeto/${id}/previa`} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          <Eye size={14} />
        </Link>
        <button onClick={() => setMostrarModalExcluir(true)} type="button" className="rounded-md p-1.5 text-red-500 hover:bg-red-50">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Capa */}
        <section className="rounded-lg border p-4">
          <span className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <ImageIcon size={12} /> Capa
          </span>
          {capaUrl ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capaUrl} alt="Capa" className="h-[280px] w-[200px] rounded-md object-cover" />
              <button type="button" onClick={handleRemoverCapa} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600">
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
              <Upload size={14} />
              {uploadingCapa ? 'Enviando...' : 'Enviar capa'}
              <input type="file" accept="image/*" onChange={handleUploadCapa} className="hidden" disabled={uploadingCapa} />
            </label>
          )}
        </section>

        {/* Sinopse */}
        <section className="rounded-lg border p-4">
          <button type="button" onClick={() => toggle('sinopse')} className="mb-1 flex w-full items-center gap-1 text-xs font-medium text-gray-500">
            {abertos.sinopse ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {t('sinopse')}
          </button>
          {abertos.sinopse && (
            <textarea
              value={sinopse}
              onChange={(e) => setSinopse(e.target.value)}
              rows={3}
              className="w-full resize-none border-none bg-transparent text-sm text-gray-800 focus:outline-none focus:ring-0"
              placeholder="Sinopse do projeto..."
            />
          )}
        </section>

        {/* Tags */}
        <section className="rounded-lg border p-4">
          <button type="button" onClick={() => toggle('tags')} className="mb-2 flex w-full items-center gap-1.5 text-xs font-medium text-gray-500">
            {abertos.tags ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Tag size={12} /> {t('tags')}
          </button>
          {abertos.tags && (
            todasTags.length > 0 ? (
              <div className="space-y-2">
                {Array.from(new Set(todasTags.map(t => t.categoria))).map(cat => (
                  <div key={cat}>
                    <span className="text-[10px] font-medium uppercase text-gray-400">{cat.replace('_', ' ')}</span>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {todasTags.filter(t => t.categoria === cat).map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                            tagsSelecionadas.includes(tag.id)
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {tag.nome}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Carregando...</p>
            )
          )}
        </section>

        {/* Capítulos */}
        <section className="rounded-lg border p-4">
          <button type="button" onClick={() => toggle('capitulos')} className="mb-2 flex w-full items-center gap-1.5 text-xs font-medium text-gray-500">
            {abertos.capitulos ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <FileText size={12} /> Capítulos
          </button>
          {abertos.capitulos && (
            <>
              {projeto.documento && projeto.documento.length > 0 ? (
                <ul className="divide-y">
                  {projeto.documento.map((doc) => (
                    <li key={doc.id}>
                      <Link
                        href={`/${locale}/projeto/${id}/escrita?doc=${doc.id}`}
                        className="flex items-center gap-2 py-2 text-sm text-gray-700 hover:text-indigo-600"
                      >
                        <FileText size={14} className="text-gray-400" />
                        <span className="flex-1">{doc.titulo || 'Sem título'}</span>
                        {doc.tipo && <span className="text-[10px] text-gray-400">{doc.tipo}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">{tGeral('semResultados')}</p>
              )}
              <Link href={`/${locale}/projeto/${id}/importar`} className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700">
                <Upload size={14} /> Importar
              </Link>
            </>
          )}
        </section>

        {/* Colaboradores */}
        <section className="rounded-lg border p-4">
          <button type="button" onClick={() => toggle('colaboradores')} className="mb-2 flex w-full items-center gap-1.5 text-xs font-medium text-gray-500">
            {abertos.colaboradores ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Users size={12} /> Colaboradores
          </button>
          {abertos.colaboradores && (
            <Link
              href={`/${locale}/projeto/${id}/colaboradores`}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
            >
              <Plus size={12} /> Gerenciar
            </Link>
          )}
        </section>
      </div>

      {/* Modal de publicação */}
      {mostrarModalPublicar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setMostrarModalPublicar(false)}>
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Publicar história</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                {titulo.length > 0 ? <span className="text-green-600">✅</span> : <span className="text-red-500">❌</span>}
                Título definido
              </li>
              <li className="flex items-center gap-2">
                {sinopse.length > 0 ? <span className="text-green-600">✅</span> : <span className="text-yellow-500">⚠️</span>}
                Sinopse preenchida
              </li>
              <li className="flex items-center gap-2">
                {capaUrl ? <span className="text-green-600">✅</span> : <span className="text-yellow-500">⚠️</span>}
                Capa adicionada
              </li>
              <li className="flex items-center gap-2">
                {temCapitulos ? <span className="text-green-600">✅</span> : <span className="text-red-500">❌</span>}
                Pelo menos 1 capítulo
              </li>
            </ul>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarModalPublicar(false)} className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Voltar e ajustar
              </button>
              <button type="button" onClick={handlePublicar} disabled={!podePublicar} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
                Publicar agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de exclusão */}
      {mostrarModalExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setMostrarModalExcluir(false)}>
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Excluir projeto</h2>
            <p className="mb-4 text-sm text-gray-600">
              Tem certeza que deseja excluir &quot;{titulo}&quot;? Esta ação não pode ser desfeita.
            </p>
            {temCoautores && (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  Este projeto possui co-autores. A exclusão requer confirmação de um co-autor.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarModalExcluir(false)}
                className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluir}
                disabled={temCoautores}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
