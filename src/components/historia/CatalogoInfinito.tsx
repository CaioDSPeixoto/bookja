'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { CardHistoria } from './CardHistoria'
import { carregarHistorias } from '@/lib/historias/actions'

type ProjetoCatalogo = {
  id: string
  titulo: string
  sinopse: string | null
  capa_url: string | null
  media_avaliacao: number | null
  progresso_percentual?: number | null
  perfil: { nome_exibicao?: string; nome_usuario?: string } | { nome_exibicao?: string; nome_usuario?: string }[] | null
  projeto_tag?: Array<{ tag: { id: number | string; nome: string } }>
}

interface Props {
  inicial: ProjetoCatalogo[]
  totalPaginas: number
  busca?: string
  tags?: string[]
}

function cardProps(p: ProjetoCatalogo, locale: string) {
  const perfil = Array.isArray(p.perfil) ? p.perfil[0] : p.perfil
  const tags = (p.projeto_tag || []).map((pt) => ({ id: String(pt.tag.id), nome: pt.tag.nome }))
  return {
    titulo: p.titulo,
    autor: perfil?.nome_exibicao || perfil?.nome_usuario || '',
    sinopse: p.sinopse,
    tags,
    avaliacao: p.media_avaliacao,
    capa_url: p.capa_url,
    progresso: p.progresso_percentual,
    href: `/${locale}/historia/${p.id}`,
  }
}

export default function CatalogoInfinito({ inicial, totalPaginas, busca, tags }: Props) {
  const locale = useLocale()
  const [projetos, setProjetos] = useState<ProjetoCatalogo[]>(inicial)
  const [pagina, setPagina] = useState(1)
  const [carregando, setCarregando] = useState(false)
  const sentinelaRef = useRef<HTMLDivElement>(null)

  const temMais = pagina < totalPaginas
  // Chave estável do array de tags para dependências de efeito/callback.
  const tagsKey = (tags || []).join(',')

  // Reinicia ao mudar filtros (nova lista vinda do servidor).
  useEffect(() => {
    setProjetos(inicial)
    setPagina(1)
  }, [inicial, busca, tagsKey])

  const carregarMais = useCallback(async () => {
    if (carregando) return
    setCarregando(true)
    try {
      const proxima = pagina + 1
      const { projetos: novos } = await carregarHistorias({ busca, tags: tagsKey ? tagsKey.split(',') : [], pagina: proxima })
      setProjetos((atuais) => {
        const vistos = new Set(atuais.map((p) => p.id))
        return [...atuais, ...(novos as ProjetoCatalogo[]).filter((p) => !vistos.has(p.id))]
      })
      setPagina(proxima)
    } finally {
      setCarregando(false)
    }
  }, [carregando, pagina, busca, tagsKey])

  useEffect(() => {
    const alvo = sentinelaRef.current
    if (!alvo || !temMais) return
    const observador = new IntersectionObserver(
      (entradas) => { if (entradas[0].isIntersecting) carregarMais() },
      { rootMargin: '400px' },
    )
    observador.observe(alvo)
    return () => observador.disconnect()
  }, [temMais, carregarMais])

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {projetos.map((p) => (
          <CardHistoria key={p.id} {...cardProps(p, locale)} />
        ))}
      </div>

      {temMais && (
        <div ref={sentinelaRef} className="flex justify-center py-8 text-gray-400">
          {carregando && <Loader2 size={20} className="animate-spin" />}
        </div>
      )}
    </>
  )
}
