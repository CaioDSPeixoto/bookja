'use client'

import type { PresencaUsuario } from '@/hooks/usePresencaDocumento'

export default function PresencaBarra({ usuarios }: { usuarios: PresencaUsuario[] }) {
  if (usuarios.length === 0) return null
  const visiveis = usuarios.slice(0, 5)
  const extra = usuarios.length - visiveis.length

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visiveis.map((u) => (
          <span
            key={u.userId}
            title={`${u.nome}${u.editando ? ' (editando)' : ' (vendo)'}`}
            className="relative inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white"
            style={{ backgroundColor: u.cor }}
          >
            {u.nome.charAt(0).toUpperCase()}
            {u.editando && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-green-400" />
            )}
          </span>
        ))}
      </div>
      {extra > 0 && <span className="text-xs text-gray-400">+{extra}</span>}
      <span className="text-xs text-gray-400">
        {usuarios.length === 1 ? '1 pessoa aqui agora' : `${usuarios.length} pessoas aqui agora`}
      </span>
    </div>
  )
}
