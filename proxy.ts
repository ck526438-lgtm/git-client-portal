import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, SESSION_COOKIE, isValidAdminToken, isValidToken } from './lib/auth'

const OPEN_PATHS = [
  '/login',
  '/api/login',
  '/api/health',
  '/robots.txt',
  // Fichiers nécessaires pour installer le portail en application avant connexion.
  '/manifest.webmanifest',
  '/sw.js',
  '/hors-ligne.html',
]
const OPEN_PREFIXES = ['/icons/']
const ADMIN_OPEN = ['/admin/connexion', '/api/admin/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (OPEN_PATHS.includes(pathname) || OPEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // L'éditeur a son propre mot de passe : le cookie du client n'y donne jamais accès.
  if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')) {
    if (ADMIN_OPEN.includes(pathname)) return NextResponse.next()
    if (await isValidAdminToken(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next()
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ ok: false, error: 'acces_refuse' }, { status: 401 })
    }
    const login = request.nextUrl.clone()
    login.pathname = '/admin/connexion'
    login.search = ''
    return NextResponse.redirect(login)
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (await isValidToken(token)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: 'acces_refuse' }, { status: 401 })
  }

  const login = request.nextUrl.clone()
  login.pathname = '/login'
  login.search = pathname === '/' ? '' : `?retour=${encodeURIComponent(pathname)}`
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
