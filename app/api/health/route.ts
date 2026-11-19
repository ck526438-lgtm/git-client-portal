import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, isConfigured, isValidToken } from '@/lib/auth'
import { getContent } from '@/lib/content'
import { APP_ID, APP_VERSION } from '@/lib/app-info'

export const dynamic = 'force-dynamic'

// Ouvert à tous (y compris aux applications Windows, macOS, Linux, Android et iOS
// qui vérifient qu'une adresse est bien un portail) : la réponse publique ne
// contient AUCUNE donnée du projet. Le détail n'est servi qu'après connexion.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(request: NextRequest) {
  try {
    const content = await getContent()
    const base = { ok: true, app: APP_ID, version: APP_VERSION, auth_configured: isConfigured() }

    const token = request.cookies.get(SESSION_COOKIE)?.value
    if (!(await isValidToken(token))) {
      return NextResponse.json(base, { headers: CORS })
    }

    return NextResponse.json(
      {
        ...base,
        projet: content.project.title,
        sync_configured: Boolean(process.env.REDEPLOY_HOOK_URL),
        publications: content.updates.length,
        livrables: content.deliverables.length,
        factures: content.invoices.length,
        etapes: `${content.stats.milestones_done}/${content.stats.milestones_total}`,
        avance: `${content.stats.overall}%`,
        genere_le: content.meta.built_at,
      },
      { headers: CORS },
    )
  } catch {
    return NextResponse.json({ ok: false, app: APP_ID, erreur: 'contenu_invalide' }, { status: 500, headers: CORS })
  }
}
