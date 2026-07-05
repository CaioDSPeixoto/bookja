'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Check, Loader2 } from 'lucide-react'
import { listarDenunciasPendentes, resolverDenuncia } from '@/lib/denuncias/actions'

type Denuncia = {
  id: string
  tipo_alvo: string
  alvo_id: string
  motivo: string
  criado_em: string
  perfil: { nome_usuario: string; nome_exibicao: string | null } | null
}

const ROTULO_TIPO: Record<string, string> = {
  comentario: 'Comentário',
  mural: 'Mensagem de mural',
  projeto: 'História',
}

export default function PainelModeracao() {
  const locale = useLocale()
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [carregando, setCarregando] = useState(true)
  const [resolvendoId, setResolvendoId] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      setDenuncias((await listarDenunciasPendentes()) as Denuncia[])
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function handleResolver(id: string) {
    setResolvendoId(id)
    try {
      await resolverDenuncia(id)
      setDenuncias((atuais) => atuais.filter((d) => d.id !== id))
    } finally {
      setResolvendoId(null)
    }
  }

  function linkAlvo(d: Denuncia): string | null {
    if (d.tipo_alvo === 'projeto') return `/${locale}/historia/${d.alvo_id}`
    return null
  }

  if (carregando) {
    return <div className="flex justify-center py-12 text-gray-400"><Loader2 className="animate-spin" /></div>
  }

  if (denuncias.length === 0) {
    return <p className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500">Nenhuma denúncia pendente.</p>
  }

  return (
    <ul className="space-y-3">
      {denuncias.map((d) => {
        const autor = d.perfil?.nome_exibicao || d.perfil?.nome_usuario || 'Usuário'
        const href = linkAlvo(d)
        return (
          <li key={d.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {ROTULO_TIPO[d.tipo_alvo] ?? d.tipo_alvo}
                  </span>
                  <span className="text-xs text-gray-400">
                    por {autor} · {new Date(d.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700 break-words">{d.motivo}</p>
                {href && (
                  <Link href={href} className="mt-1 inline-block text-xs font-medium text-indigo-600 hover:underline">
                    Ver conteúdo
                  </Link>
                )}
              </div>
              <button
                onClick={() => handleResolver(d.id)}
                disabled={resolvendoId === d.id}
                className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {resolvendoId === d.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
                Resolver
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
