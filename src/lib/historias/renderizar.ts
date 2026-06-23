function escaparHTML(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

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

function renderizarTexto(node: TiptapNode): string {
  let texto = escaparHTML(node.text || '')
  if (node.marks) {
    for (const mark of node.marks) {
      switch (mark.type) {
        case 'bold': texto = `<strong>${texto}</strong>`; break
        case 'italic': texto = `<em>${texto}</em>`; break
        case 'underline': texto = `<u>${texto}</u>`; break
      }
    }
  }
  return texto
}

function renderizarNode(node: TiptapNode): string {
  switch (node.type) {
    case 'text':
      return renderizarTexto(node)
    case 'paragraph':
      return `<p>${renderizarFilhos(node)}</p>`
    case 'heading': {
      const nivel = (node.attrs?.level as number) || 2
      return `<h${nivel}>${renderizarFilhos(node)}</h${nivel}>`
    }
    case 'bulletList':
      return `<ul>${renderizarFilhos(node)}</ul>`
    case 'orderedList':
      return `<ol>${renderizarFilhos(node)}</ol>`
    case 'listItem':
      return `<li>${renderizarFilhos(node)}</li>`
    case 'blockquote':
      return `<blockquote>${renderizarFilhos(node)}</blockquote>`
    case 'horizontalRule':
      return '<hr />'
    default:
      return renderizarFilhos(node)
  }
}

function renderizarFilhos(node: TiptapNode): string {
  if (!node.content) return ''
  return node.content.map(renderizarNode).join('')
}

export function renderizarConteudoHTML(json: unknown): string {
  if (!json || typeof json !== 'object') return ''
  const doc = json as TiptapNode
  if (doc.type !== 'doc' || !doc.content) return ''
  return doc.content.map(renderizarNode).join('')
}
