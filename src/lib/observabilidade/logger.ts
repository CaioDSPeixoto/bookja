type ValorContexto = string | number | boolean | null

type ContextoLog = Record<string, unknown>

const CHAVES_SENSIVEIS = [
  'authorization',
  'cookie',
  'key',
  'secret',
  'senha',
  'token',
]

function chaveSensivel(chave: string): boolean {
  const chaveNormalizada = chave.toLowerCase()
  return CHAVES_SENSIVEIS.some((trecho) => chaveNormalizada.includes(trecho))
}

function valorContexto(valor: unknown): ValorContexto {
  if (valor === null) return null

  if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') {
    return valor
  }

  return String(valor)
}

function sanitizarContexto(contexto: ContextoLog = {}): Record<string, ValorContexto> {
  return Object.fromEntries(
    Object.entries(contexto).map(([chave, valor]) => [
      chave,
      chaveSensivel(chave) ? '[redigido]' : valorContexto(valor),
    ]),
  )
}

function serializarErro(error: unknown): Record<string, ValorContexto> {
  if (error instanceof Error) {
    return {
      nome: error.name,
      mensagem: error.message,
      stack: error.stack ?? null,
    }
  }

  return {
    nome: 'ErroDesconhecido',
    mensagem: valorContexto(error),
    stack: null,
  }
}

export function registrarErroInterno(
  escopo: string,
  error: unknown,
  contexto: ContextoLog = {},
): void {
  if (process.env.NODE_ENV === 'test') return

  const payload = {
    nivel: 'error',
    escopo,
    contexto: sanitizarContexto(contexto),
    erro: serializarErro(error),
  }

  console.error(JSON.stringify(payload))
}
