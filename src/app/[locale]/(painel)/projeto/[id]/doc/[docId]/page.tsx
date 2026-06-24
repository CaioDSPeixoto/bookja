import { redirect } from 'next/navigation'

export default async function DocRedirectPage({ params }: { params: Promise<{ locale: string; id: string; docId: string }> }) {
  const { locale, id, docId } = await params
  redirect(`/${locale}/projeto/${id}/escrita?doc=${docId}`)
}
