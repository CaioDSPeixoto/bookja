import { describe, it, expect, vi } from 'vitest'

// Mock env vars
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

// Reset module registry para pegar as env vars mockadas
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn((url: string, key: string) => ({
    url,
    key,
    auth: { signInWithPassword: vi.fn() },
  })),
}))

describe('Supabase Client (Browser)', () => {
  it('criarClienteBrowser retorna instância do client', async () => {
    const { criarClienteBrowser } = await import('@/lib/supabase/client')
    const client = criarClienteBrowser()
    expect(client).toBeDefined()
    expect(client).toHaveProperty('auth')
  })
})
