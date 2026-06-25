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

const BLOCK_TAGS: Record<string, string> = {
  p: 'paragraph',
  h1: 'heading', h2: 'heading', h3: 'heading',
  h4: 'heading', h5: 'heading', h6: 'heading',
  ul: 'bulletList', ol: 'orderedList', li: 'listItem',
  blockquote: 'blockquote',
}

const MARK_TAGS: Record<string, string> = {
  strong: 'bold', b: 'bold',
  em: 'italic', i: 'italic',
  u: 'underline',
}

function sanitizarHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
    // Strip anchor bookmarks (id/name only, no href) — remove entirely including content
    .replace(/<a\s+(?:id|name)\s*=\s*["'][^"']*["'][^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<a\s+(?:id|name)\s*=\s*["'][^"']*["'][^>]*\/?>/gi, '')
    // Strip anchor links (with href) — keep text content
    .replace(/<a\s[^>]*href[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    // Strip other non-semantic inline tags (span, sup, sub, etc.) — keep text content
    .replace(/<\/?(span|sup|sub|font|abbr|cite|code|small|big|mark|ins|del|s|strike|tt|var|samp|kbd|wbr)(\s[^>]*)?>/gi, '')
}

function extrairTexto(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ')
}

function parseInline(html: string, marks: TiptapMark[] = []): TiptapNode[] {
  const nodes: TiptapNode[] = []
  const regex = /<(strong|b|em|i|u)>([\s\S]*?)<\/\1>|([^<]+)|<br\s*\/?>|<[^>]*>/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    if (match[3] !== undefined) {
      const texto = match[3].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ')
      if (texto.trim() || texto) {
        const node: TiptapNode = { type: 'text', text: texto }
        if (marks.length > 0) node.marks = [...marks]
        nodes.push(node)
      }
    } else if (match[0].startsWith('<br')) {
      nodes.push({ type: 'hardBreak' })
    } else if (match[1]) {
      const markType = MARK_TAGS[match[1].toLowerCase()]
      if (markType) {
        const inner = parseInline(match[2], [...marks, { type: markType }])
        nodes.push(...inner)
      }
    }
    // Unrecognized tags (caught by <[^>]*>) are silently skipped
  }

  return nodes
}

function parseBlocks(html: string): TiptapNode[] {
  const nodes: TiptapNode[] = []
  const blockRegex = /<(p|h[1-6]|ul|ol|li|blockquote|hr)(\s[^>]*)?>(([\s\S]*?))<\/\1>|<hr\s*\/?>/gi
  let match: RegExpExecArray | null
  let lastIndex = 0

  while ((match = blockRegex.exec(html)) !== null) {
    // Text between blocks
    if (match.index > lastIndex) {
      const between = html.slice(lastIndex, match.index).trim()
      if (between) {
        const inline = parseInline(between)
        if (inline.length > 0) {
          nodes.push({ type: 'paragraph', content: inline })
        }
      }
    }
    lastIndex = match.index + match[0].length

    if (match[0].match(/^<hr/i)) {
      nodes.push({ type: 'horizontalRule' })
      continue
    }

    const tag = match[1].toLowerCase()
    const inner = match[3] || ''

    if (tag === 'hr') {
      nodes.push({ type: 'horizontalRule' })
    } else if (tag.startsWith('h')) {
      const level = parseInt(tag[1])
      const content = parseInline(inner)
      nodes.push({ type: 'heading', attrs: { level }, content: content.length > 0 ? content : [{ type: 'text', text: extrairTexto(inner) || ' ' }] })
    } else if (tag === 'ul' || tag === 'ol') {
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
      let liMatch: RegExpExecArray | null
      const items: TiptapNode[] = []
      while ((liMatch = liRegex.exec(inner)) !== null) {
        const liContent = liMatch[1]
        if (/<[uo]l/i.test(liContent)) {
          const nestedBlocks = parseBlocks(liContent)
          items.push({ type: 'listItem', content: nestedBlocks.length > 0 ? nestedBlocks : [{ type: 'paragraph', content: [{ type: 'text', text: extrairTexto(liContent) }] }] })
        } else {
          const inline = parseInline(liContent)
          items.push({ type: 'listItem', content: [{ type: 'paragraph', content: inline.length > 0 ? inline : [{ type: 'text', text: extrairTexto(liContent) }] }] })
        }
      }
      if (items.length > 0) {
        nodes.push({ type: tag === 'ul' ? 'bulletList' : 'orderedList', content: items })
      }
    } else if (tag === 'blockquote') {
      const innerBlocks = parseBlocks(inner)
      nodes.push({ type: 'blockquote', content: innerBlocks.length > 0 ? innerBlocks : [{ type: 'paragraph', content: parseInline(inner) }] })
    } else if (tag === 'p') {
      const content = parseInline(inner)
      nodes.push({ type: 'paragraph', content: content.length > 0 ? content : [{ type: 'text', text: ' ' }] })
    } else if (tag === 'li') {
      const content = parseInline(inner)
      nodes.push({ type: 'paragraph', content: content.length > 0 ? content : [{ type: 'text', text: extrairTexto(inner) }] })
    }
  }

  // Remaining text
  if (lastIndex < html.length) {
    const remaining = html.slice(lastIndex).trim()
    if (remaining) {
      const inline = parseInline(remaining)
      if (inline.length > 0) {
        nodes.push({ type: 'paragraph', content: inline })
      }
    }
  }

  return nodes
}

export function htmlParaTiptap(html: string): TiptapNode {
  const limpo = sanitizarHTML(html)
  const content = parseBlocks(limpo)
  return { type: 'doc', content: content.length > 0 ? content : [{ type: 'paragraph', content: [{ type: 'text', text: ' ' }] }] }
}

export function separarCapitulos(html: string): { titulo: string; html: string }[] {
  const limpo = sanitizarHTML(html)
  const headingRegex = /<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi
  const matches = [...limpo.matchAll(headingRegex)]

  if (matches.length <= 1) {
    const titulo = matches[0] ? extrairTexto(matches[0][1]) : 'Capítulo 1'
    return [{ titulo, html: limpo }]
  }

  const capitulos: { titulo: string; html: string }[] = []
  for (let i = 0; i < matches.length; i++) {
    const inicio = matches[i].index!
    const fim = i + 1 < matches.length ? matches[i + 1].index! : limpo.length
    capitulos.push({
      titulo: extrairTexto(matches[i][1]),
      html: limpo.slice(inicio, fim),
    })
  }

  return capitulos
}
