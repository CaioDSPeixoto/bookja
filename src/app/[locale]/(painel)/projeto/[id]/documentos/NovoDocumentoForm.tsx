'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { criarDocumento } from '@/lib/documentos/actions'

type TipoDocumento = 'capitulo' | 'ficha_personagem' | 'biblia' | 'nota' | 'outro'

export default function NovoDocumentoForm({ projetoId, locale }: { projetoId: string; locale: string }) {
  const t = useTranslations('documento')
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TipoDocumento>('capitulo')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const doc = await criarDocumento(projetoId, titulo, tipo)
    setAberto(false)
    setTitulo('')
    router.push(`/${locale}/projeto/${projetoId}/doc/${doc.id}`)
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        <Plus size={16} />
        {t('novoDocumento')}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder={t('titulo')}
        required
        className="rounded border px-3 py-2 text-sm"
      />
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoDocumento)}
        className="rounded border px-3 py-2 text-sm"
      >
        <option value="capitulo">{t('capitulo')}</option>
        <option value="ficha_personagem">{t('fichaPersonagem')}</option>
        <option value="biblia">{t('biblia')}</option>
        <option value="nota">{t('nota')}</option>
        <option value="outro">{t('outro')}</option>
      </select>
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
        {t('novoDocumento')}
      </button>
      <button type="button" onClick={() => setAberto(false)} className="rounded px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
        ✕
      </button>
    </form>
  )
}
