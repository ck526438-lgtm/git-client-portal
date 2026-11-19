import type { CSSProperties, ReactNode } from 'react'
import type { Metadata } from 'next'
import { getContent } from '@/lib/content'

export const metadata: Metadata = { title: 'Éditeur du portail', robots: { index: false, follow: false } }

export default async function AdminRoot({ children }: { children: ReactNode }) {
  const content = await getContent().catch(() => null)
  return (
    <div className="admin-root" style={{ '--accent': content?.project.accent ?? '#4f46e5' } as CSSProperties}>
      {children}
    </div>
  )
}
