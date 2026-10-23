import { NextResponse } from 'next/server'

const COOLDOWN_MS = 60_000
let lastTrigger = 0

export const dynamic = 'force-dynamic'

// Le dépôt ne se pousse pas tout seul : ce routeur déclenche le rebuild de l'hébergeur
// (Vercel « Deploy Hook » ou Netlify « Build hook ») pour publier un commit déjà poussé.
export async function POST() {
  const hook = process.env.REDEPLOY_HOOK_URL
  if (!hook) {
    return NextResponse.json({ ok: false, error: 'Publication manuelle uniquement' }, { status: 200 })
  }
  if (Date.now() - lastTrigger < COOLDOWN_MS) {
    return NextResponse.json({ ok: false, error: 'Patientez une minute' }, { status: 200 })
  }
  lastTrigger = Date.now()

  try {
    const response = await fetch(hook, { method: 'POST' })
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "L'hébergeur n'a pas répondu" }, { status: 200 })
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'Publication impossible' }, { status: 200 })
  }

  return NextResponse.json({ ok: true, message: 'Rebuild demande' })
}
