'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function BotaoCopiarPix({ chavePix, label, labelCopiado }: { chavePix: string; label: string; labelCopiado: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(chavePix)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button onClick={copiar} className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">
      {copiado ? <Check size={14} /> : <Copy size={14} />}
      {copiado ? labelCopiado : label}
    </button>
  )
}
