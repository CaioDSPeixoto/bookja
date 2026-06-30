import { getTranslations } from 'next-intl/server'
import { Heart } from 'lucide-react'
import { criarClienteServidor } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function FavoritosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('navegacao')
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let favoritos: any[] = []

  if (user) {
    const { data } = await supabase
      .from('favorito')
      .select('projeto_id, projeto:projeto(id, titulo, sinopse, status)')
      .eq('usuario_id', user.id)

    favoritos = data || []
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('favoritos')}</h1>

      {favoritos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Heart size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Nenhuma história favoritada ainda.</p>
          <Link
            href={`/${locale}/historias`}
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Explorar histórias
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {favoritos.map((fav) => {
            const proj = Array.isArray(fav.projeto) ? fav.projeto[0] : fav.projeto
            if (!proj) return null
            return (
              <Link
                key={fav.projeto_id}
                href={`/${locale}/historia/${proj.id}`}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-gray-900">{proj.titulo}</h2>
                {proj.sinopse && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{proj.sinopse}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
