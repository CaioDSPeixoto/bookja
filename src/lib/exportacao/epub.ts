import epub from 'epub-gen-memory'
import { renderizarConteudoHTML } from '@/lib/historias/renderizar'

interface ProjetoExport {
  titulo: string
  sinopse?: string | null
  autor: string
}

interface DocumentoExport {
  titulo: string
  conteudo: unknown
}

export async function exportarEpub(projeto: ProjetoExport, documentos: DocumentoExport[]): Promise<Buffer> {
  const chapters = documentos.map(doc => ({
    title: doc.titulo,
    content: renderizarConteudoHTML(doc.conteudo) || '<p></p>',
  }))

  const buffer = await epub({
    title: projeto.titulo,
    author: projeto.autor,
    description: projeto.sinopse || undefined,
    lang: 'pt-BR',
  }, chapters)

  return Buffer.from(buffer)
}
