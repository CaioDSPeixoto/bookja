import Link from 'next/link'
import Image from 'next/image'
import { Star } from 'lucide-react'

interface CardHistoriaProps {
  titulo: string
  autor: string
  sinopse?: string | null
  tags: Array<{ id: string; nome: string }>
  avaliacao?: number | null
  capa_url?: string | null
  href: string
  progresso?: number | null
}

export function CardHistoria({ titulo, autor, sinopse, tags, avaliacao, capa_url, href, progresso }: CardHistoriaProps) {
  const temProgresso = progresso != null && progresso > 0
  return (
    <Link href={href} className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
        {capa_url ? (
          <Image src={capa_url} alt={titulo} width={360} height={480} sizes="(min-width: 1024px) 16vw, (min-width: 768px) 24vw, (min-width: 640px) 32vw, 48vw" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50">
            <span className="text-4xl font-bold text-indigo-200">{titulo.charAt(0)}</span>
          </div>
        )}
        {temProgresso && (
          <div className="absolute inset-x-0 bottom-0" title={`${progresso}% lido`}>
            <div className="h-1.5 w-full bg-black/25">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 font-semibold text-gray-900 group-hover:text-indigo-600">{titulo}</h3>
        <p className="text-sm text-gray-500">{autor}</p>
        {sinopse && <p className="mt-1 line-clamp-2 text-xs text-gray-600">{sinopse}</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag.id} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
                {tag.nome}
              </span>
            ))}
          </div>
          {avaliacao != null && avaliacao > 0 && (
            <span className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-yellow-50 px-1.5 py-0.5 text-xs font-medium text-yellow-700">
              <Star size={12} fill="currentColor" />
              {avaliacao.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
