'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Icon } from './icons'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __portailInstall?: InstallPromptEvent | null
  }
}

const APP_UA = /PortailClientApp\/(\w+)/

/** Plateforme de l'application native qui affiche le portail, ou null dans un navigateur. */
export function nativeShell(): string | null {
  if (typeof navigator === 'undefined') return null
  return APP_UA.exec(navigator.userAgent)?.[1] ?? null
}

/** Adresse de l'écran « Mes portails » de l'application native. */
export function shellHome(platform: string): string {
  if (platform === 'android') return 'https://localhost/?choisir=1'
  if (platform === 'ios') return 'capacitor://localhost/?choisir=1'
  return 'portail-app://accueil'
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    nativeShell() !== null
  )
}

/** Enregistre le service worker et capte l'invitation d'installation du navigateur. */
export function AppRuntime() {
  const pathname = usePathname()

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      window.__portailInstall = event as InstallPromptEvent
      window.dispatchEvent(new Event('portail-installable'))
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Sur l'écran de connexion, on efface les pages gardées pour le hors-ligne.
        if (pathname === '/login') {
          ;(navigator.serviceWorker.controller || registration.active)?.postMessage('vider-cache')
        }
      })
      .catch(() => undefined)
  }, [pathname])

  return null
}

/** Bouton d'en-tête : « Installer » dans un navigateur, « Mes portails » dans l'appli native. */
export function InstallButton() {
  const [mode, setMode] = useState<'hidden' | 'prompt' | 'guide' | 'shell'>('hidden')
  const [shell, setShell] = useState<string | null>(null)

  useEffect(() => {
    const platform = nativeShell()
    if (platform) {
      setShell(platform)
      setMode('shell')
      return
    }
    if (isStandalone()) return
    setMode(window.__portailInstall ? 'prompt' : 'guide')
    const ready = () => setMode('prompt')
    const done = () => setMode('hidden')
    window.addEventListener('portail-installable', ready)
    window.addEventListener('appinstalled', done)
    return () => {
      window.removeEventListener('portail-installable', ready)
      window.removeEventListener('appinstalled', done)
    }
  }, [])

  async function install() {
    const prompt = window.__portailInstall
    if (!prompt) {
      window.location.href = '/application'
      return
    }
    await prompt.prompt()
    const choice = await prompt.userChoice.catch(() => null)
    window.__portailInstall = null
    setMode(choice?.outcome === 'accepted' ? 'hidden' : 'guide')
  }

  if (mode === 'hidden') return null

  if (mode === 'shell' && shell) {
    return (
      <a className="icon-btn" href={shellHome(shell)} title="Mes portails" aria-label="Revenir à la liste de vos portails">
        <Icon name="grid" />
      </a>
    )
  }

  if (mode === 'guide') {
    return (
      <a className="icon-btn" href="/application" title="Installer l’application" aria-label="Installer le portail sur cet appareil">
        <Icon name="download" />
      </a>
    )
  }

  return (
    <button type="button" className="icon-btn" onClick={install} title="Installer l’application" aria-label="Installer le portail sur cet appareil">
      <Icon name="download" />
    </button>
  )
}

/** Bouton d'installation directe pour la page /application. */
export function InstallNow() {
  const [available, setAvailable] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    setInstalled(isStandalone())
    setAvailable(Boolean(window.__portailInstall))
    const ready = () => setAvailable(true)
    const done = () => setInstalled(true)
    window.addEventListener('portail-installable', ready)
    window.addEventListener('appinstalled', done)
    return () => {
      window.removeEventListener('portail-installable', ready)
      window.removeEventListener('appinstalled', done)
    }
  }, [])

  if (installed) {
    return <div className="alert" data-tone="info">Le portail est déjà ouvert comme application sur cet appareil.</div>
  }
  if (!available) return null

  return (
    <button
      type="button"
      className="btn primary"
      onClick={async () => {
        await window.__portailInstall?.prompt()
        window.__portailInstall = null
        setAvailable(false)
      }}
    >
      Installer maintenant
    </button>
  )
}

/** Affiche l'adresse du portail à saisir dans l'application native, avec copie. */
export function PortalAddress() {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => setOrigin(window.location.origin), [])

  return (
    <div className="address-box">
      <code>{origin || '…'}</code>
      <button
        type="button"
        className="btn ghost small"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(origin)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            setCopied(false)
          }
        }}
      >
        {copied ? 'Copiée' : 'Copier'}
      </button>
    </div>
  )
}
