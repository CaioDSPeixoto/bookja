import mammoth from 'mammoth'
import { htmlParaTiptap, separarCapitulos } from './html-para-tiptap'

interface CapituloImportado {
  titulo: string
  conteudo: ReturnType<typeof htmlParaTiptap>
}

export async function importarDocx(buffer: Buffer): Promise<CapituloImportado[]> {
  const resultado = await mammoth.convertToHtml({ buffer })
  const html = resultado.value

  if (!html.trim()) throw new Error('Documento DOCX vazio ou sem conteúdo legível')

  const capitulos = separarCapitulos(html)

  return capitulos.map(cap => ({
    titulo: cap.titulo,
    conteudo: htmlParaTiptap(cap.html),
  }))
}
