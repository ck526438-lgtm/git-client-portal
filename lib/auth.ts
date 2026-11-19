export const SESSION_COOKIE = 'portail_acces'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30

export function isConfigured(): boolean {
  return typeof process.env.PORTAL_PASSWORD === 'string' && process.env.PORTAL_PASSWORD.length >= 6
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function sign(password: string): Promise<string> {
  const secret = process.env.PORTAL_SECRET || process.env.PORTAL_PASSWORD || ''
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`portail:${password}`))
  return hex(signature)
}

function equals(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return diff === 0
}

export async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!isConfigured() || !token) return false
  const expected = await sign(process.env.PORTAL_PASSWORD as string)
  return equals(token, expected)
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}

// L'hôte vu par le client vient des en-têtes du proxy : sinon une redirection
// pointerait sur l'hôte interne du runtime serverless.
export function publicUrl(request: Request, path: string): URL {
  const host =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host') ||
    'localhost:3000'
  const local = /^localhost|^127\./.test(host)
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || (local ? 'http' : 'https')
  return new URL(`${proto}://${host}${path}`)
}

// ---------- Accès éditeur (/admin) ----------
// Mot de passe distinct de celui du client : un client connecté au portail n'a
// jamais accès à l'éditeur.

export const ADMIN_COOKIE = 'portail_editeur'
export const ADMIN_MAX_AGE = 60 * 60 * 12

export function isAdminConfigured(): boolean {
  const value = process.env.ADMIN_PASSWORD
  return typeof value === 'string' && value.length >= 8 && value !== process.env.PORTAL_PASSWORD
}

export async function signAdmin(password: string): Promise<string> {
  return sign(`editeur:${password}`)
}

export async function isValidAdminToken(token: string | undefined): Promise<boolean> {
  if (!isAdminConfigured() || !token) return false
  const expected = await signAdmin(process.env.ADMIN_PASSWORD as string)
  return equals(token, expected)
}

export function adminCookieOptions() {
  return { ...cookieOptions(), maxAge: ADMIN_MAX_AGE }
}
