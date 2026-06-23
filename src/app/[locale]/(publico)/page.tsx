import { getTranslations } from 'next-intl/server'
import { CardHistoria } from '@/components/historia/CardHistoria'
import {
  buscarPopularesSemana,
  buscarMaisAcessados,
  buscarMelhorAvaliados,
  buscarNovidades,
} from '@/lib/historias/queries'

export default async function PaginaInicial({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('inicio')

  const [populares, acessados, avaliados, novidades] = await Promise.all([
    buscarPopularesSemana(),
    buscarMaisAcessados(),
    buscarMelhorAvaliados(),
    buscarNovidades(),
  ])

  const secoes = [
    { titulo: t('popularesSemana'), dados: populares },
    { titulo: t('maisAcessados'), dados: acessados },
    { titulo: t('melhorAvaliados'), dados: avaliados },
    { titulo: t('novidades'), dados: novidades },
  ].filter((s) => s.dados.length > 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderCard(p: any) {
    const perfil = Array.isArray(p.perfil) ? p.perfil[0] : p.perfil
    const tags = (p.projeto_tag || []).map((pt: { tag: { id: string; nome: string } }) => pt.tag)
    return (
      <CardHistoria
        key={p.id}
        titulo={p.titulo}
        autor={perfil?.nome_exibicao || perfil?.nome_usuario || ''}
        sinopse={p.sinopse}
        tags={tags}
        avaliacao={p.media_avaliacao}
        capa_url={p.capa_url}
        href={`/${locale}/historia/${p.id}`}
      />
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t('titulo')}</h1>
        <p className="mt-4 text-lg text-gray-600">{t('subtitulo')}</p>
      </div>

      {secoes.length === 0 ? (
        <p className="text-center text-gray-500">{t('emBreve')}</p>
      ) : (
        <div className="space-y-12">
          {secoes.map((secao) => (
            <section key={secao.titulo}>
              <h2 className="mb-4 text-xl font-bold">{secao.titulo}</h2>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {secao.dados.map((p) => (
                  <div key={p.id} className="w-48 flex-shrink-0">
                    {renderCard(p)}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
