'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

// Evento não-padrão do Chromium para instalação de PWA.
interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const CHAVE_DISPENSADO = 'bookja-instalar-dispensado'

/**
 * Botão discreto de instalação do PWA. Só aparece quando o navegador dispara
 * `beforeinstallprompt` (app instalável e ainda não instalado) e o usuário não
 * dispensou antes. Some ao instalar ou dispensar.
 */
export default function BotaoInstalarPWA() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null)

  useEffect(() => {
    function aoDisponivel(e: Event) {
      e.preventDefault()
      // Respeita a dispensa mesmo se o navegador reemitir o evento na sessão.
      if (localStorage.getItem(CHAVE_DISPENSADO) === '1') return
      setEvento(e as EventoInstalacao)
    }
    function aoInstalar() {
      setEvento(null)
    }

    window.addEventListener('beforeinstallprompt', aoDisponivel)
    window.addEventListener('appinstalled', aoInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoDisponivel)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  async function instalar() {
    if (!evento) return
    await evento.prompt()
    await evento.userChoice
    setEvento(null)
  }

  function dispensar() {
    localStorage.setItem(CHAVE_DISPENSADO, '1')
    setEvento(null)
  }

  if (!evento) return null

  return (
    <div className="flex items-center">
      <button
        onClick={instalar}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
      >
        <Download size={15} aria-hidden="true" />
        <span className="hidden sm:inline">Instalar app</span>
      </button>
      <button
        onClick={dispensar}
        className="ml-0.5 rounded p-1 text-gray-400 hover:text-gray-600"
        aria-label="Dispensar instalação"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
