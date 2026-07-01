import type { Json } from '@/types/database'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validarUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && UUID_REGEX.test(valor)
}

export function eRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

export function eJson(valor: unknown): valor is Json {
  // undefined é tratado como ausente (é descartado na serialização JSON). Isso
  // evita rejeitar conteúdo do editor TipTap, que pode ter atributos undefined
  // (ex.: capítulos importados) — antes quebrava o autosave com 500.
  if (valor === null || valor === undefined) return true

  switch (typeof valor) {
    case 'string':
    case 'boolean':
      return true
    case 'number':
      return Number.isFinite(valor)
    case 'object':
      if (Array.isArray(valor)) return valor.every((item) => eJson(item))
      return Object.values(valor).every((item) => eJson(item))
    default:
      return false
  }
}
