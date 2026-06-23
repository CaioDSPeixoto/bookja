'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { adquirirLock, liberarLock, renovarLock } from '@/lib/lock/actions'

interface UseLockEdicaoResult {
  travado: boolean
  somenteLeitura: boolean
  travadoPor: string | null
  carregando: boolean
}

export function useLockEdicao(documentoId: string): UseLockEdicaoResult {
  const [travado, setTravado] = useState(false)
  const [somenteLeitura, setSomenteLeitura] = useState(false)
  const [travadoPor, setTravadoPor] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const tentarAdquirir = useCallback(async () => {
    try {
      const resultado = await adquirirLock(documentoId)
      if (resultado.sucesso) {
        setTravado(true)
        setSomenteLeitura(false)
        setTravadoPor(null)
      } else {
        setTravado(false)
        setSomenteLeitura(true)
        setTravadoPor(resultado.travadoPor || null)
      }
    } catch {
      setSomenteLeitura(true)
    } finally {
      setCarregando(false)
    }
  }, [documentoId])

  const liberar = useCallback(async () => {
    try {
      await liberarLock(documentoId)
    } catch { /* melhor esforço */ }
  }, [documentoId])

  useEffect(() => {
    tentarAdquirir()

    // Heartbeat a cada 60s
    intervalRef.current = setInterval(async () => {
      const resultado = await renovarLock(documentoId)
      if (!resultado.sucesso) {
        setSomenteLeitura(true)
        setTravado(false)
      }
    }, 60_000)

    // Liberar ao fechar aba
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        '/api/lock/liberar',
        JSON.stringify({ documentoId })
      )
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      liberar()
    }
  }, [documentoId, tentarAdquirir, liberar])

  return { travado, somenteLeitura, travadoPor, carregando }
}
