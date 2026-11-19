import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, adminCookieOptions, publicUrl } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(publicUrl(request, '/admin/connexion?erreur=deconnecte'), { status: 303 })
  response.cookies.set(ADMIN_COOKIE, '', { ...adminCookieOptions(), maxAge: 0 })
  return response
}
