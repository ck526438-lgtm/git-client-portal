import type { DeliverableStatus, InvoiceStatus, MilestoneStatus, UpdateKind } from './types'

const MONTH_DAY = { day: '2-digit', month: 'long', year: 'numeric' } as const
const SHORT = { day: '2-digit', month: 'short', year: 'numeric' } as const

export function frDate(iso: string, style: 'long' | 'short' = 'short'): string {
  if (!iso) return '—'
  const date = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('fr-FR', style === 'long' ? MONTH_DAY : SHORT).format(date)
}

export function money(amount: number, currency: string): string {
  const text = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 2,
  }).format(amount)
  // U+202F est absent de plusieurs polices systemes : le groupe visuel disparait a l'ecran.
  return text.replace(/[\u202F\u2009]/g, '\u00A0')
}

export function plural(count: number, singular: string, suffix = 's'): string {
  return count > 1 ? `${singular}${suffix}` : singular
}

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral'

export const milestoneLabel: Record<MilestoneStatus, string> = {
  done: 'Terminée',
  active: 'En cours',
  planned: 'À venir',
  blocked: 'Bloquée',
}

export const milestoneTone: Record<MilestoneStatus, Tone> = {
  done: 'ok',
  active: 'info',
  planned: 'neutral',
  blocked: 'bad',
}

export const deliverableLabel: Record<DeliverableStatus, string> = {
  draft: 'Brouillon',
  review: 'En revue',
  approved: 'Validé',
  changes: 'À reprendre',
}

export const deliverableTone: Record<DeliverableStatus, Tone> = {
  draft: 'neutral',
  review: 'warn',
  approved: 'ok',
  changes: 'bad',
}

const INVOICE_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Brouillon',
  unpaid: 'À régler',
  paid: 'Payée',
}

const INVOICE_TONES: Record<InvoiceStatus, Tone> = {
  draft: 'neutral',
  unpaid: 'warn',
  paid: 'ok',
}

export function invoiceLabel(invoice: { status: InvoiceStatus; is_overdue: boolean }): string {
  if (invoice.is_overdue) return 'En retard'
  return INVOICE_LABELS[invoice.status]
}

export function invoiceTone(invoice: { status: InvoiceStatus; is_overdue: boolean }): Tone {
  if (invoice.is_overdue) return 'bad'
  return INVOICE_TONES[invoice.status]
}

export const updateLabel: Record<UpdateKind, string> = {
  progress: 'Avancement',
  decision: 'Décision',
  blocker: 'Blocage',
  release: 'Livraison',
  note: 'Note',
}

export const updateTone: Record<UpdateKind, Tone> = {
  progress: 'info',
  decision: 'neutral',
  blocker: 'bad',
  release: 'ok',
  note: 'neutral',
}

export const projectStatusLabel: Record<string, string> = {
  active: 'Projet en cours',
  delivery: 'En phase de livraison',
  paused: 'En pause',
  done: 'Projet terminé',
}
