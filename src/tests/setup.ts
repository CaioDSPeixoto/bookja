import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/pt-BR',
  redirect: vi.fn(),
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const messages: Record<string, Record<string, string>> = {
      auth: {
        entrar: 'Entrar',
        cadastrar: 'Cadastrar',
        sair: 'Sair',
        email: 'E-mail',
        senha: 'Senha',
        confirmarSenha: 'Confirmar senha',
        nomeUsuario: 'Nome de usuário',
        semConta: 'Não tem uma conta?',
        comConta: 'Já tem uma conta?',
        erroLogin: 'E-mail ou senha inválidos',
        erroCadastro: 'Erro ao criar conta. Tente novamente.',
        senhasNaoCoincidem: 'As senhas não coincidem',
      },
      navegacao: {
        inicio: 'Início',
        historias: 'Histórias',
        biblioteca: 'Minha Biblioteca',
        painel: 'Painel',
        favoritos: 'Favoritos',
        notificacoes: 'Notificações',
        configuracoes: 'Configurações',
        meuPerfil: 'Meu perfil',
        novoProjeto: 'Novo projeto',
        sair: 'Sair',
      },
      idioma: {
        seletor: 'Idioma',
        ptBR: 'Português (Brasil)',
      },
      inicio: {
        titulo: 'Descubra histórias incríveis',
        subtitulo: 'Leia, escreva e compartilhe histórias com a comunidade',
        popularesSemana: 'Populares da semana',
        maisAcessados: 'Mais acessados',
        melhorAvaliados: 'Melhor avaliados',
        novidades: 'Novidades',
        emBreve: 'Em breve',
      },
    }
    const ns = messages[namespace] || {}
    return (key: string) => ns[key] || key
  },
  useLocale: () => 'pt-BR',
}))

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(() => ({ data: { user: null }, error: null })),
    },
  })),
  createServerClient: vi.fn(),
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))
