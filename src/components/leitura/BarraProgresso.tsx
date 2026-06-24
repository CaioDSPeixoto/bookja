'use client'

import { useEffect, useState } from 'react'

export default function BarraProgresso() {
  const [progresso, setProgresso] = useState(0)

  useEffect(() => {
    function handleScroll() {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgresso(h > 0 ? (window.scrollY / h) * 100 : 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
      <div
        className="h-full bg-indigo-600 transition-all duration-150"
        style={{ width: `${progresso}%` }}
      />
    </div>
  )
}
