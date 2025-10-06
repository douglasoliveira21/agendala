import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Teste WhatsApp QR',
  description: 'Página de teste para QR code do WhatsApp',
}

export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}