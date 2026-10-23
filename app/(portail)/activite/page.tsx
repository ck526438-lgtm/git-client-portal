import Link from 'next/link'
import type { Metadata } from 'next'
import { Empty, Pill } from '@/components/ui'
import { getContent } from '@/lib/content'
import { frDate, updateLabel, updateTone } from '@/lib/format'

export async function generateMetadata(): Promise<Metadata> {
  const { project } = await getContent()
  return { title: `Activité — ${project.studio}` }
}

export default async function ActivityPage() {
  const content = await getContent()

  const groups: { label: string; items: typeof content.updates }[] = []
  for (const item of content.updates) {
    const label = frDate(item.date, 'long').replace(/^\d+ /, '').replace(/^1 /, '')
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }

  return (
    <>
      <header className="detail-head" style={{ paddingTop: 40 }}>
        <p className="eyebrow">Journal</p>
        <h1>Ce qui s'est passé, dans l'ordre</h1>
        <p className="hero-summary">
          Chaque publication correspond à une avancée réelle du projet : décision prise, livraison, ou point de blocage.
          Rien n'est masqué.
        </p>
      </header>

      {content.updates.length === 0 ? (
        <div className="stack">
          <Empty>Aucune publication pour l'instant.</Empty>
        </div>
      ) : null}

      <div className="stack">
        {groups.map((group) => (
          <section key={group.label}>
            <div className="panel-title" style={{ marginTop: 10 }}>
              <h2 style={{ fontSize: 15, color: 'var(--ink-3)', fontWeight: 600 }}>{group.label}</h2>
              <span className="panel-note">
                {group.items.length} publication{group.items.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="list">
              {group.items.map((item) => (
                <Link className="row" href={`/activite/${item.slug}`} key={item.slug}>
                  <span className="row-date">{frDate(item.date)}</span>
                  <span className="row-main">
                    <span className="row-title">
                      {item.title}
                      <Pill tone={updateTone[item.kind]}>{updateLabel[item.kind]}</Pill>
                    </span>
                    <span className="row-sub">{item.summary || item.body.slice(0, 150)}</span>
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
