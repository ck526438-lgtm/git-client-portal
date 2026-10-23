import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, isValidToken } from './lib/auth'

const OPEN_PATHS = ['/login', '/api/login', '/api/health', '/robots.txt']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (OPEN_PATHS.includes(pathname)) {
    return NextResponse.next()
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
