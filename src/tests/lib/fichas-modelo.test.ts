import { describe, it, expect } from 'vitest'
import {
  presetPara,
  parseFicha,
  serializarFicha,
  resumoFicha,
  novoCampo,
} from '@/lib/fichas/modelo'

describe('fichas/modelo - presetPara', () => {
  it('personagem traz campos esperados e estrutura válida', () => {
    const campos = presetPara('ficha_personagem')
    expect(campos.length).toBeGreaterThan(3)
    expect(campos.map(c => c.rotulo)).toContain('Nome')
    expect(campos.map(c => c.rotulo)).toContain('Personalidade')
    for (const c of campos) {
      expect(c.id).toBeTruthy()
      expect(['curto', 'longo']).toContain(c.tipo)
      expect(c.valor).toBe('')
    }
  })

  it('biblia traz campos de ambientação', () => {
    expect(presetPara('biblia').map(c => c.rotulo)).toContain('Descrição')
  })

  it('tipo desconhecido cai num único campo Conteúdo longo', () => {
    const campos = presetPara('outro')
    expect(campos).toHaveLength(1)
    expect(campos[0].rotulo).toBe('Conteúdo')
    expect(campos[0].tipo).toBe('longo')
  })
})

describe('fichas/modelo - parseFicha (compatibilidade)', () => {
  it('null/undefined viram lista vazia', () => {
    expect(parseFicha(null)).toEqual([])
    expect(parseFicha(undefined)).toEqual([])
  })

  it('conteúdo legado em texto vira um campo Conteúdo', () => {
    const campos = parseFicha('Texto antigo da bíblia')
    expect(campos).toHaveLength(1)
    expect(campos[0].rotulo).toBe('Conteúdo')
    expect(campos[0].tipo).toBe('longo')
    expect(campos[0].valor).toBe('Texto antigo da bíblia')
  })

  it('formato novo é preservado', () => {
    const conteudo = { v: 1, campos: [{ id: 'a', rotulo: 'Nome', tipo: 'curto', valor: 'Kai' }] }
    const campos = parseFicha(conteudo)
    expect(campos).toEqual([{ id: 'a', rotulo: 'Nome', tipo: 'curto', valor: 'Kai' }])
  })

  it('campos malformados (sem rótulo) são descartados', () => {
    const conteudo = { v: 1, campos: [{ valor: 'sem rotulo' }, { id: 'b', rotulo: 'Ok', tipo: 'longo', valor: 'x' }] }
    const campos = parseFicha(conteudo)
    expect(campos).toHaveLength(1)
    expect(campos[0].rotulo).toBe('Ok')
  })

  it('tipo inválido vira "longo" e valor não-string vira ""', () => {
    const conteudo = { v: 1, campos: [{ id: 'a', rotulo: 'X', tipo: 'estranho', valor: 42 }] }
    const [c] = parseFicha(conteudo)
    expect(c.tipo).toBe('longo')
    expect(c.valor).toBe('')
  })
})

describe('fichas/modelo - serializar e resumo', () => {
  it('serializarFicha faz round-trip com parseFicha', () => {
    const campos = presetPara('ficha_personagem')
    campos[0].valor = 'Kai'
    const back = parseFicha(serializarFicha(campos))
    expect(back).toEqual(campos)
  })

  it('resumoFicha pega o primeiro campo preenchido', () => {
    const campos = [novoCampo('curto'), novoCampo('longo')]
    campos[1].valor = 'Bastidor importante'
    expect(resumoFicha(campos)).toBe('Bastidor importante')
  })

  it('resumoFicha trunca textos longos', () => {
    const campos = [novoCampo('longo')]
    campos[0].valor = 'a'.repeat(200)
    const r = resumoFicha(campos)
    expect(r.endsWith('…')).toBe(true)
    expect(r.length).toBeLessThanOrEqual(81)
  })

  it('resumoFicha sem conteúdo retorna placeholder', () => {
    expect(resumoFicha([novoCampo('curto')])).toBe('Sem conteúdo ainda')
  })
})
