import { jsPDF } from 'jspdf'

interface TiptapMark { type: string }
interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  marks?: TiptapMark[]
  attrs?: Record<string, unknown>
}

interface ProjetoExport { titulo: string; autor: string }
interface DocumentoExport { titulo: string; conteudo: unknown }

function extrairTextoPlano(node: TiptapNode): string {
  if (node.type === 'text') return node.text || ''
  if (!node.content) return ''
  return node.content.map(extrairTextoPlano).join('')
}

function extrairParagrafos(doc: TiptapNode): { texto: string; tipo: string; nivel?: number }[] {
  const resultado: { texto: string; tipo: string; nivel?: number }[] = []
  if (!doc.content) return resultado

  for (const node of doc.content) {
    switch (node.type) {
      case 'heading':
        resultado.push({ texto: extrairTextoPlano(node), tipo: 'heading', nivel: (node.attrs?.level as number) || 2 })
        break
      case 'paragraph':
        resultado.push({ texto: extrairTextoPlano(node), tipo: 'paragraph' })
        break
      case 'bulletList':
      case 'orderedList':
        if (node.content) {
          node.content.forEach((li, i) => {
            const prefix = node.type === 'bulletList' ? '•  ' : `${i + 1}.  `
            resultado.push({ texto: prefix + extrairTextoPlano(li), tipo: 'paragraph' })
          })
        }
        break
      case 'blockquote':
        resultado.push({ texto: '    ' + extrairTextoPlano(node), tipo: 'paragraph' })
        break
      case 'horizontalRule':
        resultado.push({ texto: '─────────────────────────────', tipo: 'separator' })
        break
      default:
        if (node.content) {
          resultado.push({ texto: extrairTextoPlano(node), tipo: 'paragraph' })
        }
    }
  }
  return resultado
}

export async function exportarPdf(projeto: ProjetoExport, documentos: DocumentoExport[]): Promise<Buffer> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const marginLeft = 25
  const marginRight = 25
  const marginTop = 30
  const marginBottom = 25
  const maxWidth = pageWidth - marginLeft - marginRight
  let y = marginTop

  function checkPage(needed: number) {
    if (y + needed > pageHeight - marginBottom) {
      pdf.addPage()
      y = marginTop
    }
  }

  // Título do livro
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(24)
  const tituloLines = pdf.splitTextToSize(projeto.titulo, maxWidth)
  checkPage(tituloLines.length * 10 + 10)
  pdf.text(tituloLines, pageWidth / 2, y, { align: 'center' })
  y += tituloLines.length * 10 + 5

  // Autor
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(12)
  pdf.text(projeto.autor, pageWidth / 2, y, { align: 'center' })
  y += 20

  // Capítulos
  for (const doc of documentos) {
    checkPage(30)

    // Título do capítulo
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    const capLines = pdf.splitTextToSize(doc.titulo, maxWidth)
    checkPage(capLines.length * 7 + 15)
    pdf.text(capLines, marginLeft, y)
    y += capLines.length * 7 + 8

    // Conteúdo
    const tiptap = doc.conteudo as TiptapNode | null
    if (!tiptap) continue

    const paragrafos = extrairParagrafos(tiptap)

    for (const p of paragrafos) {
      if (!p.texto.trim() && p.tipo === 'paragraph') {
        y += 4
        continue
      }

      if (p.tipo === 'heading') {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(p.nivel === 1 ? 16 : p.nivel === 2 ? 14 : 12)
        const lines = pdf.splitTextToSize(p.texto, maxWidth)
        checkPage(lines.length * 6 + 6)
        pdf.text(lines, marginLeft, y)
        y += lines.length * 6 + 4
      } else if (p.tipo === 'separator') {
        checkPage(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.text(p.texto, pageWidth / 2, y, { align: 'center' })
        y += 8
      } else {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(11)
        const lines = pdf.splitTextToSize(p.texto, maxWidth)
        checkPage(lines.length * 5 + 3)
        pdf.text(lines, marginLeft, y)
        y += lines.length * 5 + 3
      }
    }

    y += 15
  }

  return Buffer.from(pdf.output('arraybuffer'))
}
