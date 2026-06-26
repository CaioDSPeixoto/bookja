import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CadastroPage from '@/app/[locale]/(auth)/cadastro/page'

const mockSignUp = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockUpdatePerfil = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  criarClienteBrowser: () => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
    },
    from: vi.fn(() => ({
      update: mockUpdatePerfil.mockReturnThis(),
      eq: vi.fn(),
    })),
  }),
}))

function preencherFormulario(email: string, usuario: string, dataNascimento: string, senha: string, confirmar: string) {
  const inputs = document.querySelectorAll('input')
  // ordem: email, nome_usuario, data_nascimento, senha, confirmar_senha
  fireEvent.change(inputs[0], { target: { value: email } })
  fireEvent.change(inputs[1], { target: { value: usuario } })
  fireEvent.change(inputs[2], { target: { value: dataNascimento } })
  fireEvent.change(inputs[3], { target: { value: senha } })
  fireEvent.change(inputs[4], { target: { value: confirmar } })
}

describe('Página de Cadastro', () => {
  beforeEach(() => {
    mockSignUp.mockReset()
    mockSignInWithPassword.mockReset()
    mockUpdatePerfil.mockReset()
  })

  it('renderiza formulário com todos os campos', () => {
    render(<CadastroPage />)
    expect(screen.getByText('E-mail')).toBeInTheDocument()
    expect(screen.getByText('Nome de usuário')).toBeInTheDocument()
    expect(screen.getByText('Data de nascimento')).toBeInTheDocument()
    expect(screen.getByText('Senha')).toBeInTheDocument()
    expect(screen.getByText('Confirmar senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeInTheDocument()
  })

  it('renderiza link para login', () => {
    render(<CadastroPage />)
    expect(screen.getByText('Já tem uma conta?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/pt-BR/entrar')
  })

  it('exibe erro quando senhas não coincidem', async () => {
    render(<CadastroPage />)
    preencherFormulario('a@b.com', 'user1', '2000-01-01', '123456', '654321')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    await waitFor(() => {
      expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('chama signUp com metadados quando senhas coincidem', async () => {
    mockSignUp.mockResolvedValue({ data: { session: { access_token: 'token' }, user: { id: 'user-1' } }, error: null })
    render(<CadastroPage />)
    preencherFormulario('a@b.com', 'user1', '2000-01-01', '123456', '123456')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: '123456',
        options: { data: { nome_usuario: 'user1', data_nascimento: '2000-01-01' } },
      })
    })
  })

  it('exibe erro quando cadastro falha', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Erro' } })
    render(<CadastroPage />)
    preencherFormulario('a@b.com', 'user1', '2000-01-01', '123456', '123456')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    await waitFor(() => {
      expect(screen.getByText('Erro ao criar conta. Tente novamente.')).toBeInTheDocument()
    })
  })
})
