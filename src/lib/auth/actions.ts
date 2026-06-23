'use server'

import { criarClienteServidor } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function sair(locale: string) {
  const supabase = await criarClienteServidor()
  await supabase.auth.signOut()
  redirect(`/${locale}`)
}
