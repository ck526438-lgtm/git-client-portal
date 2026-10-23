import type { ReactNode } from 'react'
import type { Tone } from '@/lib/format'

export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className="pill" data-tone={tone}>
      {children}
    </span>
  )
}

export function Bar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | Tone }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div className="bar" data-tone={tone === 'accent' ? undefined : tone} role="img" aria-label={`${width} % avance`}>
      <span style={{ width: `${width}%` }} />
    </div>
  )
}

export function Stat({ label, value, foot }: { label: string; value: ReactNode; foot?: ReactNode }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {foot ? <div className="stat-foot">{foot}</div> : null}
    </div>
  )
}

export function Panel({
  title,
  note,
  action,
  children,
}: {
  title: string
  note?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="card card-pad">
      <div className="panel-title">
        <h2>{title}</h2>
        {note ? <span className="panel-note">{note}</span> : null}
        {action}
      </div>
      {children}
    </section>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}
