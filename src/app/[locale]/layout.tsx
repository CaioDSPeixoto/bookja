import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import Cabecalho from '@/components/layout/Cabecalho'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Bookja',
  description: 'Descubra e compartilhe histórias incríveis',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <Cabecalho />
          <main className="min-h-screen pt-16">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
