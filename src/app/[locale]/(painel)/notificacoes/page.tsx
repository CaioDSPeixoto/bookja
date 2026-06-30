'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Bell, Mail, MessageSquare, BookOpen, Check } from 'lucide-react'
import { listarNotificacoes, marcarComoLida, marcarTodasComoLidas } from '@/lib/notificacoes/actions'
import { aceitarConvite } from '@/lib/colaboradores/actions'
import { hrefNotificacao } from '@/lib/notificacoes/link'

type Notificacao = {
  id: string
  tipo: string
  projeto_id: string | null
  documento_id: string | null
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
    case 'novo_capitulo': return <BookOpen size={20} />
    default: return <Bell size={20} />
  }
}

export default function NotificacoesPage() {
  const t = useTranslations('notificacoes')
  const locale = useLocale()
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

  function handleAbrir(n: Notificacao) {
    if (n.lida) return
    setNotificacoes(prev => prev.map(x => x.id === n.id ? { ...x, lida: true } : x))
    marcarComoLida(n.id).catch(() => undefined)
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
          className="text-sm font-medium text-indigo-600 hover:underline disabled:opacity-50"
        >
          {t('marcarTodasLidas')}
        </button>
      </div>
      <div className="space-y-2">
        {notificacoes.map(n => {
          const href = hrefNotificacao(n, locale)
          const prefixo = n.tipo === 'convite' ? `${t('convite')} ` : ''
          const conteudo = (
            <>
              <div className="shrink-0 text-gray-500"><Icone tipo={n.tipo} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  {prefixo}
                  <span className="font-medium">{n.mensagem}</span>
                </p>
                <span className="text-xs text-gray-400">{tempoRelativo(n.criado_em)}</span>
              </div>
            </>
          )
          const classe = `flex items-center gap-3 rounded-xl border p-4 transition-colors ${!n.lida ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-white shadow-sm'}`
          return (
            <div key={n.id} className="flex items-stretch gap-2">
              {href ? (
                <Link href={href} onClick={() => handleAbrir(n)} className={`${classe} flex-1 hover:border-indigo-300`}>
                  {conteudo}
                </Link>
              ) : (
                <div className={`${classe} flex-1`}>{conteudo}</div>
              )}
              {n.tipo === 'convite' && n.projeto_id && !n.lida && !aceitos.has(n.id) && (
                <button
                  onClick={() => handleAceitar(n)}
                  disabled={pending}
                  className="shrink-0 self-center rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {t('aceitar')}
                </button>
              )}
              {aceitos.has(n.id) && (
                <span className="flex shrink-0 items-center gap-1 self-center text-sm text-green-600">
                  <Check size={16} /> {t('aceito')}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
