'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Mail, MessageSquare } from 'lucide-react'
import { listarNotificacoes, marcarComoLida } from '@/lib/notificacoes/actions'
import { aceitarConvite } from '@/lib/colaboradores/actions'

type Notificacao = { id: string; tipo: string; projeto_id: string | null; mensagem: string; lida: boolean; criado_em: string }

function tempoRelativo(data: string) {
  const diff = Date.now() - new Date(data).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function NotificacoesPopup({ locale }: { locale: string }) {
  const [aberto, setAberto] = useState(false)
  const [notifs, setNotifs] = useState<Notificacao[]>([])
  const [carregado, setCarregado] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function abrir() {
    setAberto(!aberto)
    if (!carregado) {
      const data = await listarNotificacoes()
      setNotifs(data)
      setCarregado(true)
    }
  }

  async function handleAceitar(n: Notificacao) {
    await aceitarConvite(n.projeto_id!)
    await marcarComoLida(n.id)
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, lida: true } : x))
  }

  const naoLidas = notifs.filter(n => !n.lida).length

  return (
    <div ref={ref} className="relative">
      <button onClick={abrir} className="relative p-2 hover:bg-gray-100 rounded-full">
        <Bell className="h-5 w-5" />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border bg-white shadow-lg">
          <div className="sticky top-0 flex items-center justify-between border-b bg-white px-4 py-2">
            <span className="text-sm font-semibold">Notificações</span>
          </div>
          {notifs.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-500">Nenhuma notificação</p>
          ) : (
            <ul>
              {notifs.slice(0, 8).map(n => (
                <li key={n.id} className={`flex items-start gap-2 px-4 py-3 text-sm border-b last:border-0 ${!n.lida ? 'bg-indigo-50' : ''}`}>
                  <span className="mt-0.5 text-gray-400">{n.tipo === 'convite' ? <Mail size={14}/> : <MessageSquare size={14}/>}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 truncate">{n.mensagem}</p>
                    <span className="text-xs text-gray-400">{tempoRelativo(n.criado_em)}</span>
                  </div>
                  {n.tipo === 'convite' && !n.lida && (
                    <button onClick={() => handleAceitar(n)} className="shrink-0 rounded bg-green-600 px-2 py-0.5 text-xs text-white hover:bg-green-700">Aceitar</button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link href={`/${locale}/notificacoes`} onClick={() => setAberto(false)} className="block border-t px-4 py-2 text-center text-xs font-medium text-indigo-600 hover:bg-gray-50">
            Ver todas
          </Link>
        </div>
      )}
    </div>
  )
}
