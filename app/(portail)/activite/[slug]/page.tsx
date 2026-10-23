import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Markdown from '@/components/markdown'
import { Pill } from '@/components/ui'
import { getContent } from '@/lib/content'
import { frDate, updateLabel, updateTone } from '@/lib/format'
import { mailtoLink } from '@/lib/mailto'

interface Params {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const content = await getContent()
  return content.updates.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const content = await getContent()
  const item = content.updates.find((entry) => entry.slug === slug)
  return { title: item ? `${item.title} — ${content.project.studio}` : 'Publication introuvable' }
}

export default async function ActivityDetailPage({ params }: Params) {
  const { slug } = await params
  const content = await getContent()
  const index = content.updates.findIndex((entry) => entry.slug === slug)
  if (index === -1) notFound()

  const item = content.updates[index]
  const milestone = content.milestones.find((entry) => entry.id === item.milestone)
  const previous = content.updates[index + 1]
  const next = content.updates[index - 1]

  return (
    <>
      <header className="detail-head">
        <Link className="backlink" href="/activite">
          ← Journal du projet
        </Link>
        <p className="eyebrow" style={{ marginTop: 18 }}>
          {frDate(item.date, 'long')}
        </p>
        <h1>{item.title}</h1>
        <div className="chips">
          <Pill tone={updateTone[item.kind]}>{updateLabel[item.kind]}</Pill>
          {milestone ? <span className="pill" data-tone="neutral">Étape : {milestone.title}</span> : null}
        </div>
      </header>

      <div className="stack">
        <Markdown source={item.body} />
      </div>

      {content.project.email ? (
        <p style={{ marginTop: 28 }}>
          <a
            className="btn primary"
            href={mailtoLink(content.project.email, `Re: ${item.title}`, "\n\n—\nRéponse depuis le portail client.")}
          >
            Répondre à cette nouvelle
          </a>
        </p>
      ) : null}

      <nav className="footer" style={{ marginTop: 34 }}>
        <span>{previous ? <Link href={`/activite/${previous.slug}`}>← {previous.title}</Link> : 'Début du journal'}</span>
        <span>{next ? <Link href={`/activite/${next.slug}`}>{next.title} →</Link> : 'Publication la plus récente'}</span>
      </nav>
    </>
  )
}
