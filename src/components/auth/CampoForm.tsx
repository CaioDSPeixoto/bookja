'use client'

import type { InputHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  icone: LucideIcon
  ajuda?: string
}

export default function CampoForm({ id, label, icone: Icone, ajuda, ...rest }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <Icone
          className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          id={id}
          {...rest}
          className="w-full rounded-lg border border-gray-300 bg-gray-50/60 py-2.5 pl-10 pr-3 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>
      {ajuda && <p className="mt-1 text-xs text-gray-500">{ajuda}</p>}
    </div>
  )
}
