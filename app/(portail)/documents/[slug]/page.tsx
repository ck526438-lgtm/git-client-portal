import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Markdown from '@/components/markdown'
import { getContent } from '@/lib/content'

interface Params {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const content = await getContent()
  return content.docs.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const content = await getContent()
  const item = content.docs.find((entry) => entry.slug === slug)
  return { title: item ? `${item.title} — ${content.project.studio}` : 'Document introuvable' }
}

export default async function DocPage({ params }: Params) {
  const { slug } = await params
  const content = await getContent()
  const item = content.docs.find((entry) => entry.slug === slug)
  if (!item) notFound()

  return (
    <>
      <header className="detail-head">
        <Link className="backlink" href="/documents">
          ← Mode d'emploi
        </Link>
        <p className="eyebrow" style={{ marginTop: 18 }}>
          {item.category}
        </p>
        <h1>{item.title}</h1>
        {item.summary ? <p className="hero-summary">{item.summary}</p> : null}
      </header>

      <div className="stack">
        <Markdown source={item.body} />
      </div>
    </>
  )
}
