import yaml from 'js-yaml'
import {
  SLUG_RE,
  parseDeliverable,
  parseFrontmatter,
  parseInvoice,
  parseMilestones,
  parseProject,
  parseUpdate,
} from '../content-io.mjs'
import type { Deliverable, Invoice, Milestone, UpdateEntry } from '../types'
import { StoreError, type Store } from './store'

export type Kind = 'updates' | 'deliverables' | 'invoices'

export const KIND_LABEL: Record<Kind, { one: string; many: string; path: string }> = {
  updates: { one: 'nouvelle', many: 'Nouvelles', path: 'nouvelles' },
  deliverables: { one: 'livrable', many: 'Livrables', path: 'livrables' },
  invoices: { one: 'facture', many: 'Factures', path: 'factures' },
}

type Parsed<K extends Kind> = K extends 'updates' ? UpdateEntry : K extends 'deliverables' ? Deliverable : Invoice

export interface Loaded<K extends Kind> {
  slug: string
  file: string
  sha: string
  data: Record<string, unknown>
  body: string
  item: Parsed<K> | null
  error: string
}

const PARSERS = { updates: parseUpdate, deliverables: parseDeliverable, invoices: parseInvoice }

function message(error: unknown) {
  return (error as Error).message.replace(/^\[contenu\]\s*/, '')
}

export function serializeEntry(data: Record<string, unknown>, body: string): string {
  const clean = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== '' && value !== undefined && value !== null))
  return `---\n${yaml.dump(clean, { lineWidth: 110, quotingType: '"' })}---\n\n${body.trim()}\n`
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function loadEntries<K extends Kind>(store: Store, kind: K): Promise<Loaded<K>[]> {
  const names = (await store.list(`content/${kind}`)).filter((name) => name.endsWith('.md'))
  const entries = await Promise.all(names.map((name) => loadEntry(store, kind, name.replace(/\.md$/, ''))))
  return entries.filter((entry): entry is Loaded<K> => entry !== null)
}

export async function loadEntry<K extends Kind>(store: Store, kind: K, slug: string): Promise<Loaded<K> | null> {
  if (!SLUG_RE.test(slug)) return null
  const file = `content/${kind}/${slug}.md`
  const stored = await store.read(file)
  if (!stored) return null
  try {
    const { data, body } = parseFrontmatter(stored.text, `${slug}.md`)
    let item: Parsed<K> | null = null
    let error = ''
    try {
      item = PARSERS[kind]({ slug, data, body, file: `${slug}.md` }) as Parsed<K>
    } catch (problem) {
      error = message(problem)
    }
    return { slug, file, sha: stored.sha, data, body, item, error }
  } catch (problem) {
    return { slug, file, sha: stored.sha, data: {}, body: stored.text, item: null, error: message(problem) }
  }
}

/** Vérifie avec les mêmes règles que le build, puis enregistre (commit). */
export async function saveEntry(
  store: Store,
  kind: Kind,
  options: { slug?: string; sha?: string; data: Record<string, unknown>; body: string; slugHint: string },
): Promise<string> {
  let slug = options.slug
  if (!slug) {
    const base = slugify(options.slugHint) || KIND_LABEL[kind].one
    const existing = new Set((await store.list(`content/${kind}`)).map((name) => name.replace(/\.md$/, '')))
    slug = base
    for (let index = 2; existing.has(slug); index += 1) slug = `${base}-${index}`
  }
  if (!SLUG_RE.test(slug)) throw new StoreError('Identifiant de fichier invalide.')

  const text = serializeEntry(options.data, options.body)
  const { data, body } = parseFrontmatter(text, `${slug}.md`)
  try {
    PARSERS[kind]({ slug, data, body, file: `${slug}.md` })
  } catch (problem) {
    throw new StoreError(message(problem))
  }

  const verb = options.slug ? 'Met à jour' : 'Ajoute'
  const title = String(options.data.title ?? options.data.number ?? slug)
  await store.write(`content/${kind}/${slug}.md`, text, `${verb} ${KIND_LABEL[kind].one} « ${title} » (éditeur)`, options.sha)
  return slug
}

export async function deleteEntry(store: Store, kind: Kind, slug: string, sha: string) {
  if (!SLUG_RE.test(slug)) throw new StoreError('Identifiant de fichier invalide.')
  await store.remove(`content/${kind}/${slug}.md`, `Supprime ${KIND_LABEL[kind].one} « ${slug} » (éditeur)`, sha)
}

// ---------- project.yaml ----------

export async function loadProject(store: Store) {
  const stored = await store.read('content/project.yaml')
  if (!stored) throw new StoreError('content/project.yaml est introuvable dans le dépôt.')
  const raw = (yaml.load(stored.text) ?? {}) as Record<string, any>
  return { raw, sha: stored.sha }
}

export async function saveProject(store: Store, raw: Record<string, unknown>, sha: string) {
  try {
    parseProject(raw)
  } catch (problem) {
    throw new StoreError(message(problem))
  }
  const text = `# Modifié depuis l'éditeur du portail.\n${yaml.dump(raw, { lineWidth: 110, quotingType: '"' })}`
  await store.write('content/project.yaml', text, 'Met à jour les informations du projet (éditeur)', sha)
}

// ---------- milestones.yaml ----------

export async function loadMilestones(store: Store): Promise<{ items: Milestone[]; sha: string; error: string }> {
  const stored = await store.read('content/milestones.yaml')
  if (!stored) return { items: [], sha: '', error: '' }
  try {
    return { items: parseMilestones(yaml.load(stored.text)), sha: stored.sha, error: '' }
  } catch (problem) {
    return { items: [], sha: stored.sha, error: message(problem) }
  }
}

export async function saveMilestones(store: Store, items: Omit<Milestone, 'summary'>[] & { summary?: string }[], sha: string) {
  const raw = {
    milestones: items.map((item) =>
      Object.fromEntries(Object.entries(item).filter(([, value]) => value !== '' && value !== undefined)),
    ),
  }
  try {
    parseMilestones(raw)
  } catch (problem) {
    throw new StoreError(message(problem))
  }
  const text = `# Modifié depuis l'éditeur du portail.\n${yaml.dump(raw, { lineWidth: 110 })}`
  await store.write('content/milestones.yaml', text, 'Met à jour le planning (éditeur)', sha || undefined)
}
