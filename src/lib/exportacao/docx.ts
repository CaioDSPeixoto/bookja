import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

interface TiptapMark {
  type: string
}

interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  marks?: TiptapMark[]
  attrs?: Record<string, unknown>
}

interface ProjetoExport {
  titulo: string
  autor: string
}

interface DocumentoExport {
  titulo: string
  conteudo: unknown
}

function converterMarks(node: TiptapNode): TextRun {
  const opts: Record<string, unknown> = { text: node.text || '' }
  if (node.marks) {
    for (const mark of node.marks) {
      if (mark.type === 'bold') opts.bold = true
      if (mark.type === 'italic') opts.italics = true
      if (mark.type === 'underline') opts.underline = {}
    }
  }
  return new TextRun(opts)
}

function converterNode(node: TiptapNode): Paragraph[] {
  switch (node.type) {
    case 'heading': {
      const level = (node.attrs?.level as number) || 2
      const headingMap: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      }
      return [new Paragraph({
        heading: headingMap[level] || HeadingLevel.HEADING_2,
        children: (node.content || []).filter(n => n.type === 'text').map(converterMarks),
      })]
    }
    case 'paragraph':
      return [new Paragraph({
        children: (node.content || []).filter(n => n.type === 'text' || n.type === 'hardBreak').map(n =>
          n.type === 'hardBreak' ? new TextRun({ text: '', break: 1 }) : converterMarks(n)
        ),
      })]
    case 'bulletList':
    case 'orderedList':
      return (node.content || []).flatMap(li => {
        const paraContent = li.content?.find(n => n.type === 'paragraph')
        return [new Paragraph({
          bullet: node.type === 'bulletList' ? { level: 0 } : undefined,
          numbering: node.type === 'orderedList' ? { reference: 'default-numbering', level: 0 } : undefined,
          children: (paraContent?.content || []).filter(n => n.type === 'text').map(converterMarks),
        })]
      })
    case 'blockquote':
      return (node.content || []).flatMap(converterNode).map(p => {
        // Indent blockquotes
        return new Paragraph({
          ...p,
          indent: { left: 720 },
          children: (node.content?.[0]?.content || []).filter(n => n.type === 'text').map(converterMarks),
        })
      })
    case 'horizontalRule':
      return [new Paragraph({ text: '───────────────────────', alignment: AlignmentType.CENTER })]
    default:
      return []
  }
}

function converterDocumento(doc: DocumentoExport): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: doc.titulo })] }),
    new Paragraph({ text: '' }),
  ]

  const tiptap = doc.conteudo as TiptapNode | null
  if (tiptap?.content) {
    for (const node of tiptap.content) {
      paragraphs.push(...converterNode(node))
    }
  }

  paragraphs.push(new Paragraph({ text: '' }))
  return paragraphs
}

export async function exportarDocx(projeto: ProjetoExport, documentos: DocumentoExport[]): Promise<Buffer> {
  const doc = new Document({
    creator: projeto.autor,
    title: projeto.titulo,
    sections: [{
      children: documentos.flatMap(converterDocumento),
    }],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}
