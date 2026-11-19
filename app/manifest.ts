import type { MetadataRoute } from 'next'
import { getContent } from '@/lib/content'

// Rend le portail installable (« Ajouter à l'écran d'accueil » sur Android/iOS,
// « Installer l'application » dans Chrome/Edge sur Windows, macOS et Linux).
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const content = await getContent().catch(() => null)
  const studio = content?.project.studio ?? 'Portail client'
  const accent = content?.project.accent ?? '#4f46e5'

  return {
    id: '/',
    name: `${studio} — Portail client`,
    short_name: studio.length > 14 ? 'Portail' : studio,
    description: 'Suivi de projet, livrables et factures.',
    lang: 'fr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#f6f6f4',
    theme_color: accent,
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Livrables', url: '/livrables' },
      { name: 'Factures', url: '/factures' },
      { name: 'Activité', url: '/activite' },
    ],
  }
}
