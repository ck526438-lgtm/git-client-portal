import { NextResponse } from 'next/server'
import { isConfigured } from '@/lib/auth'
import { getContent } from '@/lib/content'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const content = await getContent()
    return NextResponse.json({
      ok: true,
      projet: content.project.title,
      auth_configured: isConfigured(),
      sync_configured: Boolean(process.env.REDEPLOY_HOOK_URL),
      publications: content.updates.length,
      livrables: content.deliverables.length,
      factures: content.invoices.length,
      etapes: `${content.stats.milestones_done}/${content.stats.milestones_total}`,
      avance: `${content.stats.overall}%`,
      genere_le: content.meta.built_at,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, erreur: (error as Error).message }, { status: 500 })
  }
}
