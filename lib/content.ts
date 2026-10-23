import type { Content } from './types'

async function fromDisk(): Promise<Content> {
  const { buildContent } = await import('./content-io.mjs')
  return buildContent(process.cwd())
}

let cached: Content | null = null

export async function getContent(): Promise<Content> {
  if (process.env.NODE_ENV === 'production') {
    if (cached) return cached
    try {
      const module = await import('../generated/content.json')
      cached = (module.default ?? module) as unknown as Content
    } catch {
      // Le JSON est absent (build lancé à la main) : on relit le dépôt directement.
      cached = await fromDisk()
    }
    return cached as Content
  }
  return fromDisk()
}
