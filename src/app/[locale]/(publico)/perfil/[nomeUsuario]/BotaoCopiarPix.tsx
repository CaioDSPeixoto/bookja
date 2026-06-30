'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function BotaoCopiarPix({ chavePix }: { chavePix: string }) {
  const t = useTranslations('perfil')
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(chavePix)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <code className="rounded bg-gray-100 px-2 py-1 text-sm">{chavePix}</code>
      <button onClick={copiar} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-indigo-700" aria-label={t('copiarPix')}>
        {copiado ? <Check size={14} /> : <Copy size={14} />}
        {copiado ? t('pixCopiado') : t('copiarPix')}
      </button>
    </div>
  )
}
