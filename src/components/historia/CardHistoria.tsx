import Link from 'next/link'
import { Star } from 'lucide-react'

interface CardHistoriaProps {
  titulo: string
  autor: string
  sinopse?: string | null
  tags: Array<{ id: string; nome: string }>
  avaliacao?: number | null
  capa_url?: string | null
  href: string
}

export function CardHistoria({ titulo, autor, sinopse, tags, avaliacao, capa_url, href }: CardHistoriaProps) {
  return (
    <Link href={href} className="group block overflow-hidden rounded-lg border border-gray-200 transition hover:shadow-lg">
      <div className="aspect-[3/4] w-full bg-gray-100">
        {capa_url ? (
          <img src={capa_url} alt={titulo} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
            <span className="text-4xl font-bold text-gray-300">{titulo.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 font-semibold group-hover:text-blue-600">{titulo}</h3>
        <p className="text-sm text-gray-500">{autor}</p>
        {sinopse && <p className="mt-1 line-clamp-2 text-xs text-gray-600">{sinopse}</p>}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                {tag.nome}
              </span>
            ))}
          </div>
          {avaliacao != null && avaliacao > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-yellow-600">
              <Star size={12} fill="currentColor" />
              {avaliacao.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
