'use client'

import { Star } from 'lucide-react'

interface EstrelasProps {
  valor: number
  onChange?: (valor: number) => void
  tamanho?: number
}

export function Estrelas({ valor, onChange, tamanho = 16 }: EstrelasProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          className={onChange ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
        >
          <Star
            size={tamanho}
            className={i <= valor ? 'text-yellow-500' : 'text-gray-300'}
            fill={i <= valor ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  )
}
