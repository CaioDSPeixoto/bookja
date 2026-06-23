import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLockEdicao } from '@/hooks/useLockEdicao'

const mockAdquirir = vi.fn()
const mockLiberar = vi.fn()
const mockRenovar = vi.fn()

vi.mock('@/lib/lock/actions', () => ({
  adquirirLock: (...args: unknown[]) => mockAdquirir(...args),
  liberarLock: (...args: unknown[]) => mockLiberar(...args),
  renovarLock: (...args: unknown[]) => mockRenovar(...args),
}))

describe('useLockEdicao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdquirir.mockResolvedValue({ sucesso: true })
    mockLiberar.mockResolvedValue(undefined)
    mockRenovar.mockResolvedValue({ sucesso: true })
    Object.defineProperty(navigator, 'sendBeacon', { value: vi.fn(), writable: true })
  })

  it('adquire lock ao montar', async () => {
    const { result } = renderHook(() => useLockEdicao('doc-1'))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(mockAdquirir).toHaveBeenCalledWith('doc-1')
    expect(result.current.travado).toBe(true)
    expect(result.current.somenteLeitura).toBe(false)
  })

  it('seta somenteLeitura quando lock pertence a outro user', async () => {
    mockAdquirir.mockResolvedValue({ sucesso: false, travadoPor: 'fulano' })

    const { result } = renderHook(() => useLockEdicao('doc-2'))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.somenteLeitura).toBe(true)
    expect(result.current.travadoPor).toBe('fulano')
    expect(result.current.travado).toBe(false)
  })

  it('libera lock ao desmontar', async () => {
    const { result, unmount } = renderHook(() => useLockEdicao('doc-4'))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    unmount()

    // liberarLock é chamado no cleanup do useEffect
    await waitFor(() => {
      expect(mockLiberar).toHaveBeenCalledWith('doc-4')
    })
  })

  it('registra listener de beforeunload', async () => {
    const addEventSpy = vi.spyOn(window, 'addEventListener')

    const { result } = renderHook(() => useLockEdicao('doc-5'))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(addEventSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    addEventSpy.mockRestore()
  })
})
