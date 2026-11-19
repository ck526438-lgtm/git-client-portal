'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { InstallButton } from './app-install'
import { Icon, type IconName } from './icons'

const LINKS: { href: string; label: string; short?: string; icon: IconName }[] = [
  { href: '/', label: 'Avancement', short: 'Accueil', icon: 'home' },
  { href: '/activite', label: 'Activité', icon: 'activity' },
  { href: '/livrables', label: 'Livrables', icon: 'layers' },
  { href: '/factures', label: 'Factures', icon: 'receipt' },
  { href: '/documents', label: 'Documents', short: 'Guides', icon: 'book' },
  { href: '/application', label: 'Application', icon: 'device' },
]

interface Props {
  studio: string
  tagline: string
  projectTitle: string
  client: string
  reference: string
  target: string
  contactHref: string
  canSync: boolean
}

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

export default function PortalHeader({ studio, tagline, projectTitle, client, reference, target, contactHref, canSync }: Props) {
  const pathname = usePathname()
  const [theme, setTheme] = useState<string>('light')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || 'light')
  }, [])

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('portail-theme', next)
    } catch {
      /* stockage indisponible */
    }
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
    <>
      <header className="topbar">
        <a className="glass-pill brand-pill" href="/" aria-label={`${studio} — ${projectTitle}`}>
          <span className="mark-glyph" aria-hidden="true">
            {studio.slice(0, 1)}
          </span>
          <span className="brand-text">
            <span className="mark-name">{studio}</span>
            <span className="mark-role">{tagline}</span>
          </span>
        </a>

        <div className="glass-pill facts-pill" aria-label="Le dossier">
          <span className="fact">
            <span className="fact-label">
              <Icon name="pin" size={12} /> Client
            </span>
            <span className="fact-value">{client}</span>
          </span>
          {reference ? (
            <span className="fact">
              <span className="fact-label">
                <Icon name="folder" size={12} /> Dossier
              </span>
              <span className="fact-value">{reference}</span>
            </span>
          ) : null}
          {target ? (
            <span className="fact">
              <span className="fact-label">
                <Icon name="calendar" size={12} /> Livraison
              </span>
              <span className="fact-value">{target}</span>
            </span>
          ) : null}
        </div>

        <div className="glass-pill tools-pill">
          {syncMessage ? <span className="mono-note sync-note">{syncMessage}</span> : null}
          <InstallButton />
          {canSync ? (
            <button
              type="button"
              className="icon-btn"
              onClick={checkUpdates}
              disabled={syncing}
              aria-label="Vérifier les nouveautés"
              title="Vérifier les nouveautés"
            >
              <Icon name="refresh" />
            </button>
          ) : null}
          {contactHref ? (
            <a className="pill-link" href={contactHref}>
              Écrire <Icon name="arrow" size={15} />
            </a>
          ) : null}
        </div>
      </header>

      <nav className="dock" aria-label="Sections du portail">
        <div className="dock-group">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="dock-btn"
              data-active={isActive(pathname, link.href)}
              aria-current={isActive(pathname, link.href) ? 'page' : undefined}
              data-optional={link.href === '/application' ? 'true' : undefined}
            >
              <Icon name={link.icon} size={19} />
              <span className="dock-label">
                <span className="label-long">{link.label}</span>
                {link.short ? <span className="label-short">{link.short}</span> : null}
              </span>
            </a>
          ))}
        </div>

        <div className="dock-group dock-extra">
          <button
            type="button"
            className="dock-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
            <span className="dock-label">{theme === 'dark' ? 'Clair' : 'Sombre'}</span>
          </button>
          <form method="post" action="/api/logout">
            <button type="submit" className="dock-btn" aria-label="Quitter le portail">
              <Icon name="logout" size={19} />
              <span className="dock-label">Quitter</span>
            </button>
          </form>
        </div>
      </nav>
    </>
  )
}
