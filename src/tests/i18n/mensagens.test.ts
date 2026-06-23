import { describe, it, expect } from 'vitest'
import messages from '@/messages/pt-BR.json'

describe('Mensagens PT-BR', () => {
  it('contém todos os namespaces obrigatórios', () => {
    const namespacesObrigatorios = [
      'geral',
      'auth',
      'navegacao',
      'inicio',
      'projeto',
      'editor',
      'comentarios',
      'perfil',
      'idioma',
      'documento',
    ]
    namespacesObrigatorios.forEach((ns) => {
      expect(messages).toHaveProperty(ns)
    })
  })

  it('namespace geral tem chaves essenciais', () => {
    expect(messages.geral.nomePlataforma).toBe('Bookja')
    expect(messages.geral.salvar).toBeTruthy()
    expect(messages.geral.cancelar).toBeTruthy()
  })

  it('namespace auth tem chaves de login e cadastro', () => {
    expect(messages.auth.entrar).toBeTruthy()
    expect(messages.auth.cadastrar).toBeTruthy()
    expect(messages.auth.email).toBeTruthy()
    expect(messages.auth.senha).toBeTruthy()
  })

  it('nenhum valor de tradução está vazio', () => {
    const verificarVazios = (obj: Record<string, unknown>, caminho = '') => {
      Object.entries(obj).forEach(([chave, valor]) => {
        const caminhoCompleto = caminho ? `${caminho}.${chave}` : chave
        if (typeof valor === 'object' && valor !== null) {
          verificarVazios(valor as Record<string, unknown>, caminhoCompleto)
        } else {
          expect(valor, `${caminhoCompleto} está vazio`).toBeTruthy()
        }
      })
    }
    verificarVazios(messages as unknown as Record<string, unknown>)
  })
})
