'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_COOKIE, isValidAdminToken } from '@/lib/auth'
import {
  KIND_LABEL,
  deleteEntry,
  loadEntry,
  loadProject,
  saveEntry,
  saveMilestones,
  saveProject,
  slugify,
  type Kind,
} from '@/lib/admin/content'
import { StoreError, getStore } from '@/lib/admin/store'

export interface ActionResult {
  ok: boolean
  error?: string
}

const KINDS: Kind[] = ['updates', 'deliverables', 'invoices']

async function guard() {
  const jar = await cookies()
  if (!(await isValidAdminToken(jar.get(ADMIN_COOKIE)?.value))) throw new StoreError('Session expirée : reconnectez-vous.')
  const store = getStore()
  if (!store) throw new StoreError('L’éditeur n’est pas relié à GitHub (variables GITHUB_TOKEN et GITHUB_REPO).')
  return store
}

function str(form: FormData, key: string, max = 2000): string {
  return String(form.get(key) ?? '').trim().slice(0, max)
}

function num(form: FormData, key: string): number | '' {
  const value = str(form, key).replace(/\s/g, '').replace(',', '.')
  if (value === '') return ''
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : ''
}

function rows(form: FormData, key: string): Record<string, string>[] {
  try {
    const data = JSON.parse(String(form.get(key) ?? '[]'))
    return Array.isArray(data) ? data.filter((row) => row && typeof row === 'object') : []
  } catch {
    return []
  }
}

function failure(error: unknown): ActionResult {
  if (error instanceof StoreError) return { ok: false, error: error.message }
  // Les redirections de Next.js doivent remonter telles quelles.
  if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw error
  console.error(error)
  return { ok: false, error: 'Erreur inattendue. Réessayez dans un instant.' }
}

function dataFor(kind: Kind, form: FormData): { data: Record<string, unknown>; hint: string } {
  if (kind === 'updates') {
    const date = str(form, 'date', 10)
    const title = str(form, 'title', 160)
    return {
      hint: `${date}-${title}`,
      data: { date, title, kind: str(form, 'kind', 20), milestone: str(form, 'milestone', 60), summary: str(form, 'summary', 300) },
    }
  }
  if (kind === 'deliverables') {
    const title = str(form, 'title', 160)
    const files = rows(form, 'files')
      .map((row) => ({ label: String(row.label ?? '').trim(), url: String(row.url ?? '').trim(), kind: String(row.kind ?? '').trim() }))
      .filter((row) => row.label || row.url)
      .map((row) => (row.kind ? row : { label: row.label, url: row.url }))
    return {
      hint: title,
      data: {
        title,
        kind: str(form, 'kind', 40),
        status: str(form, 'status', 20),
        version: str(form, 'version', 20),
        date: str(form, 'date', 10),
        milestone: str(form, 'milestone', 60),
        summary: str(form, 'summary', 300),
        ...(files.length ? { files } : {}),
      },
    }
  }
  const number = str(form, 'number', 40)
  const lines = rows(form, 'lines')
    .map((row) => ({
      label: String(row.label ?? '').trim(),
      quantity: Number(String(row.quantity ?? '1').replace(',', '.')) || 1,
      unit_price: Number(String(row.unit_price ?? '').replace(/\s/g, '').replace(',', '.')),
    }))
    .filter((row) => row.label)
  return {
    hint: number,
    data: {
      number,
      status: str(form, 'status', 20),
      issued_on: str(form, 'issued_on', 10),
      due_on: str(form, 'due_on', 10),
      paid_on: str(form, 'status') === 'paid' ? str(form, 'paid_on', 10) || new Date().toISOString().slice(0, 10) : '',
      currency: str(form, 'currency', 8).toUpperCase(),
      tax_rate: num(form, 'tax_rate'),
      reference: str(form, 'reference', 60),
      lines,
    },
  }
}

export async function saveEntryAction(form: FormData): Promise<ActionResult> {
  const kind = str(form, 'kindName') as Kind
  if (!KINDS.includes(kind)) return { ok: false, error: 'Type de contenu inconnu.' }
  let slug = ''
  try {
    const store = await guard()
    const { data, hint } = dataFor(kind, form)
    if (kind === 'invoices' && Array.isArray(data.lines) && data.lines.length === 0) {
      return { ok: false, error: 'Ajoutez au moins une ligne à la facture.' }
    }
    slug = await saveEntry(store, kind, {
      slug: str(form, 'slug', 80) || undefined,
      sha: str(form, 'sha', 100) || undefined,
      data,
      body: str(form, 'body', 20000),
      slugHint: hint,
    })
  } catch (error) {
    return failure(error)
  }
  redirect(`/admin/${KIND_LABEL[kind].path}?ok=${encodeURIComponent(slug)}`)
}

export async function deleteEntryAction(form: FormData): Promise<ActionResult> {
  const kind = str(form, 'kindName') as Kind
  if (!KINDS.includes(kind)) return { ok: false, error: 'Type de contenu inconnu.' }
  try {
    const store = await guard()
    await deleteEntry(store, kind, str(form, 'slug', 80), str(form, 'sha', 100))
  } catch (error) {
    return failure(error)
  }
  redirect(`/admin/${KIND_LABEL[kind].path}?supprime=1`)
}

export async function markPaidAction(form: FormData): Promise<ActionResult> {
  try {
    const store = await guard()
    const slug = str(form, 'slug', 80)
    const entry = await loadEntry(store, 'invoices', slug)
    if (!entry) return { ok: false, error: 'Facture introuvable.' }
    await saveEntry(store, 'invoices', {
      slug,
      sha: entry.sha,
      data: { ...entry.data, status: 'paid', paid_on: new Date().toISOString().slice(0, 10) },
      body: entry.body,
      slugHint: slug,
    })
  } catch (error) {
    return failure(error)
  }
  redirect('/admin/factures?ok=payee')
}

export async function saveMilestonesAction(form: FormData): Promise<ActionResult> {
  try {
    const store = await guard()
    const used = new Set<string>()
    const items = rows(form, 'milestones')
      .filter((row) => String(row.title ?? '').trim())
      .map((row) => {
        let id = slugify(String(row.id || row.title)).slice(0, 40) || 'etape'
        for (let index = 2; used.has(id); index += 1) id = `${slugify(String(row.title)).slice(0, 36)}-${index}`
        used.add(id)
        const progress = Math.max(0, Math.min(100, Math.round(Number(row.progress) || 0)))
        return {
          id,
          title: String(row.title).trim().slice(0, 160),
          status: String(row.status || 'planned') as 'done' | 'active' | 'planned' | 'blocked',
          progress: row.status === 'done' ? 100 : progress,
          start: String(row.start ?? ''),
          due: String(row.due ?? ''),
          summary: String(row.summary ?? '').trim().slice(0, 400),
        }
      })
    await saveMilestones(store, items, str(form, 'sha', 100))
  } catch (error) {
    return failure(error)
  }
  redirect('/admin/planning?ok=1')
}

export async function saveProjectAction(form: FormData): Promise<ActionResult> {
  try {
    const store = await guard()
    const { raw, sha } = await loadProject(store)
    const set = (target: Record<string, unknown>, key: string, value: unknown) => {
      if (value === '' || value === undefined) delete target[key]
      else target[key] = value
    }
    raw.branding = raw.branding && typeof raw.branding === 'object' ? raw.branding : {}
    raw.project = raw.project && typeof raw.project === 'object' ? raw.project : {}
    for (const key of ['studio', 'tagline', 'accent', 'cover']) set(raw.branding, key, str(form, key, 300))
    for (const key of ['title', 'client', 'contact', 'reference', 'summary', 'started_on', 'target_on']) {
      set(raw.project, key, str(form, key, 600))
    }
    raw.status = str(form, 'status', 20) || 'active'
    raw.contact = { ...(raw.contact ?? {}) }
    set(raw.contact, 'email', str(form, 'email', 120))
    raw.support = { ...(raw.support ?? {}) }
    set(raw.support, 'hours', str(form, 'hours', 120))
    set(raw.support, 'note', str(form, 'note', 300))
    raw.billing = { ...(raw.billing ?? {}) }
    for (const key of ['legal', 'vat', 'iban', 'terms', 'penalty']) set(raw.billing, key, str(form, key, 200))
    raw.team = rows(form, 'team')
      .map((row) => ({ name: String(row.name ?? '').trim(), role: String(row.role ?? '').trim(), email: String(row.email ?? '').trim() }))
      .filter((row) => row.name)
      .map((row) => (row.email ? row : { name: row.name, role: row.role }))
    raw.links = rows(form, 'links')
      .map((row) => ({ label: String(row.label ?? '').trim(), url: String(row.url ?? '').trim(), kind: String(row.kind ?? '').trim() }))
      .filter((row) => row.label && row.url)
    await saveProject(store, raw, sha)
  } catch (error) {
    return failure(error)
  }
  redirect('/admin/projet?ok=1')
}
