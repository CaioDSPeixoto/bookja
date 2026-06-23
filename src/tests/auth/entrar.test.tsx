import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EntrarPage from '@/app/[locale]/(auth)/entrar/page'

const mockSignIn = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  criarClienteBrowser: () => ({
    auth: {
      signInWithPassword: mockSignIn,
    },
  }),
}))

describe('Página de Login', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
  })

  it('renderiza formulário com campos de email e senha', () => {
    render(<EntrarPage />)
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('renderiza link para cadastro', () => {
    render(<EntrarPage />)
    expect(screen.getByText('Não tem uma conta?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cadastrar' })).toHaveAttribute('href', '/pt-BR/cadastro')
  })

  it('chama signInWithPassword ao submeter', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    render(<EntrarPage />)

    const emailInput = screen.getByLabelText('E-mail')
    const senhaInput = screen.getByLabelText('Senha')
    fireEvent.change(emailInput, { target: { value: 'teste@email.com' } })
    fireEvent.change(senhaInput, { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'teste@email.com',
        password: '123456',
      })
    })
  })

  it('exibe mensagem de erro quando login falha', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid' } })
    render(<EntrarPage />)

    const emailInput = screen.getByLabelText('E-mail')
    const senhaInput = screen.getByLabelText('Senha')
    fireEvent.change(emailInput, { target: { value: 'x@x.com' } })
    fireEvent.change(senhaInput, { target: { value: 'errada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha inválidos')).toBeInTheDocument()
    })
  })
})
