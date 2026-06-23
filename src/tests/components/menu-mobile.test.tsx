import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MenuMobile from '@/components/layout/MenuMobile'

describe('MenuMobile', () => {
  it('renderiza botão de menu', () => {
    render(<MenuMobile />)
    const botao = screen.getByRole('button')
    expect(botao).toBeInTheDocument()
  })

  it('exibe navegação ao clicar no botão', () => {
    render(<MenuMobile />)
    const botao = screen.getByRole('button')
    fireEvent.click(botao)
    expect(screen.getByText('Início')).toBeInTheDocument()
    expect(screen.getByText('Histórias')).toBeInTheDocument()
  })

  it('fecha menu ao clicar no botão X', () => {
    render(<MenuMobile />)
    // Abre
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Início')).toBeInTheDocument()
    // Fecha (segundo botão que aparece é o X)
    const botoes = screen.getAllByRole('button')
    const botaoFechar = botoes.find(b => b !== screen.getAllByRole('button')[0]) || botoes[1]
    fireEvent.click(botaoFechar)
    expect(screen.queryByText('Início')).not.toBeInTheDocument()
  })
})
