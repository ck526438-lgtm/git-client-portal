import Link from 'next/link'
import type { Metadata } from 'next'
import { Empty } from '@/components/ui'
import { getContent } from '@/lib/content'
import { frDate } from '@/lib/format'

export async function generateMetadata(): Promise<Metadata> {
  const { project } = await getContent()
  return { title: `Documents — ${project.studio}` }
}

export default async function DocsPage() {
  const content = await getContent()

  const groups: { category: string; items: typeof content.docs }[] = []
  for (const item of content.docs) {
    const last = groups[groups.length - 1]
    if (last && last.category === item.category) last.items.push(item)
    else groups.push({ category: item.category, items: [item] })
  }

  return (
    <>
      <header className="detail-head" style={{ paddingTop: 40 }}>
        <p className="eyebrow">Mode d'emploi</p>
        <h1>Comment nous travaillons ensemble</h1>
        <p className="hero-summary">
          Quatre pages courtes, écrites une fois, qui évitent la plupart des malentendus : valider un livrable, préparer
          les contenus, tenir le planning, régler une facture.
        </p>
      </header>

      {content.docs.length === 0 ? (
        <div className="stack">
          <Empty>Aucun document publié.</Empty>
        </div>
      ) : null}

      <div className="stack">
        {groups.map((group) => (
          <section key={group.category}>
            <div className="panel-title">
              <h2 style={{ fontSize: 15, color: 'var(--ink-3)', fontWeight: 600 }}>{group.category}</h2>
            </div>
            <div className="list">
              {group.items.map((item) => (
                <Link className="row" href={`/documents/${item.slug}`} key={item.slug}>
                  <span className="row-date">{item.date ? frDate(item.date) : '—'}</span>
                  <span className="row-main">
                    <span className="row-title">{item.title}</span>
                    <span className="row-sub">{item.summary}</span>
                  </span>
                  <span className="row-side">Lire</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
