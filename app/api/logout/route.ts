import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, cookieOptions, publicUrl } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const target = publicUrl(request, '/login')
  target.searchParams.set('error', 'deconnecte')
  const response = NextResponse.redirect(target, { status: 303 })
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions(), maxAge: 0 })
  return response
}
