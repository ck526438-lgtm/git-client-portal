import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Markdown from '@/components/markdown'
import { Pill } from '@/components/ui'
import { getContent } from '@/lib/content'
import { deliverableLabel, deliverableTone, frDate } from '@/lib/format'
import { mailtoLink } from '@/lib/mailto'

interface Params {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const content = await getContent()
  return content.deliverables.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const content = await getContent()
  const item = content.deliverables.find((entry) => entry.slug === slug)
  return { title: item ? `${item.title} — ${content.project.studio}` : 'Livrable introuvable' }
}

export default async function DeliverableDetailPage({ params }: Params) {
  const { slug } = await params
  const content = await getContent()
  const item = content.deliverables.find((entry) => entry.slug === slug)
  if (!item) notFound()

  const milestone = content.milestones.find((entry) => entry.id === item.milestone)
  const guide = content.docs.find((entry) => entry.slug === 'valider-un-livrable')

  return (
    <>
      <header className="detail-head">
        <Link className="backlink" href="/livrables">
          ← Tous les livrables
        </Link>
        <p className="eyebrow" style={{ marginTop: 18 }}>
          {item.kind}
          {item.version ? ` · ${item.version}` : ''}
          {item.date ? ` · ${frDate(item.date, 'long')}` : ''}
        </p>
        <h1>{item.title}</h1>
        <div className="chips">
          <Pill tone={deliverableTone[item.status]}>{deliverableLabel[item.status]}</Pill>
          {milestone ? <span className="pill" data-tone="neutral">Étape : {milestone.title}</span> : null}
        </div>
        {item.summary ? <p className="hero-summary">{item.summary}</p> : null}
      </header>

      {item.files.length > 0 ? (
        <div className="chips no-print" style={{ marginTop: 22 }}>
          {item.files.map((file) => (
            <a className="btn primary" href={file.url} key={file.url}>
              {file.label}
            </a>
          ))}
        </div>
      ) : null}

      <div className="stack">
        <Markdown source={item.body} />
      </div>

      {content.project.email ? (
        <div className="card card-pad no-print" style={{ marginTop: 30 }}>
          <div className="panel-title">
            <h2>Votre réponse</h2>
            {guide ? (
              <Link className="panel-note" href={`/documents/${guide.slug}`}>
                Comment bien valider
              </Link>
            ) : null}
          </div>
          <p className="hero-summary" style={{ marginTop: 0 }}>
            Le portail est en lecture seule : votre validation nous parvient par e-mail, en une fois, et elle est reportée
            dans le journal d’activité du projet.
          </p>
          <div className="chips">
            <a
              className="btn primary"
              href={mailtoLink(
                content.project.email,
                `Validation : ${item.title} ${item.version}`.trim(),
                "Nous validons ce livrable en l'état.\n\n—\n" + item.title,
              )}
            >
              Valider ce livrable
            </a>
            <a
              className="btn"
              href={mailtoLink(
                content.project.email,
                `Retours : ${item.title} ${item.version}`.trim(),
                "Points à corriger :\n1. \n2. \n\n—\n" + item.title,
              )}
            >
              Demander des ajustements
            </a>
          </div>
        </div>
      ) : null}
    </>
  )
}
