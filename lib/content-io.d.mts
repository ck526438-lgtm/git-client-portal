import type { Content, Deliverable, Invoice, Milestone, ProjectInfo, UpdateEntry } from './types'

export interface RawEntry {
  slug: string
  data: Record<string, unknown>
  body: string
  file: string
}

export const SLUG_RE: RegExp
export function buildContent(rootDir: string): Content
export function parseFrontmatter(raw: string, name: string): { data: Record<string, unknown>; body: string }
export function parseProject(raw: unknown): ProjectInfo
export function parseMilestones(raw: unknown): Milestone[]
export function parseUpdate(entry: RawEntry): UpdateEntry
export function parseDeliverable(entry: RawEntry): Deliverable
export function parseInvoice(entry: RawEntry, reference?: string): Invoice
