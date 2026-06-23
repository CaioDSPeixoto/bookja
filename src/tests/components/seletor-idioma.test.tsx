import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SeletorIdioma from '@/components/layout/SeletorIdioma'

describe('SeletorIdioma', () => {
  it('renderiza botão com aria-label Idioma', () => {
    render(<SeletorIdioma />)
    expect(screen.getByLabelText('Idioma')).toBeInTheDocument()
  })

  it('exibe dropdown com opção de idioma ao clicar', () => {
    render(<SeletorIdioma />)
    fireEvent.click(screen.getByLabelText('Idioma'))
    const opcoes = screen.getAllByText('Português (Brasil)')
    // Deve ter pelo menos 2: o texto no botão + a opção no dropdown
    expect(opcoes.length).toBeGreaterThanOrEqual(2)
  })
})
