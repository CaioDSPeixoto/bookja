import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { buscarPerfilPublico } from '@/lib/perfil/actions'
import { criarClienteServidor } from '@/lib/supabase/server'
import BotaoCopiarPix from './BotaoCopiarPix'
import MuralPerfil from '@/components/mural/MuralPerfil'

export default async function PerfilAutorPage({ params }: { params: Promise<{ locale: string; nomeUsuario: string }> }) {
  const { locale, nomeUsuario } = await params
  const t = await getTranslations('perfil')
  const dados = await buscarPerfilPublico(nomeUsuario)

  if (!dados) notFound()

  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  const usuarioLogadoId = user?.id || null

  const { perfil, projetos, leituras } = dados
  const iniciais = (perfil.nome_exibicao || perfil.nome_usuario || '?').slice(0, 2).toUpperCase()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        {perfil.avatar_url ? (
          <Image src={perfil.avatar_url} alt={perfil.nome_exibicao || ''} width={80} height={80} className="h-20 w-20 rounded-full object-cover" unoptimized />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
            {iniciais}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{perfil.nome_exibicao || perfil.nome_usuario}</h1>
          {perfil.bio && <p className="mt-1 text-gray-600">{perfil.bio}</p>}
        </div>
      </div>

      {perfil.chave_pix && (
        <div className="mb-8 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-2 text-sm font-medium text-gray-700">{t('chavePix')}</h2>
          <BotaoCopiarPix chavePix={perfil.chave_pix} />
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">{t('historiasEscritas')}</h2>
        {projetos.length === 0 ? (
          <p className="text-gray-500">{t('semHistorias')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projetos.map((p: { id: string; titulo: string; sinopse: string | null }) => (
              <Link key={p.id} href={`/${locale}/historia/${p.id}`} className="rounded-lg border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-colors">
                <h3 className="font-medium">{p.titulo}</h3>
                {p.sinopse && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{p.sinopse}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {leituras.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">{t('lendoAgora')}</h2>
          <div className="space-y-2">
            {leituras.map((l: { projeto_id: string; projeto: { id: string; titulo: string }[] | { id: string; titulo: string } | null }) => {
              const proj = Array.isArray(l.projeto) ? l.projeto[0] : l.projeto
              return proj ? (
                <Link key={l.projeto_id} href={`/${locale}/historia/${proj.id}`} className="flex items-center gap-2 rounded border border-gray-200 p-3 hover:bg-gray-50">
                  <BookOpen size={16} className="text-gray-400" />
                  <span>{proj.titulo}</span>
                </Link>
              ) : null
            })}
          </div>
        </section>
      )}

      <MuralPerfil perfilId={perfil.id} usuarioLogadoId={usuarioLogadoId} />
    </div>
  )
}
