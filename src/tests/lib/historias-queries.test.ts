import { describe, expect, it } from 'vitest'

import { permitePorIdade } from '@/lib/historias/queries'

describe('Histórias - classificação etária', () => {
  it('permite história sem classificação para visitante sem idade', () => {
    expect(permitePorIdade([], null)).toBe(true)
  })

  it('permite classificação Livre para visitante sem idade', () => {
    expect(permitePorIdade([{ nome: 'Livre', categoria: 'publico_alvo' }], null)).toBe(true)
  })

  it('bloqueia classificação restrita quando idade é desconhecida', () => {
    expect(permitePorIdade([{ nome: '+18', categoria: 'publico_alvo' }], null)).toBe(false)
  })

  it('bloqueia usuário abaixo da idade mínima', () => {
    expect(permitePorIdade([{ nome: '+16', categoria: 'publico_alvo' }], 15)).toBe(false)
  })

  it('permite usuário com idade suficiente', () => {
    expect(permitePorIdade([{ nome: '+16', categoria: 'publico_alvo' }], 16)).toBe(true)
  })
})
