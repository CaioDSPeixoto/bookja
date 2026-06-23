'use client'

import { Printer } from 'lucide-react'

export default function BotaoImprimir({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
    >
      <Printer size={16} />
      {label}
    </button>
  )
}
