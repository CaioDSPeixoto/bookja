// Modelo de fichas/ambientação com campos flexíveis.
// Conteúdo é guardado em documento.conteudo como JSON { v: 1, campos: [...] }.

export type TipoCampo = 'curto' | 'longo'

export type CampoFicha = {
  id: string
  rotulo: string
  tipo: TipoCampo
  valor: string
}

export type ConteudoFicha = {
  v: 1
  campos: { id: string; rotulo: string; tipo: TipoCampo; valor: string }[]
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function campo(rotulo: string, tipo: TipoCampo): CampoFicha {
  return { id: uid(), rotulo, tipo, valor: '' }
}

// Presets editáveis por tipo de documento. São apenas um ponto de partida:
// o autor pode adicionar, remover ou renomear campos livremente.
export function presetPara(tipo: string): CampoFicha[] {
  switch (tipo) {
    case 'ficha_personagem':
      return [
        campo('Nome', 'curto'),
        campo('Apelidos', 'curto'),
        campo('Papel na história', 'curto'),
        campo('Aparência', 'longo'),
        campo('Personalidade', 'longo'),
        campo('História / passado', 'longo'),
        campo('Vínculos', 'longo'),
        campo('Objetivos', 'curto'),
        campo('Notas', 'longo'),
      ]
    case 'biblia':
      return [
        campo('Nome', 'curto'),
        campo('Tipo (local, facção, conceito...)', 'curto'),
        campo('Descrição', 'longo'),
        campo('Importância na história', 'longo'),
        campo('Detalhes', 'longo'),
      ]
    default:
      return [campo('Conteúdo', 'longo')]
  }
}

// Converte qualquer conteúdo salvo (novo, legado em string, ou vazio) em campos.
export function parseFicha(conteudo: unknown): CampoFicha[] {
  if (conteudo && typeof conteudo === 'object' && !Array.isArray(conteudo)) {
    const c = conteudo as Record<string, unknown>
    if (Array.isArray(c.campos)) {
      const campos = (c.campos as unknown[]).flatMap((item): CampoFicha[] => {
        if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>
          if (typeof o.rotulo === 'string') {
            return [{
              id: typeof o.id === 'string' ? o.id : uid(),
              rotulo: o.rotulo,
              tipo: o.tipo === 'curto' ? 'curto' : 'longo',
              valor: typeof o.valor === 'string' ? o.valor : '',
            }]
          }
        }
        return []
      })
      return campos
    }
  }
  // Conteúdo legado salvo como texto livre
  if (typeof conteudo === 'string' && conteudo.trim()) {
    return [{ id: uid(), rotulo: 'Conteúdo', tipo: 'longo', valor: conteudo }]
  }
  return []
}

export function serializarFicha(campos: CampoFicha[]): ConteudoFicha {
  return {
    v: 1,
    campos: campos.map((c) => ({ id: c.id, rotulo: c.rotulo, tipo: c.tipo, valor: c.valor })),
  }
}

export function novoCampo(tipo: TipoCampo = 'curto'): CampoFicha {
  return campo('Novo campo', tipo)
}

// Resumo curto para listagem (primeiro campo preenchido).
export function resumoFicha(campos: CampoFicha[]): string {
  const preenchido = campos.find((c) => c.valor.trim())
  if (!preenchido) return 'Sem conteúdo ainda'
  const texto = preenchido.valor.trim().replace(/\s+/g, ' ')
  return texto.length > 80 ? texto.slice(0, 80) + '…' : texto
}
