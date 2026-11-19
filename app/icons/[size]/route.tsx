import { ImageResponse } from 'next/og'
import { getContent } from '@/lib/content'

// Icônes de l'application générées au build à partir de la marque du studio :
// l'initiale du studio sur la couleur d'accent de project.yaml.
const VARIANTS: Record<string, { size: number; padding: number; radius: number }> = {
  '180': { size: 180, padding: 0, radius: 0 }, // apple-touch-icon (iOS arrondit lui-même)
  '192': { size: 192, padding: 0, radius: 40 },
  '512': { size: 512, padding: 0, radius: 108 },
  'maskable-512': { size: 512, padding: 0, radius: 0 }, // zone de sécurité gérée par la taille du texte
}

export const dynamic = 'force-static'

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((size) => ({ size }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params
  const variant = VARIANTS[size]
  if (!variant) return new Response('Introuvable', { status: 404 })

  const content = await getContent().catch(() => null)
  const studio = content?.project.studio ?? 'Portail'
  const accent = content?.project.accent ?? '#4f46e5'
  const letter = (studio.trim()[0] ?? 'P').toUpperCase()
  const maskable = size.startsWith('maskable')
  const fontSize = Math.round(variant.size * (maskable ? 0.42 : 0.56))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: accent,
          borderRadius: variant.radius,
          color: '#ffffff',
          fontSize,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        {letter}
      </div>
    ),
    { width: variant.size, height: variant.size },
  )
}
