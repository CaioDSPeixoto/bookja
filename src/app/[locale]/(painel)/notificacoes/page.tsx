'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, Mail, MessageSquare, Check } from 'lucide-react'
import { listarNotificacoes, marcarComoLida, marcarTodasComoLidas } from '@/lib/notificacoes/actions'
import { aceitarConvite } from '@/lib/colaboradores/actions'

type Notificacao = {
  id: string
  tipo: string
  projeto_id: string | null
  mensagem: string
  lida: boolean
  criado_em: string
}

function tempoRelativo(data: string) {
  const diff = Date.now() - new Date(data).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

function Icone({ tipo }: { tipo: string }) {
  switch (tipo) {
    case 'convite': return <Mail size={20} />
    case 'comentario': return <MessageSquare size={20} />
    default: return <Bell size={20} />
  }
}

export default function NotificacoesPage() {
  const t = useTranslations('notificacoes')
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [aceitos, setAceitos] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    listarNotificacoes().then(setNotificacoes)
  }, [])

  function handleMarcarTodas() {
    startTransition(async () => {
      await marcarTodasComoLidas()
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
    })
  }

  function handleAceitar(n: Notificacao) {
    startTransition(async () => {
      await aceitarConvite(n.projeto_id!)
      await marcarComoLida(n.id)
      setAceitos(prev => new Set(prev).add(n.id))
      setNotificacoes(prev => prev.map(x => x.id === n.id ? { ...x, lida: true } : x))
    })
  }

  if (!notificacoes.length) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">{t('titulo')}</h1>
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Bell size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">{t('vazio')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('titulo')}</h1>
        <button
          onClick={handleMarcarTodas}
          disabled={pending}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {t('marcarTodasLidas')}
        </button>
      </div>
      <div className="space-y-2">
        {notificacoes.map(n => (
          <div
            key={n.id}
            className={`flex items-center gap-3 rounded-lg border p-4 ${!n.lida ? 'border-blue-200 bg-blue-50' : ''}`}
          >
            <div className="shrink-0 text-gray-500"><Icone tipo={n.tipo} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {n.tipo === 'convite' && `${t('convite')} `}
                {n.tipo === 'comentario' && `${t('novoComentario')} `}
                <span className="font-medium">{n.mensagem}</span>
              </p>
              <span className="text-xs text-gray-400">{tempoRelativo(n.criado_em)}</span>
            </div>
            {n.tipo === 'convite' && n.projeto_id && !n.lida && !aceitos.has(n.id) && (
              <button
                onClick={() => handleAceitar(n)}
                disabled={pending}
                className="shrink-0 rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                {t('aceitar')}
              </button>
            )}
            {aceitos.has(n.id) && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check size={16} /> {t('aceito')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
