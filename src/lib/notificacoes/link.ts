type NotificacaoLink = {
  tipo: string
  projeto_id: string | null
  documento_id: string | null
}

/**
 * Destino de uma notificação ao ser clicada.
 * Convite não tem link direto (o projeto pode não ser acessível antes do aceite;
 * a aceitação é feita pelo próprio botão da notificação).
 */
export function hrefNotificacao(n: NotificacaoLink, locale: string): string | null {
  if (n.tipo === 'convite') return null
  if (n.projeto_id && n.documento_id) return `/${locale}/historia/${n.projeto_id}/ler/${n.documento_id}`
  if (n.projeto_id) return `/${locale}/historia/${n.projeto_id}`
  return null
}
