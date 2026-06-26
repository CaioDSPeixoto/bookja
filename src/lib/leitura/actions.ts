import { criarClienteServidor } from '@/lib/supabase/server'

export async function registrarLeituraAtual(projetoId: string, documentoId: string) {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from('leitura_atual')
    .upsert({
      usuario_id: user.id,
      projeto_id: projetoId,
      ultimo_documento_id: documentoId,
      atualizado_em: new Date().toISOString(),
    })
}
