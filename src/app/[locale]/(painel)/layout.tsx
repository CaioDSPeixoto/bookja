import { redirect } from 'next/navigation'
import { criarClienteServidor } from '@/lib/supabase/server'

export default async function PainelLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/entrar`)
  }

  return <>{children}</>
}
