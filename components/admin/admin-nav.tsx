'use client'

import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '../icons'

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/admin', label: 'Tableau de bord', icon: 'home' },
  { href: '/admin/nouvelles', label: 'Nouvelles', icon: 'activity' },
  { href: '/admin/livrables', label: 'Livrables', icon: 'layers' },
  { href: '/admin/factures', label: 'Factures', icon: 'receipt' },
  { href: '/admin/planning', label: 'Planning', icon: 'calendar' },
  { href: '/admin/projet', label: 'Projet', icon: 'folder' },
]

export default function AdminNav({ studio }: { studio: string }) {
  const pathname = usePathname()
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

  return (
    <header className="topbar admin-topbar">
      <a className="glass-pill brand-pill" href="/admin">
        <span className="mark-glyph" aria-hidden="true">
          {studio.slice(0, 1)}
        </span>
        <span className="brand-text">
          <span className="mark-name">{studio}</span>
          <span className="mark-role">Éditeur du portail</span>
        </span>
      </a>

      <nav className="glass-pill admin-nav" aria-label="Sections de l'éditeur">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} data-active={active(link.href)} aria-current={active(link.href) ? 'page' : undefined}>
            <Icon name={link.icon} size={16} />
            <span>{link.label}</span>
          </a>
        ))}
      </nav>

      <div className="glass-pill tools-pill">
        <a className="pill-link" href="/" target="_blank" rel="noopener">
          Voir le portail <Icon name="arrow" size={15} />
        </a>
        <form method="post" action="/api/admin/logout">
          <button type="submit" className="icon-btn" aria-label="Se déconnecter de l'éditeur" title="Se déconnecter">
            <Icon name="logout" />
          </button>
        </form>
      </div>
    </header>
  )
}
