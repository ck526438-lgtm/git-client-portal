/**
 * Lecteur du contenu du portail : lit project.yaml, milestones.yaml et les fichiers
 * Markdown à frontmatter. Utilisé au développement (lecture disque) et sérialisé dans
 * generated/content.json pour le build (bundle serverless garanti).
 */
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const SLUG_RE = /^[a-z0-9][a-z0-9._-]*$/

const MILESTONE = ['done', 'active', 'planned', 'blocked']
const DELIVERABLE = ['draft', 'review', 'approved', 'changes']
const INVOICE = ['draft', 'unpaid', 'paid']
const UPDATE = ['progress', 'decision', 'blocker', 'release', 'note']

function fail(file, message) {
  throw new Error(`[contenu] ${file} : ${message}`)
}

function readYaml(file, name) {
  if (!fs.existsSync(file)) fail(name, 'fichier manquant')
  let data
  try {
    data = yaml.load(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    fail(name, `YAML invalide (${error.message})`)
  }
  if (data === null || typeof data !== 'object') fail(name, 'contenu vide')
  return data
}

function parseFrontmatter(raw, name) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) fail(name, 'bloc de metadatas "---" manquant en debut de fichier')
  let data
  try {
    data = yaml.load(match[1]) || {}
  } catch (error) {
    fail(name, `metadatas YAML invalides (${error.message})`)
  }
  if (typeof data !== 'object') fail(name, 'metadatas invalides')
  return { data, body: raw.slice(match[0].length).trim() }
}

function readEntries(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '')
      if (!SLUG_RE.test(slug)) fail(file, 'nom de fichier invalide (minuscules, chiffres, tirets)')
      const parsed = parseFrontmatter(fs.readFileSync(path.join(dir, file), 'utf8'), file)
      return { slug, ...parsed, file }
    })
}

function text(data, key, file, { required = true, max = 400 } = {}) {
  const value = data[key]
  if (value === undefined || value === null || value === '') {
    if (required) fail(file, `champ "${key}" requis`)
    return ''
  }
  if (typeof value !== 'string') fail(file, `champ "${key}" doit etre du texte`)
  if (value.length > max) fail(file, `champ "${key}" trop long (${max} caracteres max)`)
  return value
}

function isoDate(data, key, file, { required = true } = {}) {
  const value = data[key]
  if (value === undefined || value === null || value === '') {
    if (required) fail(file, `champ "${key}" requis (format AAAA-MM-JJ)`)
    return ''
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    fail(file, `champ "${key}" : format de date attendu AAAA-MM-JJ, recu "${value}"`)
  }
  return value
}

function choice(data, key, allowed, file, fallback) {
  const value = data[key]
  if (value === undefined || value === null || value === '') {
    if (fallback) return fallback
    fail(file, `champ "${key}" requis (${allowed.join(' | ')})`)
  }
  if (!allowed.includes(value)) {
    fail(file, `champ "${key}" : "${value}" inconnu (${allowed.join(' | ')})`)
  }
  return value
}

function number(data, key, file, { required = true, min = 0, max = Infinity } = {}) {
  const value = data[key]
  if (value === undefined || value === null || value === '') {
    if (required) fail(file, `champ "${key}" requis`)
    return 0
  }
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/ /g, '').replace(',', '.'))
  if (!Number.isFinite(parsed)) fail(file, `champ "${key}" : nombre attendu, recu "${value}"`)
  if (parsed < min || parsed > max) fail(file, `champ "${key}" hors limites (${min}..${max})`)
  return parsed
}

function list(data, key) {
  const value = data[key]
  if (Array.isArray(value)) return value
  if (value === undefined || value === null) return []
  throw new Error(`[contenu] champ "${key}" doit etre une liste`)
}

function links(data, key, file) {
  return list(data, key).map((item, index) => {
    if (typeof item === 'string') {
      return { label: `Document ${index + 1}`, url: safeUrl(item, file), kind: '' }
    }
    if (!item || typeof item !== 'object') fail(file, `"${key}[${index}]" doit etre un lien ou un objet`)
    return {
      label: text(item, 'label', file),
      url: safeUrl(item.url, file, key),
      kind: text(item, 'kind', file, { required: false, max: 40 }),
    }
  })
}

function safeUrl(value, file, key = 'url') {
  if (typeof value !== 'string' || value.trim() === '') fail(file, `champ "${key}.url" requis`)
  const url = value.trim()
  const ok = /^https?:\/\//i.test(url) || /^mailto:/i.test(url) || url.startsWith('/')
  if (!ok) fail(file, `lien non autorise "${url}" (http, https, mailto ou /chemin)`)
  return url
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function money(amount) {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100
}

function buildProject(rootDir) {
  const file = path.join(rootDir, 'content', 'project.yaml')
  const raw = readYaml(file, 'project.yaml')
  const branding = raw.branding || {}
  const info = raw.project || raw
  const status = choice(raw, 'status', ['active', 'delivery', 'paused', 'done'], 'project.yaml', 'active')

  return {
    studio: text(branding, 'studio', 'project.yaml'),
    tagline: text(branding, 'tagline', 'project.yaml', { required: false, max: 120 }),
    accent: /^#[0-9a-fA-F]{6}$/.test(String(branding.accent || '')) ? String(branding.accent) : '#4f46e5',
    title: text(info, 'title', 'project.yaml'),
    client: text(info, 'client', 'project.yaml'),
    contact: text(info, 'contact', 'project.yaml', { required: false, max: 80 }),
    email: safeEmail(raw.contact?.email, 'project.yaml'),
    reference: text(info, 'reference', 'project.yaml', { required: false, max: 40 }),
    summary: text(info, 'summary', 'project.yaml', { required: false, max: 600 }),
    started_on: isoDate(info, 'started_on', 'project.yaml', { required: false }),
    target_on: isoDate(info, 'target_on', 'project.yaml', { required: false }),
    status,
    team: list(raw, 'team').map((member, index) => ({
      name: text(member, 'name', `project.yaml (team[${index}])`),
      role: text(member, 'role', `project.yaml (team[${index}])`),
      email: member.email ? safeEmail(member.email, `project.yaml (team[${index}])`) : '',
    })),
    links: links(raw, 'links', 'project.yaml'),
    support: {
      hours: text(raw.support || {}, 'hours', 'project.yaml', { required: false, max: 120 }),
      note: text(raw.support || {}, 'note', 'project.yaml', { required: false, max: 300 }),
    },
    billing: {
      legal: text(raw.billing || {}, 'legal', 'project.yaml', { required: false, max: 160 }),
      vat: text(raw.billing || {}, 'vat', 'project.yaml', { required: false, max: 40 }),
      iban: text(raw.billing || {}, 'iban', 'project.yaml', { required: false, max: 40 }),
      terms: text(raw.billing || {}, 'terms', 'project.yaml', { required: false, max: 200 }),
      penalty: text(raw.billing || {}, 'penalty', 'project.yaml', { required: false, max: 200 }),
    },
  }
}

function safeEmail(value, file) {
  if (typeof value !== 'string' || value.trim() === '') return ''
  if (value.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    fail(file, `adresse e-mail invalide "${value}"`)
  }
  return value.trim()
}

function buildMilestones(rootDir) {
  const file = path.join(rootDir, 'content', 'milestones.yaml')
  if (!fs.existsSync(file)) return []
  const raw = readYaml(file, 'milestones.yaml')
  const items = Array.isArray(raw.milestones) ? raw.milestones : raw
  if (!Array.isArray(items)) fail('milestones.yaml', 'liste "milestones" attendue')

  return items.map((item, index) => {
    const name = `milestones.yaml (etape ${index + 1})`
    const id = text(item, 'id', name).toLowerCase().replace(/[^a-z0-9-]+/g, '-')
    const status = choice(item, 'status', MILESTONE, name)
    let progress = number(item, 'progress', name, { required: false, min: 0, max: 100 })
    if (status === 'done') progress = 100
    if (status === 'planned' && item.progress === undefined) progress = 0
    if (status === 'blocked' && item.progress === undefined) progress = 0
    return {
      id,
      title: text(item, 'title', name),
      summary: text(item, 'summary', name, { required: false, max: 400 }),
      status,
      progress,
      start: isoDate(item, 'start', name, { required: false }),
      due: isoDate(item, 'due', name, { required: false }),
    }
  })
}

function buildUpdates(rootDir) {
  return readEntries(path.join(rootDir, 'content', 'updates'))
    .filter((entry) => entry.data.published !== false)
    .map((entry) => ({
      slug: entry.slug,
      date: isoDate(entry.data, 'date', entry.file),
      title: text(entry.data, 'title', entry.file, { max: 160 }),
      kind: choice(entry.data, 'kind', UPDATE, entry.file, 'progress'),
      summary: text(entry.data, 'summary', entry.file, { required: false, max: 300 }),
      milestone: text(entry.data, 'milestone', entry.file, { required: false, max: 60 }),
      body: entry.body,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)))
}

function buildDeliverables(rootDir) {
  return readEntries(path.join(rootDir, 'content', 'deliverables'))
    .filter((entry) => entry.data.published !== false)
    .map((entry) => ({
      slug: entry.slug,
      title: text(entry.data, 'title', entry.file, { max: 160 }),
      kind: text(entry.data, 'kind', entry.file, { required: false, max: 40 }) || 'livrable',
      status: choice(entry.data, 'status', DELIVERABLE, entry.file),
      version: text(entry.data, 'version', entry.file, { required: false, max: 20 }),
      date: isoDate(entry.data, 'date', entry.file, { required: false }),
      summary: text(entry.data, 'summary', entry.file, { required: false, max: 300 }),
      milestone: text(entry.data, 'milestone', entry.file, { required: false, max: 60 }),
      files: links(entry.data, 'files', entry.file),
      body: entry.body,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)))
}

function buildInvoices(rootDir) {
  const reference = today()
  return readEntries(path.join(rootDir, 'content', 'invoices'))
    .filter((entry) => entry.data.published !== false)
    .map((entry) => {
      const status = choice(entry.data, 'status', INVOICE, entry.file)
      const currency = text(entry.data, 'currency', entry.file, { required: false, max: 8 }).toUpperCase() || 'EUR'
      const taxRate = number(entry.data, 'tax_rate', entry.file, { required: false, min: 0, max: 100 })
      const rawLines = list(entry.data, 'lines')
      const lines = rawLines.map((line, index) => {
        const name = `${entry.file} (ligne ${index + 1})`
        const quantity = number(line, 'quantity', name, { required: false, min: 0 }) || 1
        const unit = number(line, 'unit_price', name)
        return {
          label: text(line, 'label', name),
          quantity,
          unit_price: money(unit),
          total: money(quantity * unit),
        }
      })
      const subtotal =
        lines.length > 0 ? money(lines.reduce((sum, line) => sum + line.total, 0)) : number(entry.data, 'amount_ht', entry.file)
      const tax = money((subtotal * taxRate) / 100)
      const dueOn = isoDate(entry.data, 'due_on', entry.file)
      const paidOn = isoDate(entry.data, 'paid_on', entry.file, { required: false })
      return {
        slug: entry.slug,
        number: text(entry.data, 'number', entry.file, { max: 40 }),
        status,
        is_overdue: status === 'unpaid' && dueOn !== '' && dueOn < reference,
        issued_on: isoDate(entry.data, 'issued_on', entry.file),
        due_on: dueOn,
        paid_on: paidOn,
        currency,
        tax_rate: taxRate,
        lines,
        subtotal,
        tax,
        total: money(subtotal + tax),
        reference: text(entry.data, 'reference', entry.file, { required: false, max: 60 }),
        body: entry.body,
      }
    })
    .sort((a, b) => (a.issued_on < b.issued_on ? 1 : -1))
}

function buildDocs(rootDir) {
  return readEntries(path.join(rootDir, 'content', 'docs'))
    .filter((entry) => entry.data.published !== false)
    .map((entry) => ({
      slug: entry.slug,
      title: text(entry.data, 'title', entry.file, { max: 160 }),
      category: text(entry.data, 'category', entry.file, { required: false, max: 60 }) || 'Document',
      date: isoDate(entry.data, 'date', entry.file, { required: false }),
      summary: text(entry.data, 'summary', entry.file, { required: false, max: 300 }),
      body: entry.body,
    }))
    .sort((a, b) => a.category.localeCompare(b.category) || (a.date < b.date ? 1 : -1))
}

function buildStats(content) {
  const milestones = content.milestones
  const done = milestones.filter((item) => item.status === 'done').length
  const overall =
    milestones.length > 0
      ? Math.round(milestones.reduce((sum, item) => sum + item.progress, 0) / milestones.length)
      : content.project.status === 'done'
        ? 100
        : 0

  const unpaid = content.invoices.filter((item) => item.status === 'unpaid')
  return {
    overall,
    milestones_done: done,
    milestones_total: milestones.length,
    next_milestone:
      milestones
        .filter((item) => item.status === 'active' || item.status === 'planned' || item.status === 'blocked')
        .sort((a, b) => (a.due && b.due ? a.due.localeCompare(b.due) : 0))[0] || null,
    approved: content.deliverables.filter((item) => item.status === 'approved').length,
    awaiting_review: content.deliverables.filter((item) => item.status === 'review').length,
    deliverables_total: content.deliverables.length,
    updates_total: content.updates.length,
    last_update: content.updates[0] || null,
    unpaid_count: unpaid.length,
    unpaid_total: money(unpaid.reduce((sum, item) => sum + item.total, 0)),
    paid_total: money(
      content.invoices.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.total, 0),
    ),
    overdue_count: content.invoices.filter((item) => item.is_overdue).length,
    currency: content.invoices[0]?.currency || 'EUR',
  }
}

export function buildContent(rootDir) {
  const content = {
    project: buildProject(rootDir),
    milestones: buildMilestones(rootDir),
    updates: buildUpdates(rootDir),
    deliverables: buildDeliverables(rootDir),
    invoices: buildInvoices(rootDir),
    docs: buildDocs(rootDir),
    meta: { built_at: new Date().toISOString() },
  }
  content.stats = buildStats(content)
  return content
}
