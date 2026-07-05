'use client'

import { useEffect } from 'react'

/**
 * Registra o service worker (`/sw.js`) para habilitar cache offline e instalação
 * como PWA. Só registra em produção, evitando cachear assets durante o dev.
 */
export default function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const registrar = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Falha ao registrar não deve quebrar a aplicação.
      })
    }

    if (document.readyState === 'complete') registrar()
    else window.addEventListener('load', registrar, { once: true })
  }, [])

  return null
}
