'use client'

import { useEffect, useState } from 'react'

export default function TimeAgo({ date }: { date: string }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    const then = new Date(`${date}T12:00:00Z`).getTime()
    if (Number.isNaN(then)) return
    const days = Math.floor((Date.now() - then) / 86_400_000)
    const value =
      days <= 0 ? "aujourd'hui" : days === 1 ? 'hier' : days < 7 ? `il y a ${days} jours` : days < 31 ? `il y a ${Math.floor(days / 7)} semaine${days >= 14 ? 's' : ''}` : `il y a ${Math.floor(days / 30)} mois`
    setLabel(value)
  }, [date])

  if (!label) return null
  return <span className="mono-note"> · {label}</span>
}
