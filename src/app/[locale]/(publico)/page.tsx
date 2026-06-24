import { getTranslations } from 'next-intl/server'
import { CardHistoria } from '@/components/historia/CardHistoria'
import {
  buscarPopularesSemana,
  buscarMaisAcessados,
  buscarMelhorAvaliados,
  buscarNovidades,
} from '@/lib/historias/queries'
import { criarClienteServidor } from '@/lib/supabase/server'
import { Search, BookOpen, PenLine } from 'lucide-react'
import Link from 'next/link'

export default async function PaginaInicial({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('inicio')
  const supabase = await criarClienteServidor()

  const { data: { user } } = await supabase.auth.getUser()

  const [populares, acessados, avaliados, novidades] = await Promise.all([
    buscarPopularesSemana(),
    buscarMaisAcessados(),
    buscarMelhorAvaliados(),
    buscarNovidades(),
  ])

  // Buscar leituras atuais se logado
  let leiturasAtuais: Array<{ id: string; titulo: string; ultimo_capitulo_titulo: string; capitulo_id: string; historia_id: string }> = []
  if (user) {
    const { data } = await supabase
      .from('leitura_atual')
      .select('id, titulo, ultimo_capitulo_titulo, capitulo_id, historia_id')
      .eq('usuario_id', user.id)
      .limit(6)
    leiturasAtuais = data || []
  }

  const secoes = [
    { titulo: t('popularesSemana'), dados: populares },
    { titulo: t('maisAcessados'), dados: acessados },
    { titulo: t('melhorAvaliados'), dados: avaliados },
    { titulo: t('novidades'), dados: novidades },
  ].filter((s) => s.dados && s.dados.length > 0)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 to-white py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {t('heroTitulo')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {t('heroSubtitulo')}
          </p>

          <form action={`/${locale}/historias`} method="GET" className="mx-auto mt-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="busca"
                placeholder={t('buscarPlaceholder')}
                className="w-full rounded-full border border-gray-300 py-3 pl-12 pr-4 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </form>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href={`/${locale}/historias`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <BookOpen className="h-4 w-4" />
              {t('explorar')}
            </Link>
            <Link
              href={`/${locale}/projeto/novo`}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700"
            >
              <PenLine className="h-4 w-4" />
              {t('escrever')}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* Continuar lendo */}
        {leiturasAtuais.length > 0 && (
          <section className="py-12">
            <h2 className="mb-6 text-xl font-bold text-gray-900">{t('continuarLendo')}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {leiturasAtuais.map((leitura) => (
                <Link
                  key={leitura.id}
                  href={`/${locale}/historia/${leitura.historia_id}/capitulo/${leitura.capitulo_id}`}
                  className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-all hover:border-indigo-200 hover:shadow-lg"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900">{leitura.titulo}</h3>
                    <p className="truncate text-sm text-gray-500">{leitura.ultimo_capitulo_titulo}</p>
                  </div>
                  <BookOpen className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Seções de ranking */}
        {secoes.length === 0 ? (
          <p className="py-12 text-center text-gray-500">{t('emBreve')}</p>
        ) : (
          secoes.map((secao) => (
            <section key={secao.titulo} className="py-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{secao.titulo}</h2>
                <Link
                  href={`/${locale}/historias`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {t('verTodas')} →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {secao.dados!.map((p) => {
                  const perfil = Array.isArray(p.perfil) ? p.perfil[0] : p.perfil
                  const tags = (p.projeto_tag || []).map((pt: { tag: { id: string; nome: string } }) => pt.tag)
                  return (
                    <div key={p.id} className="rounded-xl border border-gray-200 transition-all hover:border-indigo-200 hover:shadow-lg">
                      <CardHistoria
                        titulo={p.titulo}
                        autor={perfil?.nome_exibicao || perfil?.nome_usuario || ''}
                        sinopse={p.sinopse}
                        tags={tags}
                        avaliacao={p.media_avaliacao}
                        capa_url={p.capa_url}
                        href={`/${locale}/historia/${p.id}`}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
