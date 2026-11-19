import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, adminCookieOptions, isAdminConfigured, isValidAdminToken, publicUrl, signAdmin } from '@/lib/auth'

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 6
const attempts = new Map<string, { count: number; until: number }>()

export const dynamic = 'force-dynamic'

function tooManyAttempts(key: string): boolean {
  const now = Date.now()
  if (attempts.size > 5000) for (const [ip, entry] of attempts) if (entry.until < now) attempts.delete(ip)
  const record = attempts.get(key)
  if (!record || record.until < now) {
    attempts.set(key, { count: 1, until: now + WINDOW_MS })
    return false
  }
  record.count += 1
  return record.count > MAX_ATTEMPTS
}

function back(request: NextRequest, error: string) {
  const target = publicUrl(request, '/admin/connexion')
  target.searchParams.set('erreur', error)
  return NextResponse.redirect(target, { status: 303 })
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const provided = String(form?.get('motdepasse') ?? '')
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'

  if (!isAdminConfigured()) return back(request, 'configuration')
  if (tooManyAttempts(ip)) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return back(request, 'trop_essais')
  }
  if (!(await isValidAdminToken(await signAdmin(provided)))) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return back(request, 'motdepasse')
  }

  attempts.delete(ip)
  const response = NextResponse.redirect(publicUrl(request, '/admin'), { status: 303 })
  response.cookies.set(ADMIN_COOKIE, await signAdmin(provided), adminCookieOptions())
  return response
}
