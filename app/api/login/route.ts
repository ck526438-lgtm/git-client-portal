import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, cookieOptions, isConfigured, publicUrl, sign } from '@/lib/auth'

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 8
const attempts = new Map<string, { count: number; until: number }>()

export const dynamic = 'force-dynamic'

function tooManyAttempts(key: string): boolean {
  const now = Date.now()
  const record = attempts.get(key)
  if (!record || record.until < now) {
    attempts.set(key, { count: 1, until: now + WINDOW_MS })
    return false
  }
  record.count += 1
  return record.count > MAX_ATTEMPTS
}

function safeTarget(value: string, fallback: string): string {
  if (!value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}

function fail(request: NextRequest, reason: string, retour: string): NextResponse {
  const target = publicUrl(request, '/login')
  target.searchParams.set('error', reason)
  if (retour !== '/') target.searchParams.set('retour', retour)
  return NextResponse.redirect(target, { status: 303 })
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const provided = String(form?.get('motdepasse') ?? '')
  const retour = safeTarget(String(form?.get('retour') ?? ''), '/')
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'

  if (!isConfigured()) {
    return fail(request, 'configuration', retour)
  }

  if (tooManyAttempts(ip)) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return fail(request, 'trop_essais', retour)
  }

  if (provided !== process.env.PORTAL_PASSWORD) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return fail(request, 'motdepasse', retour)
  }

  attempts.delete(ip)
  const response = NextResponse.redirect(publicUrl(request, retour), { status: 303 })
  response.cookies.set(SESSION_COOKIE, await sign(provided), cookieOptions())
  return response
}
