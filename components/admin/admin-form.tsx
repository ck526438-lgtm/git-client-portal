'use client'

import { useState, useTransition, type FormEvent, type ReactNode } from 'react'
import type { ActionResult } from '@/app/admin/actions'

interface Props {
  action: (form: FormData) => Promise<ActionResult>
  children: ReactNode
  submitLabel?: string
  pendingLabel?: string
  confirm?: string
  className?: string
  tone?: 'primary' | 'danger' | 'ghost'
  inline?: boolean
}

/**
 * Formulaire de l'éditeur : appelle l'action serveur sans réinitialiser les champs,
 * affiche l'erreur de validation au-dessus du bouton et garde la saisie intacte.
 */
export default function AdminForm({
  action,
  children,
  submitLabel = 'Enregistrer',
  pendingLabel = 'Enregistrement…',
  confirm,
  className,
  tone = 'primary',
  inline = false,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (confirm && !window.confirm(confirm)) return
    const data = new FormData(event.currentTarget)
    setError('')
    startTransition(async () => {
      const result = await action(data)
      if (result && !result.ok) setError(result.error || 'Enregistrement impossible.')
    })
  }

  const button = (
    <button type="submit" className={`btn ${tone === 'ghost' ? 'ghost' : tone === 'danger' ? 'danger' : 'primary'}`} disabled={pending}>
      {pending ? pendingLabel : submitLabel}
    </button>
  )

  if (inline) {
    return (
      <form onSubmit={onSubmit} className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {children}
        {button}
        {error ? (
          <span className="mono-note" role="alert" style={{ color: 'var(--bad)' }}>
            {error}
          </span>
        ) : null}
      </form>
    )
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
      {error ? (
        <div className="alert" data-tone="bad" role="alert" style={{ marginTop: 18 }}>
          {error}
        </div>
      ) : null}
      <div className="form-actions">{button}</div>
    </form>
  )
}
