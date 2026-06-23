import JSZip from 'jszip'
import { htmlParaTiptap } from './html-para-tiptap'

interface CapituloImportado {
  titulo: string
  conteudo: ReturnType<typeof htmlParaTiptap>
}

function extrairTextoLimpo(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function detectarTitulo(html: string, indice: number): string {
  const headingMatch = html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i)
  if (headingMatch) return extrairTextoLimpo(headingMatch[1])

  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  if (pMatch) {
    const texto = extrairTextoLimpo(pMatch[1])
    if (texto.length > 0 && texto.length <= 100) return texto
  }

  return `Capítulo ${indice + 1}`
}

export async function importarEpub(buffer: Buffer): Promise<CapituloImportado[]> {
  const zip = await JSZip.loadAsync(buffer)

  // Find content.opf
  let opfPath = ''
  const containerXml = await zip.file('META-INF/container.xml')?.async('string')
  if (containerXml) {
    const rootfileMatch = containerXml.match(/full-path="([^"]+)"/)
    if (rootfileMatch) opfPath = rootfileMatch[1]
  }

  if (!opfPath) {
    // Fallback: find .opf file
    const opfFile = Object.keys(zip.files).find(f => f.endsWith('.opf'))
    if (!opfFile) throw new Error('Arquivo EPUB inválido: content.opf não encontrado')
    opfPath = opfFile
  }

  const opfContent = await zip.file(opfPath)?.async('string')
  if (!opfContent) throw new Error('Não foi possível ler content.opf')

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : ''

  // Parse manifest
  const manifest: Record<string, string> = {}
  const manifestRegex = /<item\s+[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = manifestRegex.exec(opfContent)) !== null) {
    manifest[match[1]] = match[2]
  }
  // Also try href before id
  const manifestRegex2 = /<item\s+[^>]*href="([^"]+)"[^>]*id="([^"]+)"[^>]*>/gi
  while ((match = manifestRegex2.exec(opfContent)) !== null) {
    manifest[match[2]] = match[1]
  }

  // Parse spine order
  const spineMatch = opfContent.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i)
  if (!spineMatch) throw new Error('Spine não encontrado no EPUB')

  const spineIds: string[] = []
  const itemrefRegex = /idref="([^"]+)"/gi
  while ((match = itemrefRegex.exec(spineMatch[1])) !== null) {
    spineIds.push(match[1])
  }

  // Extract chapters in spine order
  const capitulos: CapituloImportado[] = []
  for (let i = 0; i < spineIds.length; i++) {
    const href = manifest[spineIds[i]]
    if (!href) continue

    const filePath = opfDir + decodeURIComponent(href)
    const fileContent = await zip.file(filePath)?.async('string')
    if (!fileContent) continue

    // Extract body content
    const bodyMatch = fileContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    const html = bodyMatch ? bodyMatch[1] : fileContent

    const textoLimpo = html.replace(/<[^>]*>/g, '').trim()
    if (!textoLimpo) continue

    const titulo = detectarTitulo(html, capitulos.length)
    const conteudo = htmlParaTiptap(html)
    capitulos.push({ titulo, conteudo })
  }

  if (capitulos.length === 0) throw new Error('Nenhum capítulo encontrado no EPUB')
  return capitulos
}
