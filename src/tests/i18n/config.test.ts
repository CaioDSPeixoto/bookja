import { describe, it, expect } from 'vitest'
import { locales, defaultLocale, localePrefix } from '@/i18n/config'

describe('Configuração i18n', () => {
  it('define pt-BR como idioma padrão', () => {
    expect(defaultLocale).toBe('pt-BR')
  })

  it('inclui pt-BR na lista de idiomas', () => {
    expect(locales).toContain('pt-BR')
  })

  it('usa prefixo de locale always', () => {
    expect(localePrefix).toBe('always')
  })
})
