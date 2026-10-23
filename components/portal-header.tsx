'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Avancement' },
  { href: '/activite', label: 'Activité' },
  { href: '/livrables', label: 'Livrables' },
  { href: '/factures', label: 'Factures' },
  { href: '/documents', label: 'Documents' },
]

interface Props {
  studio: string
  tagline: string
  projectTitle: string
  canSync: boolean
}

export default function PortalHeader({ studio, tagline, projectTitle, canSync }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [theme, setTheme] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('portail-theme', next)
    setTheme(next)
  }

  async function checkUpdates() {
    setSyncing(true)
    setSyncMessage('')
    try {
      const response = await fetch('/api/redeploy', { method: 'POST' })
      const data = await response.json()
      setSyncMessage(data.ok ? 'Nouvelle version demandée…' : data.error || 'Déjà à jour')
      if (data.ok) setTimeout(() => window.location.reload(), 6000)
    } catch {
      setSyncMessage('Réponse impossible')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <header className="masthead">
      <div className="masthead-in">
        <a className="mark" href="/" aria-label={projectTitle}>
          <span className="mark-glyph" aria-hidden="true">
            {studio.slice(0, 1)}
          </span>
          <span>
            <span className="mark-name">{studio}</span>
            <br />
            <span className="mark-role">{tagline}</span>
          </span>
        </a>

        <nav className="nav" aria-label="Sections du portail">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} data-active={link.href === pathname}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="masthead-tools">
          {syncMessage ? <span className="mono-note">{syncMessage}</span> : null}
          {canSync ? (
            <button type="button" className="btn ghost small" onClick={checkUpdates} disabled={syncing}>
              {syncing ? 'Vérification…' : 'Actualiser'}
            </button>
          ) : null}
          <button
            type="button"
            className="btn ghost small"
            onClick={toggleTheme}
            aria-label="Changer de thème"
            title="Thème clair ou sombre"
          >
            {theme === 'dark' ? 'Clair' : 'Sombre'}
          </button>
          <form method="post" action="/api/logout" style={{ display: 'inline' }}>
            <button type="submit" className="btn ghost small">
              Quitter
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
