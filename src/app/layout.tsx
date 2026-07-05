import type { Metadata, Viewport } from 'next'
import './globals.css'
import RegistrarServiceWorker from '@/components/pwa/RegistrarServiceWorker'

export const metadata: Metadata = {
  title: { default: 'Bookja', template: '%s · Bookja' },
  description: 'Leia, escreva e compartilhe histórias.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  appleWebApp: { capable: true, title: 'Bookja', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <RegistrarServiceWorker />
        {children}
      </body>
    </html>
  )
}
