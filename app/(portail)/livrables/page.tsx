import Link from 'next/link'
import type { Metadata } from 'next'
import { Empty, Pill } from '@/components/ui'
import { getContent } from '@/lib/content'
import type { Deliverable } from '@/lib/types'
import { deliverableLabel, deliverableTone, frDate } from '@/lib/format'

export async function generateMetadata(): Promise<Metadata> {
  const { project } = await getContent()
  return { title: `Livrables — ${project.studio}` }
}

const BUCKETS: { id: string; title: string; note: string; pick: (item: Deliverable) => boolean }[] = [
  {
    id: 'avis',
    title: 'Votre avis est attendu',
    note: 'validez ou demandez des ajustements',
    pick: (item) => item.status === 'review' || item.status === 'changes',
  },
  {
    id: 'valides',
    title: 'Validés par vos équipes',
    note: 'référentiels en cours d’utilisation',
    pick: (item) => item.status === 'approved',
  },
  { id: 'autres', title: 'En préparation', note: 'pas encore soumis à validation', pick: (item) => item.status === 'draft' },
]

export default async function DeliverablesPage() {
  const content = await getContent()

  return (
    <>
      <header className="detail-head" style={{ paddingTop: 40 }}>
        <p className="eyebrow">Livrables</p>
        <h1>Ce que nous vous remettons</h1>
        <p className="hero-summary">
          Chaque document indique son statut et sa version. Un livrable validé devient la référence de travail : les
          modifications demandées après validation entrent dans le forfait prévu au cadrage.
        </p>
      </header>

      <div className="stack">
        {BUCKETS.map((bucket) => {
          const items = content.deliverables.filter(bucket.pick)
          if (items.length === 0) return null
          return (
            <section key={bucket.id}>
              <div className="panel-title">
                <h2 style={{ fontSize: 15, color: 'var(--ink-3)', fontWeight: 600 }}>{bucket.title}</h2>
                <span className="panel-note">{bucket.note}</span>
              </div>
              <div className="list">
                {items.map((item) => (
                  <Link className="row" href={`/livrables/${item.slug}`} key={item.slug}>
                    <span className="row-date">{item.date ? frDate(item.date) : '—'}</span>
                    <span className="row-main">
                      <span className="row-title">
                        {item.title}
                        <Pill tone={deliverableTone[item.status]}>{deliverableLabel[item.status]}</Pill>
                        {item.version ? <span className="pill" data-tone="neutral">{item.version}</span> : null}
                      </span>
                      <span className="row-sub">{item.summary}</span>
                    </span>
                    <span className="row-side">
                      {item.kind}
                      <br />
                      {item.files.length > 0 ? `${item.files.length} fichier${item.files.length > 1 ? 's' : ''}` : '—'}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}

        {content.deliverables.length === 0 ? <Empty>Aucun livrable publié pour l'instant.</Empty> : null}
      </div>
    </>
  )
}
