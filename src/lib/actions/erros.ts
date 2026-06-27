const MENSAGENS_PUBLICAS = new Set([
  'Autenticação necessária',
  'Comentário não encontrado',
  'Documento não encontrado',
  'Comentário inválido',
  'Conteúdo obrigatório',
  'Documento inválido',
  'Emoji inválido',
  'Nome de usuário obrigatório',
  'Nota inválida',
  'Papel de colaborador inválido',
  'Projeto não encontrado',
  'Projeto inválido',
  'Projeto não publicado',
  'Projeto precisa ter pelo menos um capítulo',
  'Sem permissão',
  'Usuário inválido',
  'Título obrigatório',
  'Usuário não encontrado',
])

export function erroPublico(mensagem: string): Error {
  return new Error(mensagem)
}

export function erroOperacao(mensagem: string): Error {
  return new Error(mensagem)
}

export function relancarErroPublico(error: unknown, mensagemPadrao: string): never {
  if (error instanceof Error && MENSAGENS_PUBLICAS.has(error.message)) {
    throw error
  }

  throw erroOperacao(mensagemPadrao)
}
