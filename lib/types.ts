export type MilestoneStatus = 'done' | 'active' | 'planned' | 'blocked'
export type DeliverableStatus = 'draft' | 'review' | 'approved' | 'changes'
export type InvoiceStatus = 'draft' | 'unpaid' | 'paid'
export type UpdateKind = 'progress' | 'decision' | 'blocker' | 'release' | 'note'

export interface LinkItem {
  label: string
  url: string
  kind: string
}

export interface TeamMember {
  name: string
  role: string
  email: string
}

export interface ProjectInfo {
  studio: string
  tagline: string
  accent: string
  title: string
  client: string
  contact: string
  email: string
  reference: string
  summary: string
  started_on: string
  target_on: string
  status: 'active' | 'delivery' | 'paused' | 'done'
  team: TeamMember[]
  links: LinkItem[]
  support: { hours: string; note: string }
  billing: { legal: string; vat: string; iban: string; terms: string; penalty: string }
}

export interface Milestone {
  id: string
  title: string
  summary: string
  status: MilestoneStatus
  progress: number
  start: string
  due: string
}

export interface UpdateEntry {
  slug: string
  date: string
  title: string
  kind: UpdateKind
  summary: string
  milestone: string
  body: string
}

export interface Deliverable {
  slug: string
  title: string
  kind: string
  status: DeliverableStatus
  version: string
  date: string
  summary: string
  milestone: string
  files: LinkItem[]
  body: string
}

export interface InvoiceLine {
  label: string
  quantity: number
  unit_price: number
  total: number
}

export interface Invoice {
  slug: string
  number: string
  status: InvoiceStatus
  is_overdue: boolean
  issued_on: string
  due_on: string
  paid_on: string
  currency: string
  tax_rate: number
  lines: InvoiceLine[]
  subtotal: number
  tax: number
  total: number
  reference: string
  body: string
}

export interface DocEntry {
  slug: string
  title: string
  category: string
  date: string
  summary: string
  body: string
}

export interface Stats {
  overall: number
  milestones_done: number
  milestones_total: number
  next_milestone: Milestone | null
  approved: number
  awaiting_review: number
  deliverables_total: number
  updates_total: number
  last_update: UpdateEntry | null
  unpaid_count: number
  unpaid_total: number
  paid_total: number
  overdue_count: number
  currency: string
}

export interface Content {
  project: ProjectInfo
  milestones: Milestone[]
  updates: UpdateEntry[]
  deliverables: Deliverable[]
  invoices: Invoice[]
  docs: DocEntry[]
  meta: { built_at: string }
  stats: Stats
}
