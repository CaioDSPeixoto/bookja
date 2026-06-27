'use client'

import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { criarClienteBrowser } from '@/lib/supabase/client'

export type PresencaUsuario = {
  userId: string
  nome: string
  cor: string
  editando: boolean
}

const CORES = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6']

function corDe(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return CORES[h % CORES.length]
}

/**
 * Presença ao vivo num documento via Supabase Realtime.
 * Retorna a lista de OUTROS usuários presentes (exclui o próprio).
 * `editando` indica se este usuário está com permissão de edição (lock).
 */
export function usePresencaDocumento(documentoId: string, editando: boolean): PresencaUsuario[] {
  const [outros, setOutros] = useState<PresencaUsuario[]>([])
  const canalRef = useRef<RealtimeChannel | null>(null)
  const infoRef = useRef<{ userId: string; nome: string; cor: string } | null>(null)
  const editandoRef = useRef(editando)
  editandoRef.current = editando

  useEffect(() => {
    if (!documentoId) return
    const supabase = criarClienteBrowser()
    let ativo = true
    let canal: RealtimeChannel | null = null

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !ativo) return

      let nome = user.email ? user.email.split('@')[0] : 'Usuário'
      const { data: perfil } = await supabase
        .from('perfil')
        .select('nome_exibicao, nome_usuario')
        .eq('id', user.id)
        .single()
      if (perfil) {
        nome = (perfil.nome_exibicao as string | null) || (perfil.nome_usuario as string | null) || nome
      }

      const info = { userId: user.id, nome, cor: corDe(user.id) }
      infoRef.current = info

      canal = supabase.channel(`presenca:documento:${documentoId}`, {
        config: { presence: { key: user.id } },
      })
      canalRef.current = canal

      canal.on('presence', { event: 'sync' }, () => {
        const estado = canal!.presenceState() as unknown as Record<string, PresencaUsuario[]>
        const lista: PresencaUsuario[] = []
        for (const key of Object.keys(estado)) {
          const meta = estado[key]?.[0]
          if (meta && meta.userId && meta.userId !== info.userId) lista.push(meta)
        }
        setOutros(lista)
      })

      canal.subscribe((s) => {
        if (s === 'SUBSCRIBED') {
          void canal!.track({ ...info, editando: editandoRef.current })
        }
      })
    })()

    return () => {
      ativo = false
      if (canal) void supabase.removeChannel(canal)
      canalRef.current = null
      infoRef.current = null
    }
  }, [documentoId])

  // Re-anuncia quando muda o estado de edição (lock adquirido/perdido)
  useEffect(() => {
    const canal = canalRef.current
    const info = infoRef.current
    if (canal && info) void canal.track({ ...info, editando })
  }, [editando])

  return outros
}
